import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { build } from 'vite'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const output = path.join(root, 'dist', 'preview')

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
await writeFile(path.join(output, 'README.txt'), 'Tg Studio 虚构原型预览\n\n双击 index.html 打开。本目录中的页面和数据均为教学示例；预览不需要 Node.js 服务，也不发起网络请求。浏览器对 file:// 的行为仍需在目标浏览器中实测。\n', 'utf8')

const script = await readFile(path.join(output, 'app.js'), 'utf8')
if (/\bimport\s*(?:\(|\{)|\bexport\s|<script[^>]+type=["']module|\bprocess\.env\./i.test(script)) {
  throw new Error('离线包脚本包含模块语法或未替换的 Node 环境变量，不能作为经典脚本交付。')
}
console.log(`离线预览包已生成：${path.relative(root, output)}`)
