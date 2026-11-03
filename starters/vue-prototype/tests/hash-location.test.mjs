import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const starterRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = await readFile(path.join(starterRoot, 'src/app/hash-location.ts'), 'utf8')
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
})
const moduleUrl = `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
const { resolveHashLocation } = await import(moduleUrl)

const registeredPaths = ['/overview', '/material-submission/apply']
const encodedRoutePaths = ['/帮助中心', '/help center', '/100% complete']

test('empty hash selects the first registered route', () => {
  assert.equal(resolveHashLocation('', registeredPaths).path, '/overview')
  assert.equal(resolveHashLocation('#', registeredPaths).path, '/overview')
  assert.equal(resolveHashLocation('#?', registeredPaths).path, '/overview')
})

test('registered route is matched without changing its path', () => {
  const result = resolveHashLocation('#/material-submission/apply', registeredPaths)
  assert.equal(result.path, '/material-submission/apply')
  assert.equal(result.isRegistered, true)
  assert.equal(result.query.size, 0)
})

test('registered route separates the query at the first question mark', () => {
  const result = resolveHashLocation('#/material-submission/apply?id=demo-001&step=2', registeredPaths)
  assert.equal(result.path, '/material-submission/apply')
  assert.equal(result.isRegistered, true)
  assert.equal(result.query.get('id'), 'demo-001')
  assert.equal(result.query.get('step'), '2')
})

test('registered Chinese and space routes match their browser-serialized paths and retain registration values', () => {
  const chinese = resolveHashLocation('#/%E5%B8%AE%E5%8A%A9%E4%B8%AD%E5%BF%83', encodedRoutePaths)
  assert.equal(chinese.path, '/帮助中心')
  assert.equal(chinese.isRegistered, true)

  const spaced = resolveHashLocation('#/help%20center', encodedRoutePaths)
  assert.equal(spaced.path, '/help center')
  assert.equal(spaced.isRegistered, true)
})

test('empty hash selects a Chinese first route and a registered literal percent route matches', () => {
  const chineseFirst = resolveHashLocation('#', ['/首页', '/overview'])
  assert.equal(chineseFirst.path, '/首页')
  assert.equal(chineseFirst.isRegistered, true)

  const percent = resolveHashLocation('#/100% complete', encodedRoutePaths)
  assert.equal(percent.path, '/100% complete')
  assert.equal(percent.isRegistered, true)
  const serializedPercent = resolveHashLocation('#/100%%20complete', encodedRoutePaths)
  assert.equal(serializedPercent.path, '/100% complete')
  assert.equal(serializedPercent.isRegistered, true)
})

test('browser-serialized registered route keeps query handling unchanged', () => {
  const result = resolveHashLocation('#/help%20center?id=demo-001', encodedRoutePaths)
  assert.equal(result.path, '/help center')
  assert.equal(result.isRegistered, true)
  assert.equal(result.query.get('id'), 'demo-001')
})

test('query parameters preserve duplicates and decode values for reading', () => {
  const result = resolveHashLocation(
    '#/material-submission/apply?tag=one&tag=two&name=%E4%B8%AD%E6%96%87%20A%2BB',
    registeredPaths,
  )
  assert.deepEqual(result.query.getAll('tag'), ['one', 'two'])
  assert.equal(result.query.get('name'), '中文 A+B')
})

test('unknown nonempty path remains unknown instead of falling back to the first route', () => {
  const result = resolveHashLocation('#/not-registered', registeredPaths)
  assert.equal(result.path, '/not-registered')
  assert.equal(result.isRegistered, false)
})

test('unknown path and its query remain separate', () => {
  const result = resolveHashLocation('#/material-submission/apply/extra?id=demo-001', registeredPaths)
  assert.equal(result.path, '/material-submission/apply/extra')
  assert.equal(result.query.get('id'), 'demo-001')
  assert.equal(result.isRegistered, false)
})

test('encoded and differently cased paths are not decoded or normalized into registered routes', () => {
  assert.equal(resolveHashLocation('#/%6Fverview', registeredPaths).isRegistered, false)
  assert.equal(resolveHashLocation('#/Overview', registeredPaths).isRegistered, false)
  assert.equal(resolveHashLocation('#/%E5%B8%AE%E5%8A%A9%E4%B8%AD%E5%BF%83', ['/帮助中心X']).isRegistered, false)
})
