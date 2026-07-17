import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const root = path.resolve('.')
const editSource = fs.readFileSync(
  path.join(root, 'src/pages/Edit/components/Edit.vue'),
  'utf8'
)
const apiSource = fs.readFileSync(path.join(root, 'src/api/index.js'), 'utf8')
const viewStateSource = fs.readFileSync(
  path.join(root, 'src/services/mindmapViewState.js'),
  'utf8'
)

test('视图/折叠记忆 helper 导出恢复与 expand 规范化', async () => {
  assert.match(viewStateSource, /export const hasMindMapViewState/)
  assert.match(viewStateSource, /export const restoreMindMapViewState/)
  assert.match(viewStateSource, /export const applyMindMapViewAfterLoad/)
  assert.match(viewStateSource, /export const ensureExplicitExpandFlags/)

  const mod = await import(
    pathToFileURL(path.join(root, 'src/services/mindmapViewState.js')).href
  )
  const tree = {
    data: { text: 'root' },
    children: [
      {
        data: { text: 'child', expand: false },
        children: [{ data: { text: 'leaf' }, children: [] }]
      }
    ]
  }
  mod.ensureExplicitExpandFlags(tree)
  assert.equal(tree.data.expand, true)
  assert.equal(tree.children[0].data.expand, false)
  assert.equal(tree.children[0].children[0].data.expand, true)

  let applied = null
  const mindMap = {
    view: {
      setTransformData(view) {
        applied = view
      },
      fit() {
        applied = 'fit'
      },
      reset() {
        applied = 'reset'
      }
    }
  }
  assert.equal(
    mod.applyMindMapViewAfterLoad(mindMap, { state: { scale: 1.2 } }),
    'restored'
  )
  assert.deepEqual(applied, { state: { scale: 1.2 } })
  assert.equal(mod.applyMindMapViewAfterLoad(mindMap, null), 'fitted')
  assert.equal(applied, 'fit')
})

test('Edit.setData 不再在有保存视图时强制 reset', () => {
  assert.match(editSource, /ensureExplicitExpandFlags\(normalized\.root\)/)
  assert.match(editSource, /hasMindMapViewState\(normalized\.view\)/)
  assert.match(editSource, /restoreMindMapViewState\(this\.mindMap, normalized\.view\)/)
  // Must not unconditionally call view.reset after setFullData
  assert.doesNotMatch(
    editSource,
    /setFullData\(\{[\s\S]*?\}\)\s*\n\s*\} else \{[\s\S]*?\}\s*\n\s*this\.mindMap\?\.view\?\.reset/
  )
})

test('切换画布时优先恢复 view，而不是无条件 fit', () => {
  assert.match(editSource, /applyMindMapViewAfterLoad\(this\.mindMap, next\.view/)
  assert.match(editSource, /fitIfEmpty:\s*true/)
})

test('storeData 在仅 view 变更时也会写入当前 sheet.view', () => {
  assert.match(apiSource, /else if \(data\.view !== undefined\)/)
  assert.match(
    apiSource,
    /sheet\.id !== originData\.activeSheetId[\s\S]*view: data\.view/
  )
})
