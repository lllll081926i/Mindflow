/**
 * Flowchart structural validation helpers.
 * Pure functions: no Vue dependency.
 */

const START_TYPES = new Set(['start'])
const END_TYPES = new Set(['end'])

export const validateFlowchartStructure = (flowchartData = {}) => {
  const nodes = Array.isArray(flowchartData?.nodes) ? flowchartData.nodes : []
  const edges = Array.isArray(flowchartData?.edges) ? flowchartData.edges : []
  const nodeMap = new Map(nodes.map(node => [String(node.id || ''), node]))
  const issues = []

  if (!nodes.length) {
    issues.push({
      code: 'empty',
      severity: 'error',
      messageKey: 'flowchart.validateEmpty'
    })
    return {
      ok: false,
      issues,
      summary: {
        nodes: 0,
        edges: 0,
        startCount: 0,
        endCount: 0,
        floatingCount: 0,
        danglingEdgeCount: 0,
        unlabeledDecisionEdgeCount: 0,
        score: 0
      }
    }
  }

  const incoming = new Map(nodes.map(node => [node.id, 0]))
  const outgoing = new Map(nodes.map(node => [node.id, 0]))
  let danglingEdgeCount = 0

  edges.forEach(edge => {
    const source = String(edge?.source || '')
    const target = String(edge?.target || '')
    const sourceExists = nodeMap.has(source)
    const targetExists = nodeMap.has(target)
    if (!sourceExists || !targetExists) {
      danglingEdgeCount += 1
      return
    }
    outgoing.set(source, (outgoing.get(source) || 0) + 1)
    incoming.set(target, (incoming.get(target) || 0) + 1)
  })

  const startNodes = nodes.filter(node => START_TYPES.has(node.type))
  const endNodes = nodes.filter(node => END_TYPES.has(node.type))
  const floatingNodes = nodes.filter(node => {
    const inCount = incoming.get(node.id) || 0
    const outCount = outgoing.get(node.id) || 0
    return inCount === 0 && outCount === 0
  })

  if (!startNodes.length) {
    issues.push({
      code: 'missing-start',
      severity: 'warn',
      messageKey: 'flowchart.validateMissingStart'
    })
  }
  if (!endNodes.length) {
    issues.push({
      code: 'missing-end',
      severity: 'warn',
      messageKey: 'flowchart.validateMissingEnd'
    })
  }
  if (floatingNodes.length) {
    issues.push({
      code: 'floating-nodes',
      severity: 'warn',
      messageKey: 'flowchart.validateFloatingNodes',
      count: floatingNodes.length,
      nodeIds: floatingNodes.map(node => node.id)
    })
  }
  if (danglingEdgeCount > 0) {
    issues.push({
      code: 'dangling-edges',
      severity: 'error',
      messageKey: 'flowchart.validateDanglingEdges',
      count: danglingEdgeCount
    })
  }

  // decision nodes should usually label outgoing branches
  const unlabeledDecisionEdges = []
  nodes
    .filter(node => node.type === 'decision')
    .forEach(node => {
      edges
        .filter(edge => edge.source === node.id)
        .forEach(edge => {
          if (!String(edge.label || '').trim()) {
            unlabeledDecisionEdges.push(edge.id || `${edge.source}->${edge.target}`)
          }
        })
    })
  if (unlabeledDecisionEdges.length) {
    issues.push({
      code: 'unlabeled-decision-edges',
      severity: 'warn',
      messageKey: 'flowchart.validateUnlabeledDecisionEdges',
      count: unlabeledDecisionEdges.length,
      edgeIds: unlabeledDecisionEdges
    })
  }

  const warnCount = issues.filter(i => i.severity === 'warn').length
  const errorCount = issues.filter(i => i.severity === 'error').length
  const score = Math.max(0, 100 - errorCount * 35 - warnCount * 12)

  return {
    ok: errorCount === 0,
    issues,
    summary: {
      nodes: nodes.length,
      edges: edges.length,
      startCount: startNodes.length,
      endCount: endNodes.length,
      floatingCount: floatingNodes.length,
      danglingEdgeCount,
      unlabeledDecisionEdgeCount: unlabeledDecisionEdges.length,
      score
    }
  }
}

export const formatFlowchartValidationMessage = (result, t) => {
  if (!result || !Array.isArray(result.issues) || !result.issues.length) {
    return t('flowchart.validateOk', {
      nodes: result?.summary?.nodes || 0,
      edges: result?.summary?.edges || 0
    })
  }
  return result.issues
    .map(issue => {
      const count = Number(issue.count || 0)
      return t(issue.messageKey, { count })
    })
    .join('；')
}


const createTempId = (prefix, index) => `${prefix}-autofix-${index + 1}-${Date.now().toString(36)}`

export const buildFlowchartAutofixPlan = (flowchartData = {}) => {
  const result = validateFlowchartStructure(flowchartData)
  const nodes = Array.isArray(flowchartData?.nodes) ? flowchartData.nodes.map(n => ({ ...n })) : []
  const edges = Array.isArray(flowchartData?.edges) ? flowchartData.edges.map(e => ({ ...e })) : []
  const actions = []
  let nextIndex = 0

  const nodeMap = new Map(nodes.map(node => [String(node.id || ''), node]))
  const incoming = new Map(nodes.map(node => [node.id, 0]))
  const outgoing = new Map(nodes.map(node => [node.id, 0]))
  edges.forEach(edge => {
    if (!nodeMap.has(edge.source) || !nodeMap.has(edge.target)) return
    outgoing.set(edge.source, (outgoing.get(edge.source) || 0) + 1)
    incoming.set(edge.target, (incoming.get(edge.target) || 0) + 1)
  })

  // remove dangling edges first
  const validEdges = []
  let removedDanglingEdgeCount = 0
  edges.forEach(edge => {
    if (nodeMap.has(edge.source) && nodeMap.has(edge.target)) {
      validEdges.push(edge)
    } else {
      removedDanglingEdgeCount += 1
    }
  })
  if (removedDanglingEdgeCount > 0) {
    actions.push({ code: 'remove-dangling-edges', count: removedDanglingEdgeCount })
  }

  // recompute after edge cleanup
  incoming.clear()
  outgoing.clear()
  nodes.forEach(node => {
    incoming.set(node.id, 0)
    outgoing.set(node.id, 0)
  })
  validEdges.forEach(edge => {
    outgoing.set(edge.source, (outgoing.get(edge.source) || 0) + 1)
    incoming.set(edge.target, (incoming.get(edge.target) || 0) + 1)
  })

  let startNode = nodes.find(node => node.type === 'start') || null
  let endNode = nodes.find(node => node.type === 'end') || null

  if (!startNode && nodes.length) {
    // place left of leftmost node
    const minX = Math.min(...nodes.map(n => Number(n.x || 0)))
    const avgY =
      nodes.reduce((sum, n) => sum + Number(n.y || 0) + Number(n.height || 0) / 2, 0) /
      nodes.length
    startNode = {
      id: createTempId('start', nextIndex++),
      type: 'start',
      text: '开始',
      x: minX - 220,
      y: avgY - 28,
      width: 140,
      height: 56,
      style: {}
    }
    nodes.push(startNode)
    incoming.set(startNode.id, 0)
    outgoing.set(startNode.id, 0)
    actions.push({ code: 'add-start', nodeId: startNode.id })
  }

  if (!endNode && nodes.length) {
    const maxX = Math.max(...nodes.map(n => Number(n.x || 0) + Number(n.width || 0)))
    const avgY =
      nodes.reduce((sum, n) => sum + Number(n.y || 0) + Number(n.height || 0) / 2, 0) /
      nodes.length
    endNode = {
      id: createTempId('end', nextIndex++),
      type: 'end',
      text: '结束',
      x: maxX + 80,
      y: avgY - 28,
      width: 140,
      height: 56,
      style: {}
    }
    nodes.push(endNode)
    incoming.set(endNode.id, 0)
    outgoing.set(endNode.id, 0)
    actions.push({ code: 'add-end', nodeId: endNode.id })
  }

  const centerOf = node => ({
    x: Number(node.x || 0) + Number(node.width || 0) / 2,
    y: Number(node.y || 0) + Number(node.height || 0) / 2
  })
  const distance = (a, b) => {
    const ca = centerOf(a)
    const cb = centerOf(b)
    const dx = ca.x - cb.x
    const dy = ca.y - cb.y
    return Math.hypot(dx, dy)
  }
  const edgeExists = (sourceId, targetId) =>
    validEdges.some(edge => edge.source === sourceId && edge.target === targetId)
  const addEdge = (sourceId, targetId, code) => {
    if (!sourceId || !targetId || sourceId === targetId || edgeExists(sourceId, targetId)) {
      return false
    }
    validEdges.push({
      id: createTempId('edge', nextIndex++),
      source: sourceId,
      target: targetId,
      label: '',
      style: {}
    })
    outgoing.set(sourceId, (outgoing.get(sourceId) || 0) + 1)
    incoming.set(targetId, (incoming.get(targetId) || 0) + 1)
    if (code) actions.push({ code, sourceId, targetId })
    return true
  }

  // connect floating nodes with nearest-path chaining (avoid star connections)
  const floating = nodes
    .filter(node => {
      if (node.type === 'start' || node.type === 'end') return false
      return (incoming.get(node.id) || 0) === 0 && (outgoing.get(node.id) || 0) === 0
    })
    .sort((a, b) => {
      const ca = centerOf(a)
      const cb = centerOf(b)
      return ca.x - cb.x || ca.y - cb.y
    })

  if (floating.length) {
    // chain floating nodes left-to-right
    for (let i = 0; i < floating.length - 1; i++) {
      addEdge(floating[i].id, floating[i + 1].id, 'chain-floating')
    }
    // attach chain ends to start/end by nearest endpoint
    if (startNode) {
      const nearest = floating.reduce((best, node) => {
        if (!best) return node
        return distance(startNode, node) < distance(startNode, best) ? node : best
      }, null)
      addEdge(startNode.id, nearest.id, 'connect-start')
    }
    if (endNode) {
      const nearest = floating.reduce((best, node) => {
        if (!best) return node
        return distance(endNode, node) < distance(endNode, best) ? node : best
      }, null)
      addEdge(nearest.id, endNode.id, 'connect-end')
    }
    actions.push({
      code: 'connect-floating',
      count: floating.length,
      nodeIds: floating.map(n => n.id)
    })
  }

  // if start has no outgoing, connect to nearest non-end node
  if (startNode && (outgoing.get(startNode.id) || 0) === 0) {
    const candidates = nodes.filter(n => n.id !== startNode.id && n.type !== 'end')
    if (candidates.length) {
      const target = candidates.reduce((best, node) => {
        if (!best) return node
        return distance(startNode, node) < distance(startNode, best) ? node : best
      }, null)
      addEdge(startNode.id, target.id, 'connect-start')
    }
  }

  // if end has no incoming, connect from nearest non-start node
  if (endNode && (incoming.get(endNode.id) || 0) === 0) {
    const candidates = nodes.filter(n => n.id !== endNode.id && n.type !== 'start')
    if (candidates.length) {
      const source = candidates.reduce((best, node) => {
        if (!best) return node
        return distance(endNode, node) < distance(endNode, best) ? node : best
      }, null)
      addEdge(source.id, endNode.id, 'connect-end')
    }
  }

    // label unlabeled outgoing decision edges by relative target position
  let labeledCount = 0
  nodes
    .filter(node => node.type === 'decision')
    .forEach(decision => {
      const outs = validEdges.filter(edge => edge.source === decision.id)
      const unlabeled = outs.filter(edge => !String(edge.label || '').trim())
      if (!unlabeled.length) return
      // sort by target y then x
      const enriched = unlabeled
        .map(edge => {
          const target = nodeMap.get(edge.target)
          return {
            edge,
            x: Number(target?.x || 0),
            y: Number(target?.y || 0)
          }
        })
        .sort((a, b) => a.y - b.y || a.x - b.x)
      if (enriched.length === 1) {
        enriched[0].edge.label = '是'
        labeledCount += 1
        return
      }
      enriched.forEach((item, index) => {
        if (index === 0) item.edge.label = '是'
        else if (index === 1) item.edge.label = '否'
        else item.edge.label = `分支${index + 1}`
        labeledCount += 1
      })
    })
  if (labeledCount > 0) {
    actions.push({ code: 'label-decision-edges', count: labeledCount })
  }

  const nextData = {
    ...flowchartData,
    nodes,
    edges: validEdges
  }
  const nextResult = validateFlowchartStructure(nextData)
  const beforeNodes = Array.isArray(flowchartData?.nodes) ? flowchartData.nodes : []
  const beforeEdges = Array.isArray(flowchartData?.edges) ? flowchartData.edges : []
  const beforeNodeIds = new Set(beforeNodes.map(n => String(n.id || '')))
  const afterNodeIds = new Set(nodes.map(n => String(n.id || '')))
  const beforeEdgeIds = new Set(beforeEdges.map(e => String(e.id || '')))
  const afterEdgeIds = new Set(validEdges.map(e => String(e.id || '')))
  const addedNodes = nodes.filter(n => !beforeNodeIds.has(String(n.id || '')))
  const removedNodes = beforeNodes.filter(n => !afterNodeIds.has(String(n.id || '')))
  const addedEdges = validEdges.filter(e => !beforeEdgeIds.has(String(e.id || '')))
  const removedEdges = beforeEdges.filter(e => !afterEdgeIds.has(String(e.id || '')))
  const labeledEdges = validEdges.filter(e => {
    const prev = beforeEdges.find(p => String(p.id || '') === String(e.id || ''))
    return prev && !String(prev.label || '').trim() && String(e.label || '').trim()
  })
  return {
    actions,
    flowchartData: nextData,
    before: result,
    after: nextResult,
    diff: {
      addedNodes: addedNodes.map(n => ({ id: n.id, type: n.type, text: n.text })),
      removedNodes: removedNodes.map(n => ({ id: n.id, type: n.type, text: n.text })),
      addedEdges: addedEdges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label
      })),
      removedEdges: removedEdges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target
      })),
      labeledEdges: labeledEdges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label
      })),
      nodeDelta: nodes.length - beforeNodes.length,
      edgeDelta: validEdges.length - beforeEdges.length,
      scoreDelta:
        Number(nextResult?.summary?.score || 0) - Number(result?.summary?.score || 0)
    }
  }
}
