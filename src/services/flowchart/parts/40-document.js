export const createDefaultFlowchartData = (
  title = DEFAULT_FLOWCHART_TITLE,
  templateId = 'blank'
) => {
  const templateFactory =
    FLOWCHART_TEMPLATES[templateId] || FLOWCHART_TEMPLATES.blank
  const templateData = normalizeTemplateLayout(
    templateFactory(String(title || DEFAULT_FLOWCHART_TITLE)),
    {
      mode: 'document',
      templateId
    }
  )
  return normalizeFlowchartData({
    ...templateData,
    title: String(title || templateData.title || DEFAULT_FLOWCHART_TITLE),
    templateId
  })
}

export const createFlowchartTemplatePreviewData = (
  title = DEFAULT_FLOWCHART_TITLE,
  templateId = 'blank'
) => {
  const templateFactory =
    FLOWCHART_TEMPLATES[templateId] || FLOWCHART_TEMPLATES.blank
  const templateData = normalizeTemplateLayout(
    templateFactory(String(title || DEFAULT_FLOWCHART_TITLE)),
    {
      mode: 'preview',
      templateId
    }
  )
  return normalizeFlowchartData({
    ...templateData,
    title: String(title || templateData.title || DEFAULT_FLOWCHART_TITLE),
    templateId
  })
}

export const createFlowchartDocumentContent = ({
  title = DEFAULT_FLOWCHART_TITLE,
  templateId = 'blank',
  flowchartData,
  flowchartConfig = null
} = {}) => {
  const resolvedTemplateId =
    flowchartData?.templateId || String(templateId || 'blank').trim() || 'blank'
  return {
    documentMode: FLOWCHART_DOCUMENT_MODE,
    flowchartData:
      flowchartData && typeof flowchartData === 'object'
        ? normalizeFlowchartData(flowchartData)
        : createDefaultFlowchartData(title, resolvedTemplateId),
    flowchartConfig: normalizeFlowchartConfig(flowchartConfig, resolvedTemplateId)
  }
}

export const parseStoredDocumentContent = content => {
  const parsed =
    typeof content === 'string' ? parseExternalJsonSafely(content) : content
  if (!parsed || typeof parsed !== 'object') {
    throw createI18nError('文件内容不是有效的项目数据', 'errors.invalidProjectData')
  }
  if (
    parsed.documentMode === FLOWCHART_DOCUMENT_MODE ||
    (parsed.flowchartData && typeof parsed.flowchartData === 'object')
  ) {
    const flowchartDocument = createFlowchartDocumentContent({
      title: parsed.flowchartData?.title || parsed.title,
      templateId: parsed.flowchartData?.templateId || 'blank',
      flowchartData: parsed.flowchartData || parsed,
      flowchartConfig: parsed.flowchartConfig || null
    })
    return {
      documentMode: FLOWCHART_DOCUMENT_MODE,
      data: flowchartDocument.flowchartData,
      config: flowchartDocument.flowchartConfig,
      flowchartData: flowchartDocument.flowchartData,
      flowchartConfig: flowchartDocument.flowchartConfig,
      isFullDataFile: true
    }
  }

  const isFullDataFile = !!parsed.root
  const mindMapData = normalizeMindMapData(parsed)
  return {
    documentMode: MINDMAP_DOCUMENT_MODE,
    data: mindMapData,
    config: parsed.config,
    mindMapData,
    mindMapConfig: parsed.config,
    isFullDataFile
  }
}

export const serializeStoredDocumentContent = ({
  documentMode = MINDMAP_DOCUMENT_MODE,
  data = null,
  config = null,
  isFullDataFile = true,
  mindMapData = null,
  mindMapConfig = null,
  flowchartData = null,
  flowchartConfig = null
} = {}) => {
  if (documentMode === FLOWCHART_DOCUMENT_MODE) {
    return JSON.stringify(
      createFlowchartDocumentContent({
        flowchartData: flowchartData || data,
        flowchartConfig: flowchartConfig || config
      })
    )
  }
  const nextData = mindMapData || data || createFallbackMindMapData()
  if (!isFullDataFile && nextData?.root) {
    return JSON.stringify(nextData.root)
  }
  return JSON.stringify({
    ...nextData,
    ...(mindMapConfig || config ? { config: mindMapConfig || config } : {})
  })
}

export const convertMindMapToFlowchart = (mindMapData, options = {}) => {
  const normalized = normalizeMindMapData(mindMapData)
  const nodes = []
  const edges = []
  const usedNodeIds = new Set()

  const visit = (node, level = 0, column = 0, parentId = '') => {
    const currentIndex = nodes.length
    const currentNode = createFlowNodeFromMindMapNode({
      node,
      index: currentIndex,
      level,
      column,
      usedIds: usedNodeIds
    })
    nodes.push(currentNode)
    if (parentId) {
      edges.push(
        createFlowchartEdge({
          id: createNodeId('edge', edges.length),
          source: parentId,
          target: currentNode.id
        })
      )
    }
    const children = Array.isArray(node?.children) ? node.children : []
    children.forEach((child, childIndex) => {
      visit(child, level + 1, column + childIndex, currentNode.id)
    })
  }

  visit(normalized.root, 0, 0, '')

  return createFlowchartDocumentContent({
    title:
      String(
        options?.title || normalized.root?.data?.text || DEFAULT_FLOWCHART_TITLE
      ).trim() || DEFAULT_FLOWCHART_TITLE,
    templateId: 'blank',
    flowchartData: {
      title:
        String(
          options?.title || normalized.root?.data?.text || DEFAULT_FLOWCHART_TITLE
        ).trim() || DEFAULT_FLOWCHART_TITLE,
      templateId: 'blank',
      viewport: {
        x: 0,
        y: 0,
        zoom: 1
      },
      lanes: [],
      nodes,
      edges
    }
  })
}

const stripHtmlText = value =>
  String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

export const hasConvertibleFlowchartData = flowchartData => {
  const nodes = Array.isArray(flowchartData?.nodes) ? flowchartData.nodes : []
  if (!nodes.length) return false
  return nodes.some(node => stripHtmlText(node?.text || node?.type))
}

/**
 * Convert a flowchart graph into a mind-map tree.
 * Prefer start nodes / indegree-0 roots; preserve edge labels as intermediate
 * topics; attach disconnected leftovers under the root so content is not lost.
 */
export const convertFlowchartToMindMap = (flowchartData = {}, options = {}) => {
  const nodes = Array.isArray(flowchartData?.nodes) ? flowchartData.nodes : []
  const edges = Array.isArray(flowchartData?.edges) ? flowchartData.edges : []
  const nodeMap = new Map(
    nodes
      .filter(node => node && node.id != null)
      .map(node => [String(node.id), node])
  )
  const childrenMap = new Map()
  const indegree = new Map([...nodeMap.keys()].map(id => [id, 0]))

  edges.forEach(edge => {
    const source = String(edge?.source || '')
    const target = String(edge?.target || '')
    if (!nodeMap.has(source) || !nodeMap.has(target) || source === target) {
      return
    }
    if (!childrenMap.has(source)) childrenMap.set(source, [])
    childrenMap.get(source).push({
      target,
      label: stripHtmlText(edge?.label || '')
    })
    indegree.set(target, (indegree.get(target) || 0) + 1)
  })

  childrenMap.forEach(list => {
    list.sort((a, b) => {
      const na = nodeMap.get(a.target)
      const nb = nodeMap.get(b.target)
      const ya = Number(na?.y || 0)
      const yb = Number(nb?.y || 0)
      if (ya !== yb) return ya - yb
      return Number(na?.x || 0) - Number(nb?.x || 0)
    })
  })

  const starts = nodes
    .filter(node => node?.type === 'start')
    .map(node => String(node.id))
  const zeroIn = [...indegree.entries()]
    .filter(([, count]) => count === 0)
    .map(([id]) => id)
  let rootIds = starts.length ? starts : zeroIn
  if (!rootIds.length && nodes.length) {
    rootIds = [String(nodes[0].id)]
  }

  const title =
    stripHtmlText(options?.title || flowchartData?.title || '') || '思维导图'
  const consumed = new Set()

  const buildMindNode = (nodeId, visited) => {
    if (!nodeId || visited.has(nodeId) || !nodeMap.has(nodeId)) return null
    visited.add(nodeId)
    consumed.add(nodeId)
    const node = nodeMap.get(nodeId)
    const text = stripHtmlText(node?.text || '') || node?.type || '节点'
    const data = { text }
    const note = stripHtmlText(node?.note || '')
    const link = stripHtmlText(node?.link || '')
    if (note) data.note = note
    if (link) data.hyperlink = link
    const children = []
    ;(childrenMap.get(nodeId) || []).forEach(linkItem => {
      const child = buildMindNode(linkItem.target, visited)
      if (!child) return
      if (linkItem.label) {
        children.push({
          data: { text: linkItem.label },
          children: [child]
        })
      } else {
        children.push(child)
      }
    })
    return { data, children }
  }

  let root
  if (rootIds.length === 1) {
    root = buildMindNode(rootIds[0], new Set())
  } else {
    const visited = new Set()
    root = {
      data: { text: title },
      children: rootIds.map(id => buildMindNode(id, visited)).filter(Boolean)
    }
  }
  if (!root) {
    root = { data: { text: title }, children: [] }
  }

  nodes
    .map(node => String(node.id))
    .filter(id => !consumed.has(id))
    .forEach(id => {
      const orphan = buildMindNode(id, new Set(consumed))
      if (orphan) {
        if (!Array.isArray(root.children)) root.children = []
        root.children.push(orphan)
      }
    })

  return {
    root,
    theme: {
      template: 'classic4',
      config: {}
    },
    layout: 'logicalStructure'
  }
}

export const normalizeFlowchartAiResult = result => {
  const parsed =
    typeof result === 'string'
      ? extractJsonObject(result)
      : result && typeof result === 'object'
        ? result
        : null
  if (!parsed || typeof parsed !== 'object') {
    throw createI18nError('AI 返回的流程图数据无效', 'errors.invalidFlowchartData')
  }
  const payload =
    parsed.flowchartData && typeof parsed.flowchartData === 'object'
      ? {
          ...parsed.flowchartData,
          flowchartConfig: parsed.flowchartConfig || null
        }
      : parsed
  const flowchartData = normalizeFlowchartData({
    title: payload.title || DEFAULT_FLOWCHART_TITLE,
    templateId: payload.templateId || 'blank',
    viewport: payload.viewport,
    lanes: payload.lanes,
    nodes: payload.nodes,
    edges: payload.edges
  })
  return {
    title: flowchartData.title,
    flowchartData,
    flowchartConfig: normalizeFlowchartConfig(
      payload.flowchartConfig,
      flowchartData.templateId
    )
  }
}

