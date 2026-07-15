function createFlowchartNode({
  id,
  type = 'process',
  text = '',
  x = 0,
  y = 0,
  width = 168,
  height = 72,
  style = {}
} = {}) {
  return {
    id: String(id || ''),
    type,
    text: String(text || '').trim() || DEFAULT_UNNAMED_NODE_TEXT,
    x: Number.isFinite(Number(x)) ? Number(x) : 0,
    y: Number.isFinite(Number(y)) ? Number(y) : 0,
    width: Number.isFinite(Number(width)) ? Number(width) : 168,
    height: Number.isFinite(Number(height)) ? Number(height) : 72,
    style: style && typeof style === 'object' ? { ...style } : {}
  }
}

function normalizeFlowchartEdgeRoute(route) {
  if (!route || typeof route !== 'object') {
    return null
  }
  const manualPoints = (Array.isArray(route?.manualPoints) ? route.manualPoints : [])
    .map(point => {
      const x = Number(point?.x)
      const y = Number(point?.y)
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        return null
      }
      return {
        x: Math.round(x * 100) / 100,
        y: Math.round(y * 100) / 100
      }
    })
    .filter(Boolean)
  if (manualPoints.length) {
    return {
      manualPoints
    }
  }
  const laneAxis = String(route?.orthogonalLane?.axis || '').trim()
  const laneValue = Number(route?.orthogonalLane?.value)
  if (!['x', 'y'].includes(laneAxis) || !Number.isFinite(laneValue)) {
    return null
  }
  return {
    orthogonalLane: {
      axis: laneAxis,
      value: laneValue
    }
  }
}

export function normalizeFlowchartEdgeLabelPosition(labelPosition) {
  if (!labelPosition || typeof labelPosition !== 'object') {
    return null
  }
  const ratio = Math.max(0, Math.min(1, Number(labelPosition?.ratio)))
  const offsetX = Number(labelPosition?.offsetX)
  const offsetY = Number(labelPosition?.offsetY)
  const normalizedLabelPosition = {
    ratio: Number.isFinite(ratio) ? ratio : 0.5,
    offsetX: Number.isFinite(offsetX) ? offsetX : 0,
    offsetY: Number.isFinite(offsetY) ? offsetY : 0
  }
  if (
    Math.abs(normalizedLabelPosition.ratio - 0.5) <= 0.0001 &&
    Math.abs(normalizedLabelPosition.offsetX) <= 0.001 &&
    Math.abs(normalizedLabelPosition.offsetY) <= 0.001
  ) {
    return null
  }
  return normalizedLabelPosition
}

function createFlowchartEdge({
  id,
  source = '',
  target = '',
  label = '',
  sourceAnchor = null,
  targetAnchor = null,
  route = null,
  labelPosition = null,
  style = {}
} = {}) {
  return {
    id: String(id || ''),
    source: String(source || '').trim(),
    target: String(target || '').trim(),
    label: String(label || ''),
    sourceAnchor: normalizeFlowchartNodeAnchor(sourceAnchor),
    targetAnchor: normalizeFlowchartNodeAnchor(targetAnchor),
    route: normalizeFlowchartEdgeRoute(route),
    labelPosition: normalizeFlowchartEdgeLabelPosition(labelPosition),
    style: style && typeof style === 'object' ? { ...style } : {}
  }
}

function createFlowchartLane({
  id,
  label = '',
  x = 0,
  y = 0,
  width = 960,
  height = 140,
  accent = ''
} = {}) {
  return {
    id: String(id || ''),
    label: String(label || '').trim(),
    x: Number.isFinite(Number(x)) ? Number(x) : 0,
    y: Number.isFinite(Number(y)) ? Number(y) : 0,
    width: Number.isFinite(Number(width)) ? Number(width) : 960,
    height: Number.isFinite(Number(height)) ? Number(height) : 140,
    accent: String(accent || '').trim()
  }
}

const createFlowchartViewport = viewport => {
  return {
    x: Number.isFinite(Number(viewport?.x)) ? Number(viewport.x) : 0,
    y: Number.isFinite(Number(viewport?.y)) ? Number(viewport.y) : 0,
    zoom: Number.isFinite(Number(viewport?.zoom))
      ? Math.max(0.2, Number(viewport.zoom))
      : 1
  }
}

const normalizeTemplateLayout = (
  templateData,
  { mode = 'document', templateId = 'blank' } = {}
) => {
  const normalizedTemplate = {
    ...templateData,
    nodes: Array.isArray(templateData?.nodes)
      ? templateData.nodes.map(node => ({
          ...node,
          style: {
            ...(node.style || {})
          }
        }))
      : [],
    edges: Array.isArray(templateData?.edges)
      ? templateData.edges.map(edge => ({
          ...edge,
          style: {
            ...(edge.style || {}),
            pathType: 'orthogonal'
          }
        }))
      : [],
    lanes: Array.isArray(templateData?.lanes)
      ? templateData.lanes.map(lane => ({
          ...lane,
          label: ''
        }))
      : []
  }

  compactTemplateLayout(normalizedTemplate, mode, templateId)
  alignTemplateColumnNodes(normalizedTemplate)
  alignTemplateMergeNodes(normalizedTemplate)
  alignTemplateColumnNodes(normalizedTemplate)
  if (mode === 'preview') {
    resolveTemplateNodeOverlaps(normalizedTemplate)
  }
  return normalizedTemplate
}

const getNodeCenter = node => ({
  x: Number(node.x || 0) + Number(node.width || 0) / 2,
  y: Number(node.y || 0) + Number(node.height || 0) / 2
})

const getTemplateRowAnchor = node => Number(node?.y || 0)

