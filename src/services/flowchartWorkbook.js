/**
 * Lightweight multi-page helpers for flowchart documents.
 * Active page fields (nodes/edges/viewport/lanes/title) stay mirrored for
 * existing editor code paths.
 */

const createId = () =>
  `flow_sheet_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`

const clone = value => {
  try {
    return JSON.parse(JSON.stringify(value))
  } catch (_error) {
    return value
  }
}

const emptyPage = (title = '流程图') => ({
  id: createId(),
  name: '页面 1',
  title: String(title || '流程图'),
  templateId: 'blank',
  viewport: { x: 0, y: 0, zoom: 1 },
  lanes: [],
  nodes: [],
  edges: []
})

export const createFlowchartPage = ({
  id = createId(),
  name = '页面 1',
  title = '流程图',
  templateId = 'blank',
  viewport = null,
  lanes = [],
  nodes = [],
  edges = []
} = {}) => ({
  id: String(id || createId()),
  name: String(name || '页面').trim() || '页面',
  title: String(title || name || '流程图'),
  templateId: String(templateId || 'blank'),
  viewport:
    viewport && typeof viewport === 'object'
      ? clone(viewport)
      : { x: 0, y: 0, zoom: 1 },
  lanes: Array.isArray(lanes) ? clone(lanes) : [],
  nodes: Array.isArray(nodes) ? clone(nodes) : [],
  edges: Array.isArray(edges) ? clone(edges) : []
})

export const isFlowchartWorkbook = data =>
  !!(data && typeof data === 'object' && Array.isArray(data.sheets) && data.sheets.length)

export const ensureFlowchartWorkbook = (data = {}, options = {}) => {
  if (isFlowchartWorkbook(data)) {
    const sheets = data.sheets
      .filter(sheet => sheet && typeof sheet === 'object')
      .map((sheet, index) =>
        createFlowchartPage({
          id: sheet.id || createId(),
          name: sheet.name || `页面 ${index + 1}`,
          title: sheet.title || data.title || options.title || '流程图',
          templateId: sheet.templateId || data.templateId || 'blank',
          viewport: sheet.viewport || data.viewport,
          lanes: sheet.lanes || data.lanes || [],
          nodes: sheet.nodes || data.nodes || [],
          edges: sheet.edges || data.edges || []
        })
      )
    const activeSheetId =
      sheets.find(sheet => sheet.id === data.activeSheetId)?.id || sheets[0].id
    const active = sheets.find(sheet => sheet.id === activeSheetId) || sheets[0]
    return {
      ...data,
      sheets,
      activeSheetId: active.id,
      title: active.title || data.title || '流程图',
      templateId: active.templateId || data.templateId || 'blank',
      viewport: active.viewport,
      lanes: active.lanes,
      nodes: active.nodes,
      edges: active.edges
    }
  }

  const first = createFlowchartPage({
    name: options.firstPageName || '页面 1',
    title: data?.title || options.title || '流程图',
    templateId: data?.templateId || 'blank',
    viewport: data?.viewport,
    lanes: data?.lanes || [],
    nodes: data?.nodes || [],
    edges: data?.edges || []
  })
  return {
    ...data,
    title: first.title,
    templateId: first.templateId,
    viewport: first.viewport,
    lanes: first.lanes,
    nodes: first.nodes,
    edges: first.edges,
    sheets: [first],
    activeSheetId: first.id
  }
}

export const listFlowchartSheets = data => {
  const workbook = ensureFlowchartWorkbook(data)
  return workbook.sheets.map(sheet => ({
    id: sheet.id,
    name: sheet.name,
    active: sheet.id === workbook.activeSheetId
  }))
}

export const snapshotActiveFlowchartSheet = (data, livePage = null) => {
  const workbook = ensureFlowchartWorkbook(data)
  const live = livePage && typeof livePage === 'object' ? livePage : null
  const sheets = workbook.sheets.map(sheet => {
    if (sheet.id !== workbook.activeSheetId) return sheet
    return createFlowchartPage({
      id: sheet.id,
      name: sheet.name,
      title: live?.title || workbook.title || sheet.title,
      templateId: live?.templateId || workbook.templateId || sheet.templateId,
      viewport: live?.viewport || workbook.viewport || sheet.viewport,
      lanes: live?.lanes || workbook.lanes || sheet.lanes,
      nodes: live?.nodes || workbook.nodes || sheet.nodes,
      edges: live?.edges || workbook.edges || sheet.edges
    })
  })
  const active =
    sheets.find(sheet => sheet.id === workbook.activeSheetId) || sheets[0]
  return {
    ...workbook,
    sheets,
    activeSheetId: active.id,
    title: active.title,
    templateId: active.templateId,
    viewport: active.viewport,
    lanes: active.lanes,
    nodes: active.nodes,
    edges: active.edges
  }
}

export const switchFlowchartSheet = (data, sheetId, livePage = null) => {
  const snapshot = snapshotActiveFlowchartSheet(data, livePage)
  const target =
    snapshot.sheets.find(sheet => sheet.id === sheetId) || snapshot.sheets[0]
  if (!target) return snapshot
  return {
    ...snapshot,
    activeSheetId: target.id,
    title: target.title,
    templateId: target.templateId,
    viewport: clone(target.viewport),
    lanes: clone(target.lanes),
    nodes: clone(target.nodes),
    edges: clone(target.edges)
  }
}

export const addFlowchartSheet = (data, options = {}, livePage = null) => {
  const snapshot = snapshotActiveFlowchartSheet(data, livePage)
  const index = snapshot.sheets.length + 1
  const page = createFlowchartPage({
    name: options.name || `页面 ${index}`,
    title: options.title || snapshot.title || `页面 ${index}`,
    templateId: options.copyActive ? snapshot.templateId : 'blank',
    viewport: options.copyActive ? clone(snapshot.viewport) : { x: 0, y: 0, zoom: 1 },
    lanes: options.copyActive ? clone(snapshot.lanes) : [],
    nodes: options.copyActive ? clone(snapshot.nodes) : [],
    edges: options.copyActive ? clone(snapshot.edges) : []
  })
  const sheets = [...snapshot.sheets, page]
  return {
    ...snapshot,
    sheets,
    activeSheetId: page.id,
    title: page.title,
    templateId: page.templateId,
    viewport: page.viewport,
    lanes: page.lanes,
    nodes: page.nodes,
    edges: page.edges
  }
}

export const renameFlowchartSheet = (data, sheetId, name, livePage = null) => {
  const snapshot = snapshotActiveFlowchartSheet(data, livePage)
  const nextName = String(name || '').trim() || '页面'
  const sheets = snapshot.sheets.map(sheet =>
    sheet.id === sheetId ? { ...sheet, name: nextName } : sheet
  )
  return {
    ...snapshot,
    sheets
  }
}

export const deleteFlowchartSheet = (data, sheetId, livePage = null) => {
  const snapshot = snapshotActiveFlowchartSheet(data, livePage)
  if (snapshot.sheets.length <= 1) return snapshot
  const sheets = snapshot.sheets.filter(sheet => sheet.id !== sheetId)
  const activeStillThere = sheets.some(sheet => sheet.id === snapshot.activeSheetId)
  const active = activeStillThere
    ? sheets.find(sheet => sheet.id === snapshot.activeSheetId)
    : sheets[
        Math.max(
          0,
          snapshot.sheets.findIndex(sheet => sheet.id === sheetId) - 1
        )
      ] || sheets[0]
  return {
    ...snapshot,
    sheets,
    activeSheetId: active.id,
    title: active.title,
    templateId: active.templateId,
    viewport: clone(active.viewport),
    lanes: clone(active.lanes),
    nodes: clone(active.nodes),
    edges: clone(active.edges)
  }
}
