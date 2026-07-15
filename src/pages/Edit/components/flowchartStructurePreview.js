/**
 * Shared flowchart structure preview helpers.
 * Used by template cards and AI canvas-level preview.
 */
import {
  getFlowchartEdgeDashArray,
  getFlowchartEdgeLayout
} from '@/services/flowchartDocument'

export const getFlowchartStructurePreviewViewBox = (preview, padding = 36) => {
  const items = Array.isArray(preview?.nodes) ? preview.nodes : []
  if (!items.length) {
    return '0 0 320 200'
  }
  const bounds = items.reduce(
    (result, node) => ({
      minX: Math.min(result.minX, Number(node.x || 0)),
      minY: Math.min(result.minY, Number(node.y || 0)),
      maxX: Math.max(result.maxX, Number(node.x || 0) + Number(node.width || 0)),
      maxY: Math.max(result.maxY, Number(node.y || 0) + Number(node.height || 0))
    }),
    {
      minX: Infinity,
      minY: Infinity,
      maxX: -Infinity,
      maxY: -Infinity
    }
  )
  return `${bounds.minX - padding} ${bounds.minY - padding} ${
    bounds.maxX - bounds.minX + padding * 2
  } ${bounds.maxY - bounds.minY + padding * 2}`
}

export const getFlowchartStructurePreviewPath = (preview, edge) => {
  const nodes = Array.isArray(preview?.nodes) ? preview.nodes : []
  const source = nodes.find(node => node.id === edge?.source)
  const target = nodes.find(node => node.id === edge?.target)
  if (!source || !target) {
    return ''
  }
  return getFlowchartEdgeLayout(edge, source, target, {
    nodes
  }).path
}

export const getFlowchartDecisionPolygon = node => {
  const x = Number(node.x || 0)
  const y = Number(node.y || 0)
  const width = Number(node.width || 0)
  const height = Number(node.height || 0)
  return [
    `${x + width / 2},${y}`,
    `${x + width},${y + height / 2}`,
    `${x + width / 2},${y + height}`,
    `${x},${y + height / 2}`
  ].join(' ')
}

export const getFlowchartInputPolygon = node => {
  const x = Number(node.x || 0)
  const y = Number(node.y || 0)
  const width = Number(node.width || 0)
  const height = Number(node.height || 0)
  const offset = Math.max(width * 0.12, 16)
  return [
    `${x + offset},${y}`,
    `${x + width},${y}`,
    `${x + width - offset},${y + height}`,
    `${x},${y + height}`
  ].join(' ')
}

export const getFlowchartStructureEdgeStyle = edge => {
  return {
    stroke: '#111111',
    strokeDasharray:
      getFlowchartEdgeDashArray(edge?.style?.dashPattern, edge?.style?.dashed) ||
      null
  }
}

export const getFlowchartStructureNodeStyle = () => {
  return {
    fill: '#ffffff',
    stroke: '#111111'
  }
}

export const summarizeFlowchartStructure = flowchartData => {
  const nodes = Array.isArray(flowchartData?.nodes) ? flowchartData.nodes : []
  const edges = Array.isArray(flowchartData?.edges) ? flowchartData.edges : []
  return {
    title: String(flowchartData?.title || '').trim(),
    nodes: nodes.length,
    edges: edges.length,
    preview: {
      nodes,
      edges
    }
  }
}
