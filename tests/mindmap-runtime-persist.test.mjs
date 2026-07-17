import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const root = path.resolve('.')

test('workbook 切换时保留折叠与 view，storeData 会同步 sheet.view', async () => {
  const workbookMod = await import(
    pathToFileURL(path.join(root, 'src/services/mindmapWorkbook.js')).href
  )
  const viewMod = await import(
    pathToFileURL(path.join(root, 'src/services/mindmapViewState.js')).href
  )

  const sheetA = workbookMod.createMindmapSheet({
    id: 'a',
    name: 'A',
    root: {
      data: { text: 'rootA', uid: 'ra', expand: true },
      children: [
        {
          data: { text: 'child', uid: 'ca', expand: false },
          children: [{ data: { text: 'leaf', uid: 'la' }, children: [] }]
        }
      ]
    },
    view: { state: { scale: 1.5, x: 12, y: 34 } }
  })
  const sheetB = workbookMod.createMindmapSheet({
    id: 'b',
    name: 'B',
    root: {
      data: { text: 'rootB', uid: 'rb', expand: true },
      children: []
    },
    view: { state: { scale: 0.8, x: 0, y: 0 } }
  })
  let workbook = {
    sheets: [sheetA, sheetB],
    activeSheetId: 'a',
    root: sheetA.root,
    theme: sheetA.theme,
    layout: sheetA.layout,
    view: sheetA.view
  }

  // simulate live edit: collapse remains on live root, view moves
  const live = {
    root: {
      data: { text: 'rootA', uid: 'ra', expand: true },
      children: [
        {
          data: { text: 'child', uid: 'ca', expand: false },
          children: [
            {
              data: { text: 'leaf', uid: 'la', expand: true },
              children: []
            }
          ]
        }
      ]
    },
    theme: sheetA.theme,
    layout: sheetA.layout,
    view: { state: { scale: 2, x: 99, y: 88 } }
  }

  workbook = workbookMod.switchMindmapSheet(workbook, 'b', live)
  assert.equal(workbook.activeSheetId, 'b')
  assert.equal(workbook.root.data.uid, 'rb')

  // switch back — should restore sheet A expand/view from snapshot
  workbook = workbookMod.switchMindmapSheet(workbook, 'a')
  assert.equal(workbook.activeSheetId, 'a')
  assert.equal(workbook.root.children[0].data.expand, false)
  assert.deepEqual(workbook.view, { state: { scale: 2, x: 99, y: 88 } })

  viewMod.ensureExplicitExpandFlags(workbook.root)
  assert.equal(workbook.root.data.expand, true)
  assert.equal(workbook.root.children[0].children[0].data.expand, true)

  // applyMindMapViewAfterLoad prefers restore over fit
  let applied = null
  const mindMap = {
    view: {
      setTransformData(v) {
        applied = v
      },
      fit() {
        applied = 'fit'
      }
    }
  }
  assert.equal(
    viewMod.applyMindMapViewAfterLoad(mindMap, workbook.view),
    'restored'
  )
  assert.deepEqual(applied, workbook.view)
})

test('书签收集与切换在运行时正确工作', async () => {
  const mod = await import(
    pathToFileURL(path.join(root, 'src/services/nodeBookmarks.js')).href
  )
  const node = {
    _icons: ['priority_1'],
    getData(key) {
      if (key === 'icon') return this._icons
      return undefined
    },
    mindMap: {
      renderer: {
        setNodeIcon: (n, icons) => {
          n._icons = icons
        }
      }
    }
  }
  assert.equal(mod.isNodeBookmarked(node), false)
  assert.equal(mod.toggleNodeBookmark(node), true)
  assert.equal(mod.isNodeBookmarked(node), true)
  assert.ok(node._icons.includes('star_0'))
  assert.equal(mod.toggleNodeBookmark(node), true)
  assert.equal(mod.isNodeBookmarked(node), false)
})
