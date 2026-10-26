import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { runInNewContext } from 'node:vm'
import { test } from 'node:test'

const appPath = new URL('../app.js', import.meta.url)
const appSource = await readFile(appPath, 'utf8')
const requiredValues = ['project-note', 'schedule']
const optionalValue = 'space-sketch'

function element() {
  return {
    dataset: {},
    classList: { toggle() {} },
    addEventListener() {},
    focus() {},
    scrollIntoView() {},
    value: '',
    checked: false,
    hidden: false,
    disabled: false,
    readOnly: false,
    textContent: '',
    innerHTML: '',
  }
}

function loadPage(initialState, { failWrite = false } = {}) {
  const selectors = [
    '#application-form', '#application-description', '#status-label', '#draft-indicator',
    '#description-error', '#materials-error', '#character-count', '#checked-count',
    '#save-draft', '#submit-application', '#reset-demo', '#submitted-panel',
  ]
  const elements = Object.fromEntries(selectors.map((selector) => [selector, element()]))
  const checkboxes = [
    ...requiredValues.map((value) => ({ ...element(), value, dataset: { required: 'true' } })),
    { ...element(), value: optionalValue, dataset: { required: 'false' } },
  ]
  const steps = [element(), element(), element()]
  const storage = {
    value: JSON.stringify(initialState),
    writes: [],
    getItem() { return this.value },
    setItem(key, value) {
      if (failWrite) throw new Error('Fictional storage write failure')
      this.value = value
      this.writes.push({ key, value })
    },
    removeItem() { this.value = null },
  }
  const document = {
    querySelector(selector) { return elements[selector] },
    querySelectorAll(selector) {
      if (selector.includes('name="materials"')) return checkboxes
      if (selector === '.steps-list li') return steps
      return []
    },
  }

  runInNewContext(appSource, { document, localStorage: storage, window: { confirm: () => true } })
  return { elements, checkboxes, storage }
}

test('recovers invalid submitted records as drafts and saves the correction', async (t) => {
  const cases = [
    { label: 'blank description', description: '  ', materials: [...requiredValues] },
    { label: 'missing first required material', description: 'Fictional application', materials: ['schedule'] },
    { label: 'missing second required material', description: 'Fictional application', materials: ['project-note'] },
  ]

  for (const scenario of cases) {
    await t.test(scenario.label, () => {
      const { elements, checkboxes, storage } = loadPage({
        description: scenario.description,
        materials: scenario.materials,
        status: '已提交',
      })
      const form = elements['#application-form']
      const description = elements['#application-description']

      assert.equal(form.dataset.status, 'draft')
      assert.equal(description.disabled, false)
      assert.equal(description.readOnly, false)
      assert.equal(elements['#status-label'].textContent, '草稿')
      assert.equal(elements['#submitted-panel'].hidden, true)
      assert.deepEqual(checkboxes.filter((box) => box.checked).map((box) => box.value), scenario.materials)
      assert.match(elements['#draft-indicator'].innerHTML, /无效的已提交记录已按草稿恢复，并已更正保存/)
      assert.equal(storage.writes.length, 1)
      assert.deepEqual(JSON.parse(storage.value), {
        description: scenario.description,
        materials: scenario.materials,
        status: '草稿',
      })
    })
  }
})

test('keeps a valid submitted record locked on recovery', () => {
  const { elements, storage } = loadPage({
    description: 'Fictional application',
    materials: [...requiredValues, optionalValue],
    status: '已提交',
  })

  assert.equal(elements['#application-form'].dataset.status, 'submitted')
  assert.equal(elements['#application-description'].disabled, true)
  assert.equal(elements['#application-description'].readOnly, true)
  assert.equal(elements['#status-label'].textContent, '已提交')
  assert.equal(elements['#submitted-panel'].hidden, false)
  assert.equal(storage.writes.length, 0)
})

test('keeps the recovered draft editable and reports a failed correction write', () => {
  const { elements, storage } = loadPage({
    description: '',
    materials: [],
    status: '已提交',
  }, { failWrite: true })

  assert.equal(elements['#application-form'].dataset.status, 'draft')
  assert.equal(elements['#application-description'].disabled, false)
  assert.match(elements['#draft-indicator'].innerHTML, /无效的已提交记录已按草稿恢复，但更正未能保存/)
  assert.equal(storage.writes.length, 0)
})

test('a saved correction stays a draft after a second page load', () => {
  const firstLoad = loadPage({
    description: 'Fictional application',
    materials: ['project-note'],
    status: '已提交',
  })
  const secondLoad = loadPage(JSON.parse(firstLoad.storage.value))

  assert.equal(firstLoad.elements['#application-form'].dataset.status, 'draft')
  assert.equal(secondLoad.elements['#application-form'].dataset.status, 'draft')
  assert.equal(secondLoad.elements['#application-description'].disabled, false)
  assert.equal(secondLoad.elements['#status-label'].textContent, '草稿')
  assert.doesNotMatch(secondLoad.elements['#draft-indicator'].innerHTML, /无效的已提交记录/)
  assert.equal(secondLoad.storage.writes.length, 0)
})
