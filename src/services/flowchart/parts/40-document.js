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

