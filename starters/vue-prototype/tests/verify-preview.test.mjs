import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
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
    cp(path.join(starterRoot, 'scripts', 'verify-preview.mjs'), path.join(fixtureRoot, 'scripts', 'verify-preview.mjs')),
    cp(path.join(starterRoot, 'src'), path.join(fixtureRoot, 'src'), { recursive: true }),
    cp(path.join(starterRoot, 'package.json'), path.join(fixtureRoot, 'package.json')),
    cp(path.join(starterRoot, 'dist', 'preview'), path.join(fixtureRoot, 'dist', 'preview'), { recursive: true }),
  ])

  return fixtureRoot
}

function verify(fixtureRoot) {
  return spawnSync(process.execPath, [path.join(fixtureRoot, 'scripts', 'verify-preview.mjs')], {
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

test('valid preview package passes in an isolated copy', async (t) => {
  const fixtureRoot = await createFixture(t)
  const result = verify(fixtureRoot)

  assert.equal(result.status, 0, result.stderr || result.stdout)
  assert.match(result.stdout, /离线包审计通过/)
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
