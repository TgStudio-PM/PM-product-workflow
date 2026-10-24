import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cp, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises'
import { test } from 'node:test'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const starterRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

async function createFixture(t) {
  const fixtureRoot = await mkdtemp(path.join(os.tmpdir(), 'tg-studio-preview-verify-'))
  t.after(() => rm(fixtureRoot, { recursive: true, force: true }))

  await mkdir(path.join(fixtureRoot, 'scripts'), { recursive: true })
  await Promise.all([
    cp(path.join(starterRoot, 'scripts', 'build-preview.mjs'), path.join(fixtureRoot, 'scripts', 'build-preview.mjs')),
    cp(path.join(starterRoot, 'scripts', 'verify-preview.mjs'), path.join(fixtureRoot, 'scripts', 'verify-preview.mjs')),
    cp(path.join(starterRoot, 'scripts', 'page-registry.mjs'), path.join(fixtureRoot, 'scripts', 'page-registry.mjs')),
    cp(path.join(starterRoot, 'src'), path.join(fixtureRoot, 'src'), { recursive: true }),
    cp(path.join(starterRoot, 'package.json'), path.join(fixtureRoot, 'package.json')),
    cp(path.join(starterRoot, 'dist', 'preview'), path.join(fixtureRoot, 'dist', 'preview'), { recursive: true }),
    symlink(path.join(starterRoot, 'node_modules'), path.join(fixtureRoot, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir'),
  ])

  return fixtureRoot
}

function verify(fixtureRoot) {
  return spawnSync(process.execPath, [path.join(fixtureRoot, 'scripts', 'verify-preview.mjs')], {
    cwd: fixtureRoot,
    encoding: 'utf8',
  })
}

function buildPreview(fixtureRoot) {
  return spawnSync(process.execPath, [path.join(fixtureRoot, 'scripts', 'build-preview.mjs')], {
    cwd: fixtureRoot,
    encoding: 'utf8',
  })
}

async function readManifest(fixtureRoot) {
  const manifestPath = path.join(fixtureRoot, 'dist', 'preview', 'manifest.json')
  return { manifestPath, manifest: JSON.parse(await readFile(manifestPath, 'utf8')) }
}

async function writeManifest(fixtureRoot, manifestPath, manifest) {
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  await updateManifestHash(fixtureRoot)
}

async function updateManifestHash(fixtureRoot) {
  const previewRoot = path.join(fixtureRoot, 'dist', 'preview')
  const manifest = await readFile(path.join(previewRoot, 'manifest.json'))
  const { createHash } = await import('node:crypto')
  const digest = createHash('sha256').update(manifest).digest('hex')
  const sumsPath = path.join(previewRoot, 'SHA256SUMS')
  const lines = (await readFile(sumsPath, 'utf8')).trimEnd().split(/\r?\n/)
  const index = lines.findIndex((line) => /\s+manifest\.json$/.test(line))
  assert.notEqual(index, -1, '测试夹具应包含 manifest.json 摘要')
  lines[index] = `${digest}  manifest.json`
  await writeFile(sumsPath, `${lines.join('\n')}\n`, 'utf8')
}

async function updateFileHash(fixtureRoot, file) {
  const previewRoot = path.join(fixtureRoot, 'dist', 'preview')
  const content = await readFile(path.join(previewRoot, file))
  const { createHash } = await import('node:crypto')
  const digest = createHash('sha256').update(content).digest('hex')
  const sumsPath = path.join(previewRoot, 'SHA256SUMS')
  const lines = (await readFile(sumsPath, 'utf8')).trimEnd().split(/\r?\n/)
  const index = lines.findIndex((line) => line.endsWith(`  ${file}`))
  assert.notEqual(index, -1, `测试夹具应包含 ${file} 摘要`)
  lines[index] = `${digest}  ${file}`
  await writeFile(sumsPath, `${lines.join('\n')}\n`, 'utf8')
}

async function appendStylesheetRule(fixtureRoot, rule) {
  const cssPath = path.join(fixtureRoot, 'dist', 'preview', 'styles.css')
  await writeFile(cssPath, `${await readFile(cssPath, 'utf8')}\n${rule}\n`, 'utf8')
  await updateFileHash(fixtureRoot, 'styles.css')
}

test('valid preview package passes in an isolated copy', async (t) => {
  const fixtureRoot = await createFixture(t)
  const result = verify(fixtureRoot)

  assert.equal(result.status, 0, result.stderr || result.stdout)
  assert.match(result.stdout, /离线包审计通过/)
})

test('builds and verifies an offline package with a local raster CSS image', async (t) => {
  const fixtureRoot = await createFixture(t)
  const assetRoot = path.join(fixtureRoot, 'src', 'assets')
  await mkdir(assetRoot, { recursive: true })
  const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/hXcAAAAASUVORK5CYII='
  await writeFile(path.join(assetRoot, 'pixel.png'), Buffer.from(png, 'base64'))
  const stylePath = path.join(fixtureRoot, 'src', 'style.css')
  await writeFile(stylePath, `${await readFile(stylePath, 'utf8')}\n.asset-probe{background-image:url("./assets/pixel.png")}\n`, 'utf8')

  const buildResult = buildPreview(fixtureRoot)
  assert.equal(buildResult.status, 0, buildResult.stderr || buildResult.stdout)
  const css = await readFile(path.join(fixtureRoot, 'dist', 'preview', 'styles.css'), 'utf8')
  assert.match(css, /url\(data:image\/png;base64,[A-Za-z0-9+/]+=*\)/)

  const verifyResult = verify(fixtureRoot)
  assert.equal(verifyResult.status, 0, verifyResult.stderr || verifyResult.stdout)
  const files = await readdir(path.join(fixtureRoot, 'dist', 'preview'))
  assert.deepEqual(files.sort(), ['README.md', 'PAGES.md', 'SHA256SUMS', 'app.js', 'index.html', 'manifest.json', 'styles.css'].sort())
  assert.match(await readFile(path.join(fixtureRoot, 'dist', 'preview', 'SHA256SUMS'), 'utf8'), /[a-f0-9]{64}  styles\.css/)
})

test('rejects SVG and non-image data URIs even when package hashes are current', async (t) => {
  for (const uri of ['data:image/svg+xml,%3Csvg%3E', 'data:text/css;base64,YQ==']) {
    const fixtureRoot = await createFixture(t)
    await appendStylesheetRule(fixtureRoot, `.probe{background-image:url("${uri}")}`)
    const result = verify(fixtureRoot)
    assert.equal(result.status, 1)
    assert.match(result.stderr, /样式表包含外部或非本地 URL/)
    assert.doesNotMatch(result.stderr, /文件校验值不匹配：styles\.css/)
  }
})

test('rejects invalid base64 or a data URI whose declared MIME disagrees with its bytes', async (t) => {
  for (const uri of ['data:image/png;base64,not-base64!', 'data:image/png;base64,YQ==']) {
    const fixtureRoot = await createFixture(t)
    await appendStylesheetRule(fixtureRoot, `.probe{background-image:url("${uri}")}`)
    const result = verify(fixtureRoot)
    assert.equal(result.status, 1)
    assert.match(result.stderr, /格式无效或 MIME 不匹配的栅格图片 data URI/)
    assert.doesNotMatch(result.stderr, /文件校验值不匹配：styles\.css/)
  }
})

test('continues to reject remote CSS image URLs even when package hashes are current', async (t) => {
  const fixtureRoot = await createFixture(t)
  await appendStylesheetRule(fixtureRoot, '.probe{background-image:url("https://example.invalid/image.png")}')
  const result = verify(fixtureRoot)

  assert.equal(result.status, 1)
  assert.match(result.stderr, /样式表包含外部或非本地 URL/)
  assert.doesNotMatch(result.stderr, /文件校验值不匹配：styles\.css/)
})

test('builds and verifies pages when the first registry entry lists title before path', async (t) => {
  const fixtureRoot = await createFixture(t)
  const registryPath = path.join(fixtureRoot, 'src', 'app', 'page-registry.ts')
  const registry = await readFile(registryPath, 'utf8')
  const original = "path: '/overview',\n    title: '原型概览',"
  assert.ok(registry.includes(original), '测试夹具应包含首个页面的路由和标题')
  await writeFile(registryPath, registry.replace(original, "title: '原型概览',\n    path: '/overview',"), 'utf8')

  const buildResult = buildPreview(fixtureRoot)
  assert.equal(buildResult.status, 0, buildResult.stderr || buildResult.stdout)
  const verifyResult = verify(fixtureRoot)
  assert.equal(verifyResult.status, 0, verifyResult.stderr || verifyResult.stdout)

  const { manifest } = await readManifest(fixtureRoot)
  assert.deepEqual(manifest.pages, [
    { route: '/overview', title: '原型概览' },
    { route: '/material-submission/apply', title: '材料申报' },
  ])
  assert.equal(await readFile(path.join(fixtureRoot, 'dist', 'preview', 'PAGES.md'), 'utf8'),
    '# 页面清单\n\n| 路由 | 页面 |\n| --- | --- |\n| /overview | 原型概览 |\n| /material-submission/apply | 材料申报 |\n')
})

test('rejects dynamic page metadata before building an offline package', async (t) => {
  const fixtureRoot = await createFixture(t)
  const registryPath = path.join(fixtureRoot, 'src', 'app', 'page-registry.ts')
  const registry = await readFile(registryPath, 'utf8')
  await writeFile(registryPath, registry.replace("title: '原型概览'", 'title: makePageTitle()'), 'utf8')

  const result = buildPreview(fixtureRoot)
  assert.equal(result.status, 1)
  assert.match(result.stderr, /title 必须是静态字符串/)
})

test('rejects a manifest title that differs from the registered page', async (t) => {
  const fixtureRoot = await createFixture(t)
  const { manifestPath, manifest } = await readManifest(fixtureRoot)
  manifest.pages[0].title = '伪造页面标题'
  await writeManifest(fixtureRoot, manifestPath, manifest)
  const result = verify(fixtureRoot)

  assert.equal(result.status, 1)
  assert.match(result.stderr, /manifest 页面路由或标题与源码页面注册表不一致/)
})

test('rejects a manifest file list that names a missing artifact', async (t) => {
  const fixtureRoot = await createFixture(t)
  const { manifestPath, manifest } = await readManifest(fixtureRoot)
  manifest.files = ['missing-runtime.js']
  await writeManifest(fixtureRoot, manifestPath, manifest)
  const result = verify(fixtureRoot)

  assert.equal(result.status, 1)
  assert.match(result.stderr, /manifest 文件清单与离线包内容文件不一致/)
})

test('rejects manifest tampering when its checksum is unchanged', async (t) => {
  const fixtureRoot = await createFixture(t)
  const { manifestPath, manifest } = await readManifest(fixtureRoot)
  manifest.name = 'tampered-preview'
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  const result = verify(fixtureRoot)

  assert.equal(result.status, 1)
  assert.match(result.stderr, /manifest 名称与离线预览包不一致|文件校验值不匹配：manifest\.json/)
})

test('rejects SHA256SUMS without the manifest checksum', async (t) => {
  const fixtureRoot = await createFixture(t)
  const sumsPath = path.join(fixtureRoot, 'dist', 'preview', 'SHA256SUMS')
  const lines = (await readFile(sumsPath, 'utf8')).trimEnd().split(/\r?\n/)
    .filter((line) => !/\s+manifest\.json$/.test(line))
  await writeFile(sumsPath, `${lines.join('\n')}\n`, 'utf8')
  const result = verify(fixtureRoot)

  assert.equal(result.status, 1)
  assert.match(result.stderr, /SHA256SUMS 缺少文件：manifest\.json/)
})

test('rejects duplicate and unexpected SHA256SUMS entries', async (t) => {
  const fixtureRoot = await createFixture(t)
  const sumsPath = path.join(fixtureRoot, 'dist', 'preview', 'SHA256SUMS')
  const lines = (await readFile(sumsPath, 'utf8')).trimEnd().split(/\r?\n/)
  const index = lines.findIndex((line) => /\s+manifest\.json$/.test(line))
  lines.push(lines[index], `${'0'.repeat(64)}  extra.txt`)
  await writeFile(sumsPath, `${lines.join('\n')}\n`, 'utf8')
  const result = verify(fixtureRoot)

  assert.equal(result.status, 1)
  assert.match(result.stderr, /SHA256SUMS 包含重复条目：manifest\.json/)
  assert.match(result.stderr, /SHA256SUMS 包含额外文件：extra\.txt/)
})
