import { createHash } from 'node:crypto'
import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readRegisteredPages } from './page-registry.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const output = path.join(root, 'dist', 'preview')
const allowedFiles = new Set(['index.html', 'app.js', 'styles.css', 'README.md', 'PAGES.md', 'manifest.json', 'SHA256SUMS'])
const contentFiles = ['index.html', 'app.js', 'styles.css', 'README.md', 'PAGES.md']
const hashFiles = [...contentFiles, 'manifest.json']
const errors = []

function issue(message) { errors.push(message) }

function hasRasterSignature(mime, bytes) {
  if (mime === 'png') return bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  if (mime === 'jpeg') return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  if (mime === 'gif') return bytes.length >= 6 && ['GIF87a', 'GIF89a'].includes(bytes.toString('ascii', 0, 6))
  if (mime === 'webp') return bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP'
  if (mime === 'avif') return bytes.length >= 12 && bytes.toString('ascii', 4, 8) === 'ftyp' && ['avif', 'avis'].includes(bytes.toString('ascii', 8, 12))
  return false
}

function stripValidatedRasterDataUrls(stylesheet) {
  const dataUrlPattern = /url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))\s*\)/gi
  return stylesheet.replace(dataUrlPattern, (match, doubleQuoted, singleQuoted, unquoted) => {
    const value = (doubleQuoted ?? singleQuoted ?? unquoted ?? '').trim()
    if (!/^data:/i.test(value)) return match

    const parsed = /^data:image\/(png|jpeg|gif|webp|avif);base64,([\s\S]*)$/i.exec(value)
    if (!parsed) return match

    const [, mime, payload] = parsed
    const canonicalBase64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(payload)
    const bytes = canonicalBase64 ? Buffer.from(payload, 'base64') : Buffer.alloc(0)
    if (!canonicalBase64 || bytes.toString('base64') !== payload || !hasRasterSignature(mime.toLowerCase(), bytes)) {
      issue('样式表包含格式无效或 MIME 不匹配的栅格图片 data URI。')
      return match
    }
    return 'url(embedded-raster-image)'
  })
}

try {
  const entries = await readdir(output, { withFileTypes: true })
  const names = new Set(entries.map((entry) => entry.name))
  for (const entry of entries) {
    if (!entry.isFile()) issue(`禁入目录或非文件：${entry.name}`)
    if (!allowedFiles.has(entry.name)) issue(`不在白名单中的产物：${entry.name}`)
  }
  for (const file of allowedFiles) if (!names.has(file)) issue(`缺少必要产物：${file}`)

  for (const required of ['index.html', 'app.js', 'styles.css', 'README.md', 'PAGES.md', 'manifest.json', 'SHA256SUMS']) {
    if (names.has(required) && !(await stat(path.join(output, required))).isFile()) issue(`产物不是普通文件：${required}`)
  }

  const html = await readFile(path.join(output, 'index.html'), 'utf8')
  const app = await readFile(path.join(output, 'app.js'), 'utf8')
  const css = await readFile(path.join(output, 'styles.css'), 'utf8')
  const manifest = JSON.parse(await readFile(path.join(output, 'manifest.json'), 'utf8'))
  const sumsText = await readFile(path.join(output, 'SHA256SUMS'), 'utf8')

  const references = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/gi)].map((match) => match[1])
  for (const reference of references) {
    if (/^(?:[a-z]+:|\/\/|\/|#)/i.test(reference)) {
      issue(`入口包含非相对资源引用：${reference}`)
      continue
    }
    const decoded = decodeURIComponent(reference.split(/[?#]/)[0])
    const resolved = path.resolve(output, decoded)
    if (!resolved.startsWith(`${output}${path.sep}`) || !(await stat(resolved).catch(() => null))?.isFile()) {
      issue(`入口资源不存在或越界：${reference}`)
    }
  }
  if (!references.includes('./app.js') || !references.includes('./styles.css')) issue('入口必须引用本地 app.js 和 styles.css。')
  if (/\bimport\s*(?:\(|\{)|\bexport\s|\bprocess\.env\./i.test(app)) issue('JavaScript 仍含模块语法或未替换环境变量。')
  if (/<script[^>]+type=["']module|https?:\/\//i.test(html)) issue('HTML 仍含模块脚本或外部资源。')
  const checkedCss = stripValidatedRasterDataUrls(css)
  if (/https?:\/\//i.test(checkedCss) || /url\(\s*["']?(?:data:|https?:|\/\/)/i.test(checkedCss)) issue('样式表包含外部或非本地 URL。')
  if (/\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon)\s*\(/.test(app)) issue('运行脚本包含网络请求 API。')

  const registry = await readFile(path.join(root, 'src', 'app', 'page-registry.ts'), 'utf8')
  const registeredPages = readRegisteredPages(registry)
  const findDuplicates = (values) => {
    const counts = new Map()
    for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
    return [...counts].filter(([, count]) => count > 1).map(([value]) => value)
  }

  if (manifest.name !== 'tg-studio-vue-prototype-preview') issue('manifest 名称与离线预览包不一致。')
  if (JSON.stringify(manifest.files) !== JSON.stringify(contentFiles)) issue('manifest 文件清单与离线包内容文件不一致。')
  const manifestPages = Array.isArray(manifest.pages) ? manifest.pages : []
  const manifestRoutes = manifestPages.map((page) => page?.route).filter((route) => typeof route === 'string')
  for (const route of findDuplicates(manifestRoutes)) issue(`manifest 页面清单包含重复路由：${route}`)

  if (manifestPages.length !== registeredPages.length) issue('manifest 页面数量与源码注册表不一致。')
  for (let index = 0; index < registeredPages.length; index += 1) {
    const registered = registeredPages[index]
    const packaged = manifestPages[index]
    if (packaged?.route !== registered.route || packaged?.title !== registered.title) {
      issue(`manifest 页面路由或标题与源码页面注册表不一致：${registered.route}`)
    }
    if (!app.includes(registered.route)) issue(`页面路由未进入离线包脚本：${registered.route}`)
  }
  const expectedPages = `# 页面清单\n\n| 路由 | 页面 |\n| --- | --- |\n${registeredPages.map(({ route, title }) => `| ${route} | ${title} |`).join('\n')}\n`
  if ((await readFile(path.join(output, 'PAGES.md'), 'utf8')) !== expectedPages) issue('PAGES.md 与源码页面注册表不一致。')
  for (const dependency of Object.keys(JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8')).dependencies ?? {})) {
    if (!app.includes(dependency.split('/').at(-1))) issue(`运行依赖可能未打入本地 bundle：${dependency}`)
  }

  const sums = new Map()
  for (const line of sumsText.split(/\r?\n/).filter(Boolean)) {
    const [, hash, file] = line.match(/^([a-f0-9]{64})\s+\*?([^\s]+)$/i) ?? []
    if (!hash || !file) { issue('SHA256SUMS 格式无效。'); continue }
    if (sums.has(file)) { issue(`SHA256SUMS 包含重复条目：${file}`); continue }
    sums.set(file, hash)
  }
  for (const file of sums.keys()) if (!hashFiles.includes(file)) issue(`SHA256SUMS 包含额外文件：${file}`)
  for (const file of hashFiles) if (!sums.has(file)) issue(`SHA256SUMS 缺少文件：${file}`)
  for (const [file, expected] of sums) {
    if (!allowedFiles.has(file) || !expected) { issue(`SHA256SUMS 格式或文件名无效：${file}`); continue }
    const actual = createHash('sha256').update(await readFile(path.join(output, file))).digest('hex')
    if (actual !== expected) issue(`文件校验值不匹配：${file}`)
  }
} catch (error) {
  issue(`无法完成离线包审计：${error.message}`)
}

if (errors.length) {
  for (const error of errors) console.error(`PREVIEW_VERIFY: ${error}`)
  process.exitCode = 1
} else {
  console.log('离线包审计通过：入口、路由、相对资源、目录白名单、依赖边界和 SHA256 均符合要求。')
}
