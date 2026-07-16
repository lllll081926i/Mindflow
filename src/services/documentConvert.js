/**
 * Multi-document conversion helpers between mindmap and flowchart workbooks.
 */
import {
  convertMindMapToFlowchart,
  convertFlowchartToMindMap
} from '@/services/flowchartDocument'
import {
  ensureMindmapWorkbook,
  createWorkbookFromMindmapList
} from '@/services/mindmapWorkbook'
import {
  ensureFlowchartWorkbook,
  createFlowchartPage
} from '@/services/flowchartWorkbook'

const clone = value => {
  try {
    return JSON.parse(JSON.stringify(value))
  } catch (_error) {
    return value
  }
}

/**
 * Convert a mindmap workbook (or single map) into a flowchart workbook.
 * Each mindmap sheet becomes one flowchart page.
 */
export const convertMindmapWorkbookToFlowchartWorkbook = (
  mindMapData,
  options = {}
) => {
  const workbook = ensureMindmapWorkbook(mindMapData, {
    title: options.title
  })
  const pages = workbook.sheets.map((sheet, index) => {
    const sheetMind = {
      root: sheet.root,
      theme: sheet.theme,
      layout: sheet.layout
    }
    const converted = convertMindMapToFlowchart(sheetMind, {
      title: sheet.name || options.title || `流程 ${index + 1}`
    })
    const flow = converted?.flowchartData || converted || {}
    return createFlowchartPage({
      id: sheet.id || undefined,
      name: sheet.name || `页面 ${index + 1}`,
      title: flow.title || sheet.name || options.title || '流程图',
      templateId: flow.templateId || 'blank',
      viewport: flow.viewport,
      lanes: flow.lanes || [],
      nodes: flow.nodes || [],
      edges: flow.edges || []
    })
  })
  const active =
    pages.find(page => page.id === workbook.activeSheetId) || pages[0]
  return ensureFlowchartWorkbook({
    title: options.title || active?.title || workbook.root?.data?.text || '流程图',
    templateId: active?.templateId || 'blank',
    viewport: active?.viewport,
    lanes: active?.lanes || [],
    nodes: active?.nodes || [],
    edges: active?.edges || [],
    sheets: pages,
    activeSheetId: active?.id
  })
}

/**
 * Convert a flowchart workbook (or single flow) into a mindmap workbook.
 * Each flowchart page becomes one mindmap sheet.
 */
export const convertFlowchartWorkbookToMindmapWorkbook = (
  flowchartData,
  options = {}
) => {
  const workbook = ensureFlowchartWorkbook(flowchartData, {
    title: options.title
  })
  const maps = workbook.sheets.map((sheet, index) => {
    const pageData = {
      title: sheet.title || sheet.name,
      templateId: sheet.templateId,
      viewport: sheet.viewport,
      lanes: sheet.lanes,
      nodes: sheet.nodes,
      edges: sheet.edges
    }
    const mind = convertFlowchartToMindMap(pageData, {
      title: sheet.name || options.title || `画布 ${index + 1}`
    })
    return {
      name: sheet.name || mind?.root?.data?.text || `画布 ${index + 1}`,
      root: mind?.root || mind,
      theme: mind?.theme,
      layout: mind?.layout
    }
  })
  const result = createWorkbookFromMindmapList(maps, {
    title: options.title || workbook.title
  })
  // preserve active page mapping when possible
  const activeIndex = Math.max(
    0,
    workbook.sheets.findIndex(sheet => sheet.id === workbook.activeSheetId)
  )
  const activeSheet = result.sheets[activeIndex] || result.sheets[0]
  if (activeSheet) {
    result.activeSheetId = activeSheet.id
    result.root = clone(activeSheet.root)
    result.theme = clone(activeSheet.theme)
    result.layout = activeSheet.layout
  }
  return result
}
