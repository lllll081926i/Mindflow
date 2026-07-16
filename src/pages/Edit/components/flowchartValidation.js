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
