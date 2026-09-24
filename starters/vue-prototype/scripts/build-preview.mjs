import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { build } from 'vite'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const output = path.join(root, 'dist', 'preview')
const registry = await readFile(path.join(root, 'src', 'app', 'page-registry.ts'), 'utf8')

const pages = [...registry.matchAll(/path:\s*['"]([^'"]+)['"][\s\S]*?title:\s*['"]([^'"]+)['"]/g)]
  .map(([, route, title]) => ({ route, title }))
if (pages.length === 0) throw new Error('页面注册表没有可打包的页面路由。')

await build({
  configFile: false,
  root,
  plugins: [vue()],
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: {
    outDir: output,
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: {
      entry: path.join(root, 'src', 'main.ts'),
      name: 'TgStudioPrototype',
      formats: ['iife'],
      fileName: () => 'app.js',
    },
    rollupOptions: {
      output: { assetFileNames: 'styles.[ext]' },
    },
  },
})

const html = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Tg Studio 虚构原型工程离线预览。">
    <title>Tg Studio · 原型工程示例</title>
    <link rel="stylesheet" href="./styles.css">
    <script defer src="./app.js"></script>
  </head>
  <body>
    <div id="app"></div>
  </body>
</html>
`

await mkdir(output, { recursive: true })
await writeFile(path.join(output, 'index.html'), html, 'utf8')
const previewReadme = [
  '# Tg Studio 原型预览包',
  '',
  '本目录包含完全虚构的原型页面，仅用于教学和交互预览。它不连接后端、不上传文件，也不生成真实业务数据。',
  '',
  '## 如何预览',
  '',
  '双击 index.html，或通过任意静态文件服务器打开。本预览包不需要 Node.js 服务，不加载 CDN。目标浏览器的 file:// 行为仍需单独实测。',
  '',
  '## 文件',
  '',
  '- index.html：入口。',
  '- app.js、styles.css：本地运行资源。',
  '- PAGES.md：本包路由清单。',
  '- manifest.json、SHA256SUMS：包文件和完整性校验信息。',
  '',
  '## 已知限制',
  '',
  '草稿保存在当前浏览器。本包没有 API、身份认证、真实权限、服务端持久化或文件上传。',
  '',
].join('\n')
await writeFile(path.join(output, 'README.md'), previewReadme, 'utf8')
await writeFile(path.join(output, 'PAGES.md'), `# 页面清单\n\n| 路由 | 页面 |\n| --- | --- |\n${pages.map(({ route, title }) => `| ${route} | ${title} |`).join('\n')}\n`, 'utf8')

const script = await readFile(path.join(output, 'app.js'), 'utf8')
if (/\bimport\s*(?:\(|\{)|\bexport\s|<script[^>]+type=["']module|\bprocess\.env\./i.test(script)) {
  throw new Error('离线包脚本包含模块语法或未替换的 Node 环境变量，不能作为经典脚本交付。')
}
const contentFiles = ['index.html', 'app.js', 'styles.css', 'README.md', 'PAGES.md']
const hashes = {}
for (const file of contentFiles) {
  const content = await readFile(path.join(output, file))
  hashes[file] = createHash('sha256').update(content).digest('hex')
}
await writeFile(path.join(output, 'manifest.json'), `${JSON.stringify({ name: 'tg-studio-vue-prototype-preview', pages, files: contentFiles }, null, 2)}\n`, 'utf8')
await writeFile(path.join(output, 'SHA256SUMS'), `${Object.entries(hashes).map(([file, hash]) => `${hash}  ${file}`).join('\n')}\n`, 'utf8')
console.log(`离线预览包已生成：${path.relative(root, output)}`)
