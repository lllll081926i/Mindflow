import test from 'node:test'
import assert from 'node:assert/strict'
import {
  validateFlowchartStructure,
  formatFlowchartValidationMessage,
  buildFlowchartAutofixPlan
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


test('流程自动修复会补齐起止并连接悬空节点', () => {
  const plan = buildFlowchartAutofixPlan({
    nodes: [
      { id: 'p1', type: 'process', text: '孤立处理', x: 100, y: 100, width: 160, height: 72 }
    ],
    edges: [{ id: 'bad', source: 'p1', target: 'missing' }]
  })
  assert.ok(plan.actions.length > 0)
  assert.equal(plan.flowchartData.nodes.some(n => n.type === 'start'), true)
  assert.equal(plan.flowchartData.nodes.some(n => n.type === 'end'), true)
  assert.equal(plan.after.summary.danglingEdgeCount, 0)
  assert.equal(plan.after.summary.floatingCount, 0)
})


test('自动修复按最近路径串接悬空节点，避免对起止星型过度连线', () => {
  const plan = buildFlowchartAutofixPlan({
    nodes: [
      { id: 'a', type: 'process', text: 'A', x: 0, y: 0, width: 120, height: 60 },
      { id: 'b', type: 'process', text: 'B', x: 200, y: 0, width: 120, height: 60 },
      { id: 'c', type: 'process', text: 'C', x: 400, y: 0, width: 120, height: 60 }
    ],
    edges: []
  })
  const edges = plan.flowchartData.edges
  // should chain a->b and b->c rather than start->each and each->end only
  const hasChain =
    edges.some(e => e.source === 'a' && e.target === 'b') &&
    edges.some(e => e.source === 'b' && e.target === 'c')
  assert.equal(hasChain, true)
  assert.ok(plan.actions.some(a => a.code === 'connect-floating' || a.code === 'chain-floating' || a.code === 'connect-start'))
  assert.equal(plan.after.summary.floatingCount, 0)
})


test('流程校验识别未标注判断分支，并在自动修复时补默认标签', () => {
  const data = {
    nodes: [
      { id: 's', type: 'start', text: '开始', x: 0, y: 0, width: 120, height: 56 },
      { id: 'd', type: 'decision', text: '是否通过', x: 200, y: 0, width: 160, height: 90 },
      { id: 'a', type: 'process', text: '通过', x: 400, y: -80, width: 120, height: 60 },
      { id: 'b', type: 'process', text: '驳回', x: 400, y: 80, width: 120, height: 60 },
      { id: 'e', type: 'end', text: '结束', x: 600, y: 0, width: 120, height: 56 }
    ],
    edges: [
      { id: 'e1', source: 's', target: 'd' },
      { id: 'e2', source: 'd', target: 'a' },
      { id: 'e3', source: 'd', target: 'b' },
      { id: 'e4', source: 'a', target: 'e' },
      { id: 'e5', source: 'b', target: 'e' }
    ]
  }
  const broken = validateFlowchartStructure(data)
  assert.ok(broken.issues.some(i => i.code === 'unlabeled-decision-edges'))
  assert.ok(Number.isFinite(broken.summary.score))
  const plan = buildFlowchartAutofixPlan(data)
  const outs = plan.flowchartData.edges.filter(e => e.source === 'd')
  assert.equal(outs.every(e => String(e.label || '').trim().length > 0), true)
  assert.ok(plan.actions.some(a => a.code === 'label-decision-edges'))
})
