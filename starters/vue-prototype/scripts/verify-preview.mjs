import { createHash } from 'node:crypto'
import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const output = path.join(root, 'dist', 'preview')
const allowedFiles = new Set(['index.html', 'app.js', 'styles.css', 'README.md', 'PAGES.md', 'manifest.json', 'SHA256SUMS'])
const errors = []

function issue(message) { errors.push(message) }

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
  if (/https?:\/\//i.test(css) || /url\(\s*["']?(?:data:|https?:|\/\/)/i.test(css)) issue('样式表包含外部或非本地 URL。')
  if (/\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon)\s*\(/.test(app)) issue('运行脚本包含网络请求 API。')

  const registry = await readFile(path.join(root, 'src', 'app', 'page-registry.ts'), 'utf8')
  const registeredRoutes = [...registry.matchAll(/path:\s*['"]([^'"]+)['"]/g)].map((match) => match[1])
  for (const route of registeredRoutes) {
    if (!manifest.pages?.some((page) => page.route === route) || !app.includes(route) || !(await readFile(path.join(output, 'PAGES.md'), 'utf8')).includes(route)) {
      issue(`页面路由未完整进入离线包：${route}`)
    }
  }
  if (manifest.pages?.length !== registeredRoutes.length) issue('manifest 页面数量与源码注册表不一致。')
  for (const dependency of Object.keys(JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8')).dependencies ?? {})) {
    if (!app.includes(dependency.split('/').at(-1))) issue(`运行依赖可能未打入本地 bundle：${dependency}`)
  }

  const sums = new Map(sumsText.trim().split(/\r?\n/).filter(Boolean).map((line) => {
    const [, hash, file] = line.match(/^([a-f0-9]{64})\s+\*?(.+)$/i) ?? []
    return [file, hash]
  }))
  for (const [file, expected] of sums) {
    if (!allowedFiles.has(file) || !expected) { issue(`SHA256SUMS 格式或文件名无效：${file}`); continue }
    const actual = createHash('sha256').update(await readFile(path.join(output, file))).digest('hex')
    if (actual !== expected) issue(`文件校验值不匹配：${file}`)
  }
  for (const file of ['index.html', 'app.js', 'styles.css', 'README.md', 'PAGES.md']) if (!sums.has(file)) issue(`SHA256SUMS 缺少文件：${file}`)
} catch (error) {
  issue(`无法完成离线包审计：${error.message}`)
}

if (errors.length) {
  for (const error of errors) console.error(`PREVIEW_VERIFY: ${error}`)
  process.exitCode = 1
} else {
  console.log('离线包审计通过：入口、路由、相对资源、目录白名单、依赖边界和 SHA256 均符合要求。')
}
