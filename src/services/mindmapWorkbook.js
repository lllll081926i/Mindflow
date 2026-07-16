/**
 * Lightweight multi-canvas workbook helpers for mind maps.
 * Backward compatible: legacy single-root documents still work.
 */

const createId = () =>
  `sheet_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`

const clone = value => {
  try {
    return JSON.parse(JSON.stringify(value))
  } catch (_error) {
    return value
  }
}

const defaultTheme = () => ({
  template: 'classic4',
  config: {}
})

const createEmptyRoot = (title = '思维导图') => ({
  data: { text: String(title || '思维导图') },
  children: []
})

export const createMindmapSheet = ({
  id = createId(),
  name = '画布 1',
  root = null,
  theme = null,
  layout = 'logicalStructure',
  view = null
} = {}) => ({
  id: String(id || createId()),
  name: String(name || '画布').trim() || '画布',
  root: root && typeof root === 'object' ? clone(root) : createEmptyRoot(name),
  theme:
    theme && typeof theme === 'object'
      ? clone(theme)
      : defaultTheme(),
  layout: String(layout || 'logicalStructure'),
  view: view && typeof view === 'object' ? clone(view) : null
})

export const isMindmapWorkbook = data => {
  return !!(
    data &&
    typeof data === 'object' &&
    Array.isArray(data.sheets) &&
    data.sheets.length > 0
  )
}

/**
 * Ensure document is workbook-shaped while preserving active root/theme/layout.
 */
export const ensureMindmapWorkbook = (data = {}, options = {}) => {
  if (isMindmapWorkbook(data)) {
    const sheets = data.sheets
      .filter(sheet => sheet && typeof sheet === 'object')
      .map((sheet, index) =>
        createMindmapSheet({
          id: sheet.id || createId(),
          name: sheet.name || `画布 ${index + 1}`,
          root: sheet.root || data.root || createEmptyRoot(),
          theme: sheet.theme || data.theme || defaultTheme(),
          layout: sheet.layout || data.layout || 'logicalStructure',
          view: sheet.view || null
        })
      )
    const activeSheetId =
      sheets.find(sheet => sheet.id === data.activeSheetId)?.id || sheets[0].id
    const active = sheets.find(sheet => sheet.id === activeSheetId) || sheets[0]
    return {
      ...data,
      sheets,
      activeSheetId: active.id,
      root: active.root,
      theme: active.theme || data.theme || defaultTheme(),
      layout: active.layout || data.layout || 'logicalStructure',
      view: active.view || data.view || null
    }
  }

  const root =
    data?.root && typeof data.root === 'object'
      ? clone(data.root)
      : createEmptyRoot(options.title || '思维导图')
  const first = createMindmapSheet({
    name: options.firstSheetName || '画布 1',
    root,
    theme: data?.theme || defaultTheme(),
    layout: data?.layout || 'logicalStructure',
    view: data?.view || null
  })
  return {
    ...data,
    root: first.root,
    theme: first.theme,
    layout: first.layout,
    view: first.view,
    sheets: [first],
    activeSheetId: first.id
  }
}

export const listMindmapSheets = data => {
  const workbook = ensureMindmapWorkbook(data)
  return workbook.sheets.map(sheet => ({
    id: sheet.id,
    name: sheet.name,
    active: sheet.id === workbook.activeSheetId
  }))
}

export const getActiveMindmapSheet = data => {
  const workbook = ensureMindmapWorkbook(data)
  return (
    workbook.sheets.find(sheet => sheet.id === workbook.activeSheetId) ||
    workbook.sheets[0] ||
    null
  )
}

export const snapshotActiveMindmapSheet = (data, liveFullData = null) => {
  const workbook = ensureMindmapWorkbook(data)
  const live = liveFullData && typeof liveFullData === 'object' ? liveFullData : null
  const sheets = workbook.sheets.map(sheet => {
    if (sheet.id !== workbook.activeSheetId) return sheet
    return createMindmapSheet({
      id: sheet.id,
      name: sheet.name,
      root: live?.root || sheet.root,
      theme: live?.theme || sheet.theme,
      layout: live?.layout || sheet.layout,
      view: live?.view || sheet.view
    })
  })
  const active =
    sheets.find(sheet => sheet.id === workbook.activeSheetId) || sheets[0]
  return {
    ...workbook,
    sheets,
    root: active.root,
    theme: active.theme,
    layout: active.layout,
    view: active.view
  }
}

export const switchMindmapSheet = (data, sheetId, liveFullData = null) => {
  const snapshot = snapshotActiveMindmapSheet(data, liveFullData)
  const target =
    snapshot.sheets.find(sheet => sheet.id === sheetId) || snapshot.sheets[0]
  if (!target) return snapshot
  return {
    ...snapshot,
    activeSheetId: target.id,
    root: clone(target.root),
    theme: clone(target.theme),
    layout: target.layout,
    view: target.view ? clone(target.view) : null
  }
}

export const addMindmapSheet = (data, options = {}, liveFullData = null) => {
  const snapshot = snapshotActiveMindmapSheet(data, liveFullData)
  const index = snapshot.sheets.length + 1
  const sheet = createMindmapSheet({
    name: options.name || `画布 ${index}`,
    root: options.copyActive
      ? clone(getActiveMindmapSheet(snapshot)?.root || createEmptyRoot())
      : createEmptyRoot(options.name || `画布 ${index}`),
    theme: getActiveMindmapSheet(snapshot)?.theme || defaultTheme(),
    layout: getActiveMindmapSheet(snapshot)?.layout || 'logicalStructure'
  })
  const sheets = [...snapshot.sheets, sheet]
  return {
    ...snapshot,
    sheets,
    activeSheetId: sheet.id,
    root: sheet.root,
    theme: sheet.theme,
    layout: sheet.layout,
    view: null
  }
}

export const renameMindmapSheet = (data, sheetId, name, liveFullData = null) => {
  const snapshot = snapshotActiveMindmapSheet(data, liveFullData)
  const nextName = String(name || '').trim() || '画布'
  const sheets = snapshot.sheets.map(sheet =>
    sheet.id === sheetId ? { ...sheet, name: nextName } : sheet
  )
  return {
    ...snapshot,
    sheets
  }
}

export const deleteMindmapSheet = (data, sheetId, liveFullData = null) => {
  const snapshot = snapshotActiveMindmapSheet(data, liveFullData)
  if (snapshot.sheets.length <= 1) {
    return snapshot
  }
  const sheets = snapshot.sheets.filter(sheet => sheet.id !== sheetId)
  const activeStillThere = sheets.some(sheet => sheet.id === snapshot.activeSheetId)
  const active = activeStillThere
    ? sheets.find(sheet => sheet.id === snapshot.activeSheetId)
    : sheets[Math.max(0, snapshot.sheets.findIndex(sheet => sheet.id === sheetId) - 1)] ||
      sheets[0]
  return {
    ...snapshot,
    sheets,
    activeSheetId: active.id,
    root: clone(active.root),
    theme: clone(active.theme),
    layout: active.layout,
    view: active.view ? clone(active.view) : null
  }
}

/**
 * Build workbook from multiple independent mindmap roots (e.g. multi-canvas XMind).
 */
export const createWorkbookFromMindmapList = (list = [], options = {}) => {
  const items = (Array.isArray(list) ? list : []).filter(Boolean)
  if (!items.length) {
    return ensureMindmapWorkbook({}, options)
  }
  const sheets = items.map((item, index) => {
    if (item?.root) {
      return createMindmapSheet({
        name: item.name || item.title || `画布 ${index + 1}`,
        root: item.root,
        theme: item.theme || defaultTheme(),
        layout: item.layout || 'logicalStructure',
        view: item.view || null
      })
    }
    // item itself may be a root node
    return createMindmapSheet({
      name: item?.data?.text || `画布 ${index + 1}`,
      root: item?.data ? item : createEmptyRoot(`画布 ${index + 1}`)
    })
  })
  const active = sheets[0]
  return {
    sheets,
    activeSheetId: active.id,
    root: active.root,
    theme: active.theme,
    layout: active.layout,
    view: active.view
  }
}
