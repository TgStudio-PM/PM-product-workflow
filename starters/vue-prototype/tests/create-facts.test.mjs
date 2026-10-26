import assert from 'node:assert/strict'
import { lstat, mkdir, mkdtemp, readFile, readdir, rename, rm, symlink, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { createFacts } from '../scripts/create-facts.mjs'

const starterRoot = path.resolve(import.meta.dirname, '..')
const filenames = ['CURRENT.md', 'BUSINESS_RULES.md', 'PAGE_FLOW.md', 'DECISIONS.md', 'ERROR_LEDGER.md']

async function createProjectFixture(t, { omitTemplateFile } = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'tg-studio-facts-new-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const templateDirectory = path.join(root, 'module-template', 'facts', 'module')
  await mkdir(templateDirectory, { recursive: true })
  for (const filename of filenames) {
    if (filename === omitTemplateFile) continue
    await writeFile(
      path.join(templateDirectory, filename),
      await readFile(path.join(starterRoot, 'module-template', 'facts', 'module', filename)),
    )
  }
  return root
}

async function createSymlinkOrSkip(t, target, linkPath, type) {
  try {
    await symlink(target, linkPath, type)
    return true
  } catch (error) {
    if (process.platform === 'win32' && ['EACCES', 'EPERM', 'ERROR_PRIVILEGE_NOT_HELD'].includes(error?.code)) {
      t.skip(`当前 Windows 环境无创建符号链接权限（${error.code}）`)
      return false
    }
    throw error
  }
}

test('copies all five blank module fact templates byte for byte', async (t) => {
  const root = await createProjectFixture(t)
  const result = await createFacts({ root, module: 'demo-help' })
  const targetDirectory = path.join(root, 'src', 'modules', 'demo-help', 'facts', 'module')

  assert.equal(result.directory, 'src/modules/demo-help/facts/module')
  assert.deepEqual((await readdir(targetDirectory)).sort(), [...filenames].sort())
  for (const filename of filenames) {
    assert.deepEqual(
      await readFile(path.join(targetDirectory, filename)),
      await readFile(path.join(starterRoot, 'module-template', 'facts', 'module', filename)),
    )
  }
})

test('refuses to overwrite existing facts while preserving an existing page', async (t) => {
  const root = await createProjectFixture(t)
  const moduleDirectory = path.join(root, 'src', 'modules', 'demo-help')
  const pageDirectory = path.join(moduleDirectory, 'pages', 'guide')
  await mkdir(pageDirectory, { recursive: true })
  await writeFile(path.join(pageDirectory, 'Page.vue'), 'existing page')
  await createFacts({ root, module: 'demo-help' })
  const factsDirectory = path.join(moduleDirectory, 'facts', 'module')
  await writeFile(path.join(factsDirectory, 'CURRENT.md'), 'existing facts')

  await assert.rejects(createFacts({ root, module: 'demo-help' }), /目标目录已存在，不会覆盖/)
  assert.equal(await readFile(path.join(pageDirectory, 'Page.vue'), 'utf8'), 'existing page')
  assert.equal(await readFile(path.join(factsDirectory, 'CURRENT.md'), 'utf8'), 'existing facts')
})

test('rejects invalid and Windows-reserved module identifiers without writing', async (t) => {
  const root = await createProjectFixture(t)
  for (const module of ['../escape', 'Demo-Help', 'bad_name', 'con', 'demo-aux']) {
    await assert.rejects(createFacts({ root, module }), /模块标识只能使用小写英文字母、数字和连字符/)
  }
  assert.equal(await readdir(path.join(root, 'src')).catch((error) => error.code), 'ENOENT')
})

test('validates every required template file before creating the module target', async (t) => {
  const root = await createProjectFixture(t, { omitTemplateFile: 'DECISIONS.md' })
  await assert.rejects(createFacts({ root, module: 'demo-help' }), /模块事实模板缺少普通文件：module-template\/facts\/module\/DECISIONS.md/)
  assert.equal(await readdir(path.join(root, 'src')).catch((error) => error.code), 'ENOENT')
})

test('rejects a dangling symlink at the facts target', async (t) => {
  const root = await createProjectFixture(t)
  const target = path.join(root, 'src', 'modules', 'demo-help', 'facts', 'module')
  await mkdir(path.dirname(target), { recursive: true })
  if (!await createSymlinkOrSkip(t, path.join(root, 'missing-target'), target, 'dir')) return

  await assert.rejects(createFacts({ root, module: 'demo-help' }), /符号链接/)
  assert.equal((await lstat(target)).isSymbolicLink(), true)
})

test('rejects a symlink in the module template path', async (t) => {
  const root = await createProjectFixture(t)
  const originalTemplate = path.join(root, 'module-template', 'facts')
  const movedTemplate = path.join(root, 'template-copy')
  await rename(originalTemplate, movedTemplate)
  if (!await createSymlinkOrSkip(t, movedTemplate, originalTemplate, 'dir')) return

  await assert.rejects(createFacts({ root, module: 'demo-help' }), /符号链接/)
  assert.equal(await readdir(path.join(root, 'src')).catch((error) => error.code), 'ENOENT')
})

test('rejects a symlink in the output parent path without writing outside the project', async (t) => {
  const root = await createProjectFixture(t)
  const moduleDirectory = path.join(root, 'src', 'modules', 'demo-help')
  const outsideDirectory = await mkdtemp(path.join(os.tmpdir(), 'tg-studio-facts-outside-'))
  t.after(() => rm(outsideDirectory, { recursive: true, force: true }))
  const factsParent = path.join(moduleDirectory, 'facts')
  await mkdir(moduleDirectory, { recursive: true })
  if (!await createSymlinkOrSkip(t, outsideDirectory, factsParent, 'dir')) return

  await assert.rejects(createFacts({ root, module: 'demo-help' }), /符号链接/)
  assert.deepEqual(await readdir(outsideDirectory), [])
})
