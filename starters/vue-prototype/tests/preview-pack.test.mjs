import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { access, cp, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { test } from 'node:test'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const starterRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

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
