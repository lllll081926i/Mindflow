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
        danglingEdgeCount: 0
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

  // nodes with only outgoing/incoming are fine for process graphs; no extra issue

  return {
    ok: !issues.some(item => item.severity === 'error'),
    issues,
    summary: {
      nodes: nodes.length,
      edges: edges.length,
      startCount: startNodes.length,
      endCount: endNodes.length,
      floatingCount: floatingNodes.length,
      danglingEdgeCount
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
  let removedEdges = 0
  edges.forEach(edge => {
    if (nodeMap.has(edge.source) && nodeMap.has(edge.target)) {
      validEdges.push(edge)
    } else {
      removedEdges += 1
    }
  })
  if (removedEdges > 0) {
    actions.push({ code: 'remove-dangling-edges', count: removedEdges })
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

  // connect floating nodes to start/end chain
  const floating = nodes.filter(node => {
    if (node.type === 'start' || node.type === 'end') return false
    return (incoming.get(node.id) || 0) === 0 && (outgoing.get(node.id) || 0) === 0
  })
  floating.forEach(node => {
    if (startNode) {
      validEdges.push({
        id: createTempId('edge', nextIndex++),
        source: startNode.id,
        target: node.id,
        label: '',
        style: {}
      })
      outgoing.set(startNode.id, (outgoing.get(startNode.id) || 0) + 1)
      incoming.set(node.id, (incoming.get(node.id) || 0) + 1)
    }
    if (endNode) {
      validEdges.push({
        id: createTempId('edge', nextIndex++),
        source: node.id,
        target: endNode.id,
        label: '',
        style: {}
      })
      outgoing.set(node.id, (outgoing.get(node.id) || 0) + 1)
      incoming.set(endNode.id, (incoming.get(endNode.id) || 0) + 1)
    }
  })
  if (floating.length) {
    actions.push({ code: 'connect-floating', count: floating.length, nodeIds: floating.map(n => n.id) })
  }

  // if start exists but has no outgoing and there are process nodes, connect to nearest process
  if (startNode && (outgoing.get(startNode.id) || 0) === 0) {
    const candidates = nodes.filter(n => n.id !== startNode.id && n.type !== 'end')
    if (candidates.length) {
      const target = candidates[0]
      validEdges.push({
        id: createTempId('edge', nextIndex++),
        source: startNode.id,
        target: target.id,
        label: '',
        style: {}
      })
      actions.push({ code: 'connect-start', nodeId: target.id })
    }
  }

  if (endNode && (incoming.get(endNode.id) || 0) === 0) {
    const candidates = nodes.filter(n => n.id !== endNode.id && n.type !== 'start')
    if (candidates.length) {
      const source = candidates[candidates.length - 1]
      validEdges.push({
        id: createTempId('edge', nextIndex++),
        source: source.id,
        target: endNode.id,
        label: '',
        style: {}
      })
      actions.push({ code: 'connect-end', nodeId: source.id })
    }
  }

  const nextData = {
    ...flowchartData,
    nodes,
    edges: validEdges
  }
  const nextResult = validateFlowchartStructure(nextData)
  return {
    actions,
    flowchartData: nextData,
    before: result,
    after: nextResult
  }
}
