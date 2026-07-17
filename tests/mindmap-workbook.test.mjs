import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ensureMindmapWorkbook,
  addMindmapSheet,
  switchMindmapSheet,
  deleteMindmapSheet,
  renameMindmapSheet,
  moveMindmapSheet,
  createWorkbookFromMindmapList
} from '../src/services/mindmapWorkbook.js'

test('单根文档可升级为多画布工作簿并保持内容', () => {
  const data = {
    root: { data: { text: '中心' }, children: [] },
    theme: { template: 'classic4', config: {} },
    layout: 'logicalStructure'
  }
  const workbook = ensureMindmapWorkbook(data)
  assert.equal(workbook.sheets.length, 1)
  assert.equal(workbook.root.data.text, '中心')
  assert.ok(workbook.activeSheetId)
})

test('新建/切换/重命名/删除画布', () => {
  let data = ensureMindmapWorkbook({
    root: { data: { text: 'A' }, children: [] },
    theme: { template: 'classic4', config: {} },
    layout: 'logicalStructure'
  })
  data = addMindmapSheet(data, { name: '第二页' })
  assert.equal(data.sheets.length, 2)
  assert.equal(data.root.data.text, '第二页')
  const firstId = data.sheets[0].id
  data = switchMindmapSheet(data, firstId)
  assert.equal(data.activeSheetId, firstId)
  assert.equal(data.root.data.text, 'A')
  data = renameMindmapSheet(data, firstId, '首页')
  assert.equal(data.sheets.find(s => s.id === firstId).name, '首页')
  const secondId = data.sheets[1].id
  data = deleteMindmapSheet(data, secondId)
  assert.equal(data.sheets.length, 1)
  assert.equal(data.sheets[0].name, '首页')
})

test('多个导图根可组装为工作簿', () => {
  const workbook = createWorkbookFromMindmapList([
    { data: { text: '一' }, children: [] },
    { root: { data: { text: '二' }, children: [] } }
  ])
  assert.equal(workbook.sheets.length, 2)
  assert.equal(workbook.root.data.text, '一')
})


test('画布可重排序', () => {
  let data = ensureMindmapWorkbook({
    root: { data: { text: 'A' }, children: [] },
    theme: { template: 'classic4', config: {} },
    layout: 'logicalStructure'
  })
  data = addMindmapSheet(data, { name: 'B' })
  data = addMindmapSheet(data, { name: 'C' })
  const firstId = data.sheets[0].id
  data = moveMindmapSheet(data, firstId, 2)
  assert.equal(data.sheets[2].id, firstId)
})

test('可使用自定义 root 新建画布', async () => {
  const {
    ensureMindmapWorkbook,
    addMindmapSheet,
    createMindmapSheet
  } = await import('../src/services/mindmapWorkbook.js')
  let data = ensureMindmapWorkbook(
    createMindmapSheet({
      name: '主画布',
      root: { data: { text: 'root' }, children: [] }
    })
  )
  data = addMindmapSheet(data, {
    name: '分支画布',
    root: {
      data: { text: '专题', uid: 't1' },
      children: [{ data: { text: '子节点', uid: 't2' }, children: [] }]
    }
  })
  assert.equal(data.sheets.length, 2)
  assert.equal(data.sheets[1].root.data.text, '专题')
  assert.equal(data.sheets[1].root.children[0].data.text, '子节点')
  assert.equal(data.activeSheetId, data.sheets[1].id)
})
