import { createHash } from 'node:crypto'
import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { formatPagesMarkdown, readRegisteredPages } from './page-registry.mjs'
import { generateVueRuntimeNotices, THIRD_PARTY_NOTICES_FILE } from './vue-runtime-notices.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const output = path.join(root, 'dist', 'preview')
const allowedFiles = new Set(['index.html', 'app.js', 'styles.css', 'README.md', 'PAGES.md', THIRD_PARTY_NOTICES_FILE, 'manifest.json', 'SHA256SUMS'])
const contentFiles = ['index.html', 'app.js', 'styles.css', 'README.md', 'PAGES.md', THIRD_PARTY_NOTICES_FILE]
const hashFiles = [...contentFiles, 'manifest.json']
const errors = []

function issue(message) { errors.push(message) }

function isSupportedRasterDataUri(reference) {
  const match = reference.match(/^data:image\/(?:png|jpeg|gif|webp|avif);base64,([A-Za-z0-9+/]+={0,2})$/i)
  if (!match || match[1].length % 4 !== 0) return false

  const bytes = Buffer.from(match[1], 'base64')
  return bytes.length > 0 && bytes.toString('base64') === match[1]
}

try {
  const entries = await readdir(output, { withFileTypes: true })
  const names = new Set(entries.map((entry) => entry.name))
  for (const entry of entries) {
    if (!entry.isFile()) issue(`禁入目录或非文件：${entry.name}`)
    if (!allowedFiles.has(entry.name)) issue(`不在白名单中的产物：${entry.name}`)
  }
  for (const file of allowedFiles) if (!names.has(file)) issue(`缺少必要产物：${file}`)

  for (const required of [...contentFiles, 'manifest.json', 'SHA256SUMS']) {
    if (names.has(required) && !(await stat(path.join(output, required))).isFile()) issue(`产物不是普通文件：${required}`)
  }

  const html = await readFile(path.join(output, 'index.html'), 'utf8')
  const app = await readFile(path.join(output, 'app.js'), 'utf8')
  const css = await readFile(path.join(output, 'styles.css'), 'utf8')
  const manifest = JSON.parse(await readFile(path.join(output, 'manifest.json'), 'utf8'))
  const sumsText = await readFile(path.join(output, 'SHA256SUMS'), 'utf8')
  const expectedRuntimeNotices = await generateVueRuntimeNotices(root)
  if (names.has(THIRD_PARTY_NOTICES_FILE)) {
    const actualRuntimeNotices = await readFile(path.join(output, THIRD_PARTY_NOTICES_FILE), 'utf8')
    if (actualRuntimeNotices !== expectedRuntimeNotices) issue(`${THIRD_PARTY_NOTICES_FILE} 与当前安装的 Vue 运行依赖许可说明不一致。`)
  }
  const readme = await readFile(path.join(output, 'README.md'), 'utf8')
  if (!readme.includes(THIRD_PARTY_NOTICES_FILE)) issue(`README.md 未说明随包提供 ${THIRD_PARTY_NOTICES_FILE}。`)

  const htmlForResourceScan = html.replace('<link rel="icon" href="data:,">', '')
  const references = [...htmlForResourceScan.matchAll(/(?:src|href)=["']([^"']+)["']/gi)].map((match) => match[1])
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
  const cssUrlPattern = /url\(\s*(["']?)(.*?)\1\s*\)/gi
  for (const match of css.matchAll(cssUrlPattern)) {
    const reference = match[2].trim()
    if (!reference || reference.startsWith('#')) continue
    if (/^data:/i.test(reference)) {
      if (!isSupportedRasterDataUri(reference)) {
        issue('样式表包含不支持或格式无效的数据 URI；仅允许合法的内嵌栅格图片。')
      }
      continue
    }
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/|\/|\\)/i.test(reference)) {
      issue(`样式表包含外部或绝对 URL：${reference}`)
      continue
    }
    let decoded
    try {
      decoded = decodeURIComponent(reference.split(/[?#]/)[0])
    } catch {
      issue(`样式表资源引用编码无效：${reference}`)
      continue
    }
    const resolved = path.resolve(output, decoded)
    if (!resolved.startsWith(`${output}${path.sep}`) || !(await stat(resolved).catch(() => null))?.isFile()) {
      issue(`样式表资源不存在或越界：${reference}`)
    }
  }
  if (/@import\b/i.test(css)) issue('离线预览 CSS 不支持 @import；请将样式合并至 styles.css。')
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
  const expectedPages = formatPagesMarkdown(registeredPages)
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
