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
})
