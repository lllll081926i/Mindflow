import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ensureFlowchartWorkbook,
  addFlowchartSheet,
  switchFlowchartSheet,
  deleteFlowchartSheet,
  renameFlowchartSheet
} from '../src/services/flowchartWorkbook.js'

test('流程图可升级为多页工作簿', () => {
  const data = ensureFlowchartWorkbook({
    title: '流程',
    nodes: [{ id: 'a', type: 'start', text: '开始', x: 0, y: 0, width: 100, height: 40 }],
    edges: []
  })
  assert.equal(data.sheets.length, 1)
  assert.equal(data.nodes[0].text, '开始')
})

test('流程图新建/切换/重命名/删除页面', () => {
  let data = ensureFlowchartWorkbook({
    title: '流程',
    nodes: [{ id: 'a', type: 'start', text: 'A', x: 0, y: 0, width: 100, height: 40 }],
    edges: []
  })
  data = addFlowchartSheet(data, { name: '第二页' })
  assert.equal(data.sheets.length, 2)
  assert.equal(data.nodes.length, 0)
  const firstId = data.sheets[0].id
  data = switchFlowchartSheet(data, firstId)
  assert.equal(data.nodes[0].text, 'A')
  data = renameFlowchartSheet(data, firstId, '首页')
  assert.equal(data.sheets.find(s => s.id === firstId).name, '首页')
  const secondId = data.sheets[1].id
  data = deleteFlowchartSheet(data, secondId)
  assert.equal(data.sheets.length, 1)
})
