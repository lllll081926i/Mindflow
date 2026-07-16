import test from 'node:test'
import assert from 'node:assert/strict'
import {
  validateFlowchartStructure,
  formatFlowchartValidationMessage
} from '../src/pages/Edit/components/flowchartValidation.js'

test('流程校验识别空画布、缺失起止、悬空节点和无效连线', () => {
  const empty = validateFlowchartStructure({ nodes: [], edges: [] })
  assert.equal(empty.ok, false)
  assert.equal(empty.issues.some(item => item.code === 'empty'), true)

  const broken = validateFlowchartStructure({
    nodes: [
      { id: 'a', type: 'process', text: 'A' },
      { id: 'b', type: 'process', text: 'B' }
    ],
    edges: [{ id: 'e1', source: 'a', target: 'missing' }]
  })
  assert.equal(broken.summary.danglingEdgeCount, 1)
  assert.equal(broken.summary.floatingCount, 2)
  assert.equal(broken.issues.some(item => item.code === 'missing-start'), true)
  assert.equal(broken.issues.some(item => item.code === 'missing-end'), true)

  const ok = validateFlowchartStructure({
    nodes: [
      { id: 's', type: 'start', text: '开始' },
      { id: 'p', type: 'process', text: '处理' },
      { id: 'e', type: 'end', text: '结束' }
    ],
    edges: [
      { id: 'e1', source: 's', target: 'p' },
      { id: 'e2', source: 'p', target: 'e' }
    ]
  })
  assert.equal(ok.ok, true)
  assert.equal(ok.issues.length, 0)

  const message = formatFlowchartValidationMessage(ok, (key, params = {}) => {
    if (key === 'flowchart.validateOk') return `ok-${params.nodes}-${params.edges}`
    return key
  })
  assert.equal(message, 'ok-3-2')
})
