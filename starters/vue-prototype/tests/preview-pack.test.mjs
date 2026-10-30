import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { access, cp, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises'
import { test } from 'node:test'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const starterRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

async function createMissingLicenseFixture(t) {
  const fixtureRoot = await mkdtemp(path.join(os.tmpdir(), 'tg-studio-preview-notices-missing-'))
  t.after(() => rm(fixtureRoot, { recursive: true, force: true }))
  await mkdir(path.join(fixtureRoot, 'scripts'), { recursive: true })
  await mkdir(path.join(fixtureRoot, 'dist', 'preview'), { recursive: true })
  await Promise.all([
    cp(path.join(starterRoot, 'scripts', 'build-preview.mjs'), path.join(fixtureRoot, 'scripts', 'build-preview.mjs')),
    cp(path.join(starterRoot, 'scripts', 'vue-runtime-notices.mjs'), path.join(fixtureRoot, 'scripts', 'vue-runtime-notices.mjs')),
    cp(path.join(starterRoot, 'UPSTREAM_LICENSE.txt'), path.join(fixtureRoot, 'UPSTREAM_LICENSE.txt')),
  ])

  const runtimePackages = ['vue', '@vue/shared', '@vue/reactivity', '@vue/runtime-core', '@vue/runtime-dom']
  for (const packageName of runtimePackages) {
    const source = path.join(starterRoot, 'node_modules', ...packageName.split('/'))
    const target = path.join(fixtureRoot, 'node_modules', ...packageName.split('/'))
    await mkdir(target, { recursive: true })
    await cp(path.join(source, 'package.json'), path.join(target, 'package.json'))
    if (packageName !== '@vue/runtime-dom') await cp(path.join(source, 'LICENSE'), path.join(target, 'LICENSE'))
  }

  const existingPreview = path.join(fixtureRoot, 'dist', 'preview', 'previous-output.txt')
  await writeFile(existingPreview, 'prior verified preview remains intact', 'utf8')
  return { fixtureRoot, existingPreview }
}

test('preview:pack stops before building when a registered page has no component', async (t) => {
  const fixtureRoot = await mkdtemp(path.join(os.tmpdir(), 'tg-studio-preview-pack-'))
  t.after(() => rm(fixtureRoot, { recursive: true, force: true }))

  await Promise.all([
    cp(path.join(starterRoot, 'src'), path.join(fixtureRoot, 'src'), { recursive: true }),
    cp(path.join(starterRoot, 'package.json'), path.join(fixtureRoot, 'package.json')),
    cp(path.join(starterRoot, 'tsconfig.json'), path.join(fixtureRoot, 'tsconfig.json')),
    symlink(path.join(starterRoot, 'node_modules'), path.join(fixtureRoot, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir'),
  ])

  const registryPath = path.join(fixtureRoot, 'src', 'app', 'page-registry.ts')
  const registry = await readFile(registryPath, 'utf8')
  const componentEntry = '    component: MaterialSubmissionPage,'
  assert.ok(registry.includes(componentEntry), 'fixture should contain the registered page component')
  await writeFile(registryPath, registry.replace(componentEntry, ''), 'utf8')

  const npmExecPath = process.env.npm_execpath
  const result = npmExecPath
    ? spawnSync(process.execPath, [npmExecPath, 'run', 'preview:pack'], { cwd: fixtureRoot, encoding: 'utf8' })
    : spawnSync('npm', ['run', 'preview:pack'], { cwd: fixtureRoot, encoding: 'utf8', shell: process.platform === 'win32' })
  const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`

  assert.notEqual(result.status, 0, output)
  assert.match(output, /Property 'component' does not exist|Property 'component' is missing/)
  assert.doesNotMatch(output, /离线包审计通过/)
  await assert.rejects(access(path.join(fixtureRoot, 'dist', 'preview', 'index.html')))
})

test('preview:pack preserves the existing preview when an installed runtime license is missing', async (t) => {
  const { fixtureRoot, existingPreview } = await createMissingLicenseFixture(t)
  const oldContent = await readFile(existingPreview)
  const oldHash = createHash('sha256').update(oldContent).digest('hex')
  const result = spawnSync(process.execPath, [path.join(fixtureRoot, 'scripts', 'build-preview.mjs')], {
    cwd: fixtureRoot,
    encoding: 'utf8',
  })
  const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`

  assert.notEqual(result.status, 0, output)
  assert.match(output, /无法读取 Vue 运行依赖 @vue\/runtime-dom\/LICENSE/)
  assert.equal(createHash('sha256').update(await readFile(existingPreview)).digest('hex'), oldHash)
  assert.deepEqual(await readdir(path.join(fixtureRoot, 'dist', 'preview')), ['previous-output.txt'])
})

test('preview build preserves the existing preview when the upstream license is missing or empty', async (t) => {
  for (const input of ['missing', 'empty']) {
    await t.test(input, async (t) => {
      const fixtureRoot = await mkdtemp(path.join(os.tmpdir(), 'tg-studio-preview-upstream-missing-'))
      t.after(() => rm(fixtureRoot, { recursive: true, force: true }))
      await Promise.all([
        cp(path.join(starterRoot, 'scripts'), path.join(fixtureRoot, 'scripts'), { recursive: true }),
        cp(path.join(starterRoot, 'src'), path.join(fixtureRoot, 'src'), { recursive: true }),
        cp(path.join(starterRoot, 'package.json'), path.join(fixtureRoot, 'package.json')),
        symlink(path.join(starterRoot, 'node_modules'), path.join(fixtureRoot, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir'),
      ])
      if (input === 'empty') await writeFile(path.join(fixtureRoot, 'UPSTREAM_LICENSE.txt'), '  \n', 'utf8')
      await mkdir(path.join(fixtureRoot, 'dist', 'preview'), { recursive: true })
      const existingPreview = path.join(fixtureRoot, 'dist', 'preview', 'previous-output.txt')
      await writeFile(existingPreview, 'prior preview remains intact', 'utf8')
      const oldHash = createHash('sha256').update(await readFile(existingPreview)).digest('hex')

      const result = spawnSync(process.execPath, [path.join(fixtureRoot, 'scripts', 'build-preview.mjs')], {
        cwd: fixtureRoot,
        encoding: 'utf8',
      })
      const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`
      assert.notEqual(result.status, 0, output)
      assert.match(output, /UPSTREAM_LICENSE\.txt 缺失或为空|ENOENT.*UPSTREAM_LICENSE\.txt/)
      assert.equal(createHash('sha256').update(await readFile(existingPreview)).digest('hex'), oldHash)
      assert.deepEqual(await readdir(path.join(fixtureRoot, 'dist', 'preview')), ['previous-output.txt'])
    })
  }
})
