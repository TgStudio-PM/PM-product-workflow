import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
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

async function updateContentHash(fixtureRoot, file) {
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

async function updateManifestHash(fixtureRoot) {
  await updateContentHash(fixtureRoot, 'manifest.json')
}

async function snapshotPreviewFiles(fixtureRoot) {
  const previewRoot = path.join(fixtureRoot, 'dist', 'preview')
  const entries = await readdir(previewRoot, { withFileTypes: true })
  const files = await Promise.all(entries.filter((entry) => entry.isFile()).map(async ({ name }) => {
    const content = await readFile(path.join(previewRoot, name))
    const hash = createHash('sha256').update(content).digest('hex')
    return [name, hash]
  }))
  return Object.fromEntries(files)
}

test('valid preview package passes in an isolated copy', async (t) => {
  const fixtureRoot = await createFixture(t)
  const result = verify(fixtureRoot)

  assert.equal(result.status, 0, result.stderr || result.stdout)
  assert.match(result.stdout, /离线包审计通过/)
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

test('formats punctuation and multiline titles as safe table cells while preserving manifest values', async (t) => {
  const fixtureRoot = await createFixture(t)
  const registryPath = path.join(fixtureRoot, 'src', 'app', 'page-registry.ts')
  const registry = await readFile(registryPath, 'utf8')
  const title = '演示 | <指南> *强调* _字段_ [链接](地址) `代码` &\r\n第二行'
  await writeFile(registryPath, registry.replace("title: '材料申报'", `title: ${JSON.stringify(title)}`), 'utf8')

  const buildResult = buildPreview(fixtureRoot)
  assert.equal(buildResult.status, 0, buildResult.stderr || buildResult.stdout)
  const verifyResult = verify(fixtureRoot)
  assert.equal(verifyResult.status, 0, verifyResult.stderr || verifyResult.stdout)

  const { manifest } = await readManifest(fixtureRoot)
  assert.equal(manifest.pages[1].title, title)
  assert.equal(await readFile(path.join(fixtureRoot, 'dist', 'preview', 'PAGES.md'), 'utf8'),
    '# 页面清单\n\n| 路由 | 页面 |\n| --- | --- |\n| /overview | 原型概览 |\n| /material-submission/apply | 演示 &#124; &lt;指南&gt; &#42;强调&#42; &#95;字段&#95; &#91;链接&#93;&#40;地址&#41; &#96;代码&#96; &amp;<br>第二行 |\n')
})

test('rejects a modified PAGES.md even when its checksum is updated', async (t) => {
  const fixtureRoot = await createFixture(t)
  const pagesPath = path.join(fixtureRoot, 'dist', 'preview', 'PAGES.md')
  const original = await readFile(pagesPath, 'utf8')
  await writeFile(pagesPath, original.replace('| /overview | 原型概览 |', '| /overview | 原型 | 概览 |'), 'utf8')
  await updateContentHash(fixtureRoot, 'PAGES.md')
  const result = verify(fixtureRoot)

  assert.equal(result.status, 1)
  assert.match(result.stderr, /PAGES\.md 与源码页面注册表不一致/)
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

test('rejects a syntactically invalid registry during offline verification without modifying the package', async (t) => {
  const fixtureRoot = await createFixture(t)
  const registryPath = path.join(fixtureRoot, 'src', 'app', 'page-registry.ts')
  const registry = await readFile(registryPath, 'utf8')
  const originalPackage = await snapshotPreviewFiles(fixtureRoot)
  await writeFile(registryPath, `${registry}\nconst =\n`, 'utf8')

  const result = verify(fixtureRoot)

  assert.equal(result.status, 1)
  assert.match(result.stderr, /页面注册表包含 TypeScript 语法错误/)
  assert.deepEqual(await snapshotPreviewFiles(fixtureRoot), originalPackage, '验包失败不应修改离线包文件或其 SHA 清单')
})

test('rejects a syntactically invalid registry during direct preview build before replacing the package', async (t) => {
  const fixtureRoot = await createFixture(t)
  const registryPath = path.join(fixtureRoot, 'src', 'app', 'page-registry.ts')
  const registry = await readFile(registryPath, 'utf8')
  const originalPackage = await snapshotPreviewFiles(fixtureRoot)
  await writeFile(registryPath, `${registry}\nconst =\n`, 'utf8')

  const result = buildPreview(fixtureRoot)

  assert.equal(result.status, 1)
  assert.match(result.stderr, /页面注册表包含 TypeScript 语法错误/)
  assert.deepEqual(await snapshotPreviewFiles(fixtureRoot), originalPackage, '构建失败不应修改离线包文件或其 SHA 清单')
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
