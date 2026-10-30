import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'
import ts from 'typescript'

const starterRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)
const vue = require('vue')
const storageKey = 'tg-studio-vue-starter-material-submission-v1'
const requiredIds = ['project-note', 'schedule']
const validMaterialId = (value) => ['project-note', 'space-sketch', 'schedule'].includes(value)

async function readTypeScript(relativePath) {
  const source = await readFile(path.join(starterRoot, relativePath), 'utf8')
  return ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
}

const compiledModules = new Map([
  ['./browser-storage', await readTypeScript('src/modules/material-submission/data/browser-storage.ts')],
  ['./limits', await readTypeScript('src/modules/material-submission/data/limits.ts')],
  ['./use-application-draft', await readTypeScript('src/modules/material-submission/data/use-application-draft.ts')],
])

function createHostRenderer() {
  function attach(child, parent, anchor = null) {
    if (child.parent) {
      const oldIndex = child.parent.children.indexOf(child)
      if (oldIndex >= 0) child.parent.children.splice(oldIndex, 1)
    }
    child.parent = parent
    const anchorIndex = anchor ? parent.children.indexOf(anchor) : -1
    if (anchorIndex >= 0) parent.children.splice(anchorIndex, 0, child)
    else parent.children.push(child)
  }

  return vue.createRenderer({
    createElement: (type) => ({ type, children: [], props: {}, parent: null }),
    createText: (text) => ({ text, parent: null }),
    createComment: (text) => ({ comment: text, parent: null }),
    setText: (node, text) => { node.text = text },
    setElementText: (node, text) => { node.text = text; node.children = [] },
    patchProp: (node, key, _previous, next) => { node.props[key] = next },
    insert: attach,
    remove: (node) => {
      if (!node.parent) return
      const index = node.parent.children.indexOf(node)
      if (index >= 0) node.parent.children.splice(index, 1)
      node.parent = null
    },
    parentNode: (node) => node.parent,
    nextSibling: (node) => {
      if (!node.parent) return null
      return node.parent.children[node.parent.children.indexOf(node) + 1] ?? null
    },
  })
}

function createHarness(storage = new Map(), controls = { failWrite: false }) {
  const localStorage = {
    getItem(key) { return storage.has(key) ? storage.get(key) : null },
    setItem(key, value) {
      if (controls.failWrite) throw new Error('controlled storage write failure')
      storage.set(key, String(value))
    },
    removeItem(key) {
      if (controls.failRemove) throw new Error('controlled storage removal failure')
      storage.delete(key)
    },
  }

  const context = vm.createContext({ localStorage })
  const moduleCache = new Map()
  function loadModule(id) {
    if (id === 'vue') return vue
    if (!compiledModules.has(id)) throw new Error(`Unexpected module import: ${id}`)
    if (moduleCache.has(id)) return moduleCache.get(id).exports
    const module = { exports: {} }
    moduleCache.set(id, module)
    const run = vm.compileFunction(compiledModules.get(id), ['require', 'module', 'exports'], { parsingContext: context })
    run(loadModule, module, module.exports)
    return module.exports
  }

  let state
  const container = { type: 'root', children: [], parent: null }
  const app = createHostRenderer().createApp({
    setup() {
      state = loadModule('./use-application-draft').useApplicationDraft(validMaterialId, requiredIds)
      return () => null
    },
  })
  app.mount(container)
  return {
    state,
    storage,
    controls,
    close: () => app.unmount(),
    nextTick: () => vue.nextTick(),
    stored: () => storage.has(storageKey) ? JSON.parse(storage.get(storageKey)) : null,
    draft: () => JSON.parse(JSON.stringify(state.draft)),
  }
}

function storeDraft(storage, { description, checkedMaterials = requiredIds, submitted = false }) {
  storage.set(storageKey, JSON.stringify({ description, checkedMaterials, submitted }))
}

test('501-character old draft restores intact, can be saved, and reloads intact', async () => {
  const storage = new Map()
  const original = 'A'.repeat(500) + '尾'
  storeDraft(storage, { description: original })
  const first = createHarness(storage)
  try {
    await first.nextTick()
    assert.equal(first.draft().description, original)
    assert.equal(first.state.descriptionCount.value, 501)
    assert.equal(first.state.showDescriptionError.value, true)
    assert.equal(first.state.draft.submitted, false)
    assert.equal(first.state.persistDraft(), true)
    assert.equal(first.stored().description, original)
  } finally {
    first.close()
  }

  const reopened = createHarness(storage)
  try {
    await reopened.nextTick()
    assert.equal(reopened.draft().description, original)
    assert.equal(reopened.state.descriptionCount.value, 501)
    assert.equal(reopened.state.draft.submitted, false)
  } finally {
    reopened.close()
  }
})

test('501-character old draft cannot be submitted and remains a draft', async () => {
  const storage = new Map()
  const original = 'B'.repeat(500) + '尾'
  storeDraft(storage, { description: original })
  const app = createHarness(storage)
  try {
    await app.nextTick()
    assert.equal(app.state.submitDraft(), false)
    assert.equal(app.state.showDescriptionError.value, true)
    assert.equal(app.state.draft.submitted, false)
    assert.equal(app.draft().description, original)
    assert.equal(app.stored().description, original)
    assert.equal(app.stored().submitted, false)
  } finally {
    app.close()
  }
})

test('501-character old submission is downgraded, corrected, and remains stable after reopening', async () => {
  const storage = new Map()
  const original = 'C'.repeat(500) + '尾'
  storeDraft(storage, { description: original, submitted: true })
  const restored = createHarness(storage)
  try {
    await restored.nextTick()
    assert.equal(restored.state.showDescriptionError.value, true)
    assert.equal(restored.state.draft.submitted, false)
    assert.equal(restored.draft().description, original)
    assert.equal(restored.stored().description, original)
    assert.equal(restored.stored().submitted, false)
    assert.match(restored.state.storageMessage.value, /已更正保存/)
    restored.state.draft.description = 'D'.repeat(500)
    await restored.nextTick()
    assert.equal(restored.state.submitDraft(), true)
    assert.equal(restored.state.draft.submitted, true)
  } finally {
    restored.close()
  }

  const reopened = createHarness(storage)
  try {
    await reopened.nextTick()
    assert.equal(reopened.state.draft.submitted, true)
    assert.equal(reopened.draft().description, 'D'.repeat(500))
  } finally {
    reopened.close()
  }
})

test('failed correction of an old overlength submission keeps the full draft and reports failure', async () => {
  const storage = new Map()
  const original = 'E'.repeat(500) + '尾'
  storeDraft(storage, { description: original, submitted: true })
  const controls = { failWrite: true }
  const app = createHarness(storage, controls)
  try {
    await app.nextTick()
    assert.equal(app.state.draft.submitted, false)
    assert.equal(app.draft().description, original)
    assert.equal(app.state.descriptionCount.value, 501)
    assert.match(app.state.storageMessage.value, /更正未能保存/)
    assert.equal(app.stored().description, original)
    assert.equal(app.stored().submitted, true)
  } finally {
    app.close()
  }
})

test('valid submitted record at 500 characters remains submitted and unchanged', async () => {
  const storage = new Map()
  const original = 'F'.repeat(500)
  storeDraft(storage, { description: original, submitted: true })
  const app = createHarness(storage)
  try {
    await app.nextTick()
    assert.equal(app.state.draft.submitted, true)
    assert.equal(app.draft().description, original)
    assert.equal(app.state.descriptionCount.value, 500)
    assert.equal(app.stored().submitted, true)
  } finally {
    app.close()
  }
})

test('live draft changed to 501 characters is rejected, then exactly 500 can be submitted', async () => {
  const app = createHarness()
  try {
    await app.nextTick()
    app.state.draft.description = 'G'.repeat(500) + '尾'
    app.state.draft.checkedMaterials = [...requiredIds]
    await app.nextTick()
    assert.equal(app.state.submitDraft(), false)
    assert.equal(app.state.showDescriptionError.value, true)
    assert.equal(app.state.draft.submitted, false)
    app.state.draft.description = 'G'.repeat(500)
    await app.nextTick()
    assert.equal(app.state.submitDraft(), true)
    assert.equal(app.state.showDescriptionError.value, false)
    assert.equal(app.state.draft.submitted, true)
    assert.equal(app.stored().description.length, 500)
    assert.equal(app.stored().submitted, true)
  } finally {
    app.close()
  }
})

test('old submitted records with empty description or missing required material still downgrade', async (t) => {
  await t.test('empty description', async () => {
    const storage = new Map()
    storeDraft(storage, { description: '', submitted: true })
    const app = createHarness(storage)
    try {
      await app.nextTick()
      assert.equal(app.state.draft.submitted, false)
      assert.equal(app.draft().description, '')
      assert.equal(app.stored().submitted, false)
    } finally {
      app.close()
    }
  })
  await t.test('missing required material', async () => {
    const storage = new Map()
    storeDraft(storage, { description: '有效虚构说明', checkedMaterials: ['project-note'], submitted: true })
    const app = createHarness(storage)
    try {
      await app.nextTick()
      assert.equal(app.state.draft.submitted, false)
      assert.deepEqual(Array.from(app.state.draft.checkedMaterials), ['project-note'])
      assert.equal(app.stored().submitted, false)
    } finally {
      app.close()
    }
  })
})

test('reset removes the example storage record and restores a blank editable draft', async () => {
  const storage = new Map([['unrelated-example-key', 'keep']])
  storeDraft(storage, { description: '有效虚构说明' })
  const app = createHarness(storage)
  try {
    await app.nextTick()
    assert.equal(await app.state.resetDraft(), true)
    assert.deepEqual(app.draft(), { description: '', checkedMaterials: [], submitted: false })
    assert.equal(storage.has(storageKey), false)
    assert.equal(storage.get('unrelated-example-key'), 'keep')
  } finally {
    app.close()
  }
})
