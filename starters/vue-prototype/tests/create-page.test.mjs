import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import ts from 'typescript'
import { createPage } from '../scripts/create-page.mjs'
import { readRegisteredPages } from '../scripts/page-registry.mjs'

const starterRoot = path.resolve(import.meta.dirname, '..')

async function createProjectFixture(t, { registry } = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'tg-studio-page-new-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  await mkdir(path.join(root, 'page-template'))
  await mkdir(path.join(root, 'src', 'app'), { recursive: true })
  for (const filename of ['Page.vue', 'mock.ts', 'RULES.md']) {
    await writeFile(
      path.join(root, 'page-template', filename),
      await readFile(path.join(starterRoot, 'page-template', filename), 'utf8'),
    )
  }
  await writeFile(
    path.join(root, 'src', 'app', 'page-registry.ts'),
    registry ?? `import OverviewPage from '../modules/overview/pages/home/Page.vue'\n\nexport const pageRegistry = [\n  {\n    path: '/overview',\n    title: '原型概览',\n    menuLabel: '原型概览',\n    demoRole: '教学案例使用者',\n    description: '查看虚构页面。',\n    component: OverviewPage,\n  },\n] as const\n`,
  )
  return root
}

test('creates a page, fills its mock title, and registers static metadata', async (t) => {
  const root = await createProjectFixture(t)
  const result = await createPage({ root, module: 'demo-help', page: 'guide', title: '演示帮助' })
  const pageRoot = path.join(root, 'src', 'modules', 'demo-help', 'pages', 'guide')
  assert.equal(result.route, '/demo-help/guide')
  assert.deepEqual((await readdir(pageRoot)).sort(), ['Page.vue', 'RULES.md', 'mock.ts'])
  assert.match(await readFile(path.join(pageRoot, 'mock.ts'), 'utf8'), /title: "演示帮助"/)

  const registry = await readFile(path.join(root, 'src', 'app', 'page-registry.ts'), 'utf8')
  assert.match(registry, /import DemoHelpGuidePage from '\.\.\/modules\/demo-help\/pages\/guide\/Page\.vue'/)
  assert.match(registry, /demoRole: "教学示例角色（请按项目事实核对）"/)
  assert.match(registry, /description: "新建页面占位说明；请按已确认需求修改。"/)
  assert.deepEqual(readRegisteredPages(registry), [
    { route: '/overview', title: '原型概览' },
    { route: '/demo-help/guide', title: '演示帮助' },
  ])
})

test('adds the required separator when the last registry entry has no trailing comma', async (t) => {
  const registry = `import OverviewPage from '../modules/overview/pages/home/Page.vue'\n\nexport const pageRegistry = [\n  { path: '/overview', title: '原型概览', component: OverviewPage }\n] as const\n`
  const root = await createProjectFixture(t, { registry })
  await createPage({ root, module: 'demo-help', page: 'guide', title: '演示帮助' })

  const generated = await readFile(path.join(root, 'src', 'app', 'page-registry.ts'), 'utf8')
  const sourceFile = ts.createSourceFile('page-registry.ts', generated, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  assert.deepEqual(sourceFile.parseDiagnostics, [])
  assert.deepEqual(readRegisteredPages(generated), [
    { route: '/overview', title: '原型概览' },
    { route: '/demo-help/guide', title: '演示帮助' },
  ])
})

test('preserves Windows line endings and safely quotes a page title', async (t) => {
  const root = await createProjectFixture(t)
  const registryPath = path.join(root, 'src', 'app', 'page-registry.ts')
  const original = await readFile(registryPath, 'utf8')
  await writeFile(registryPath, original.replaceAll('\n', '\r\n'))
  const title = '演示"帮助'

  await createPage({ root, module: 'demo-help', page: 'guide', title })
  const registry = await readFile(registryPath, 'utf8')
  assert.equal(registry.replaceAll('\r\n', '').includes('\n'), false)
  assert.deepEqual(readRegisteredPages(registry).at(-1), { route: '/demo-help/guide', title })
  assert.match(registry, /title: "演示\\"帮助"/)
})

test('rejects unsafe slugs and empty titles without changing the project', async (t) => {
  const root = await createProjectFixture(t)
  const registryPath = path.join(root, 'src', 'app', 'page-registry.ts')
  const before = await readFile(registryPath, 'utf8')
  for (const input of [
    { module: '../escape', page: 'guide', title: '演示帮助' },
    { module: 'demo-help', page: 'Bad_Name', title: '演示帮助' },
    { module: 'demo-help', page: 'guide', title: '   ' },
    { module: 'con', page: 'guide', title: '演示帮助' },
  ]) {
    await assert.rejects(createPage({ root, ...input }))
    assert.equal(await readFile(registryPath, 'utf8'), before)
    assert.equal(await readdir(path.join(root, 'src', 'modules')).catch((error) => error.code), 'ENOENT')
  }
})

test('rejects an already registered route before writing files', async (t) => {
  const registry = `import ExistingPage from '../modules/demo-help/pages/guide/Page.vue'\n\nexport const pageRegistry = [\n  { path: '/demo-help/guide', title: '已有页面', component: ExistingPage },\n] as const\n`
  const root = await createProjectFixture(t, { registry })
  const registryPath = path.join(root, 'src', 'app', 'page-registry.ts')
  const before = await readFile(registryPath, 'utf8')
  await assert.rejects(createPage({ root, module: 'demo-help', page: 'guide', title: '演示帮助' }), /路由已存在/)
  assert.equal(await readFile(registryPath, 'utf8'), before)
  assert.equal(await readdir(path.join(root, 'src', 'modules')).catch((error) => error.code), 'ENOENT')
})

test('refuses to overwrite an existing page directory', async (t) => {
  const root = await createProjectFixture(t)
  const target = path.join(root, 'src', 'modules', 'demo-help', 'pages', 'guide')
  await mkdir(target, { recursive: true })
  await writeFile(path.join(target, 'keep.txt'), 'user content')
  const registryPath = path.join(root, 'src', 'app', 'page-registry.ts')
  const before = await readFile(registryPath, 'utf8')

  await assert.rejects(createPage({ root, module: 'demo-help', page: 'guide', title: '演示帮助' }), /目标目录已存在/)
  assert.equal(await readFile(path.join(target, 'keep.txt'), 'utf8'), 'user content')
  assert.equal(await readFile(registryPath, 'utf8'), before)
})

test('rejects an import identifier collision without changing files', async (t) => {
  const registry = `import DemoHelpGuidePage from '../modules/other/guide/Page.vue'\nimport OverviewPage from '../modules/overview/pages/home/Page.vue'\n\nexport const pageRegistry = [\n  { path: '/overview', title: '原型概览', component: OverviewPage },\n] as const\n`
  const root = await createProjectFixture(t, { registry })
  const registryPath = path.join(root, 'src', 'app', 'page-registry.ts')
  const before = await readFile(registryPath, 'utf8')
  await assert.rejects(createPage({ root, module: 'demo-help', page: 'guide', title: '演示帮助' }), /导入名 .* 已存在/)
  assert.equal(await readFile(registryPath, 'utf8'), before)
  assert.equal(await readdir(path.join(root, 'src', 'modules')).catch((error) => error.code), 'ENOENT')
})
