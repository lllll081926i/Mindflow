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

const countMindmapNodes = root => {
  let count = 0
  const walk = node => {
    if (!node) return
    count += 1
    ;(node.children || []).forEach(walk)
  }
  walk(root)
  return count
}

export const listMindmapSheets = data => {
  const workbook = ensureMindmapWorkbook(data)
  return workbook.sheets.map(sheet => ({
    id: sheet.id,
    name: sheet.name,
    active: sheet.id === workbook.activeSheetId,
    nodeCount: countMindmapNodes(sheet.root)
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
  const customRoot =
    options.root && typeof options.root === 'object' ? clone(options.root) : null
  const sheet = createMindmapSheet({
    name: options.name || `画布 ${index}`,
    root: customRoot
      ? customRoot
      : options.copyActive
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

export const moveMindmapSheet = (data, sheetId, toIndex, liveFullData = null) => {
  const snapshot = snapshotActiveMindmapSheet(data, liveFullData)
  const from = snapshot.sheets.findIndex(sheet => sheet.id === sheetId)
  if (from < 0) return snapshot
  const target = Math.max(0, Math.min(snapshot.sheets.length - 1, Number(toIndex) || 0))
  if (from === target) return snapshot
  const sheets = [...snapshot.sheets]
  const [item] = sheets.splice(from, 1)
  sheets.splice(target, 0, item)
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


/**
 * Export workbook to XMind blob using simple-mind-map transform for each sheet.
 * Falls back to active sheet only if multi transform fails.
 */

const stripHtmlText = value =>
  String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const NEWLINE = String.fromCharCode(10)

/**
 * Best-effort XMind fidelity enricher:
 * - fold local comments into notes
 * - surface outer-frame / attachment / marker metadata into portable notes/labels
 * - keep tags as labels (library already maps)
 */
const enrichNodeForXmindExport = root => {
  const clone = (() => {
    try {
      return JSON.parse(JSON.stringify(root || {}))
    } catch (_error) {
      return root || {}
    }
  })()
  const walk = node => {
    if (!node || typeof node !== 'object') return
    if (!node.data || typeof node.data !== 'object') node.data = {}
    const data = node.data
    const noteParts = []
    const existingNote = stripHtmlText(data.note)
    if (existingNote) noteParts.push(existingNote)

    const comments = Array.isArray(data.comments) ? data.comments : []
    if (comments.length) {
      const commentLines = comments.map((item, index) => {
        const text = stripHtmlText(item?.text || item)
        const status = item?.resolved ? '[已解决]' : '[未解决]'
        const replies = Array.isArray(item?.replies)
          ? item.replies
              .map(reply => '  - ' + stripHtmlText(reply?.text || reply))
              .filter(Boolean)
              .join(NEWLINE)
          : ''
        return (
          status +
          ' 批注' +
          (index + 1) +
          ': ' +
          text +
          (replies ? NEWLINE + replies : '')
        )
      })
      noteParts.push(commentLines.join(NEWLINE))
    }

    // outer frame / boundary-like metadata
    const outerFrame = data.outerFrame || data.frame || null
    if (outerFrame) {
      if (typeof outerFrame === 'object' && outerFrame) {
        const frameMetaParts = []
        const frameText = stripHtmlText(
          outerFrame.text || outerFrame.title || outerFrame.name || '外框'
        )
        if (frameText) frameMetaParts.push(frameText)
        if (outerFrame.radius != null) frameMetaParts.push('圆角:' + outerFrame.radius)
        if (outerFrame.fill || outerFrame.backgroundColor || outerFrame.stroke) {
          frameMetaParts.push(
            '样式:' +
              stripHtmlText(
                outerFrame.fill ||
                  outerFrame.backgroundColor ||
                  outerFrame.stroke
              )
          )
        }
        if (outerFrame.groupId) frameMetaParts.push('组:' + outerFrame.groupId)
        if (frameMetaParts.length) {
          noteParts.push('[外框] ' + frameMetaParts.join(' | '))
        }
      } else {
        const frameText = stripHtmlText(outerFrame)
        if (frameText) noteParts.push('[外框] ' + frameText)
      }
    }

    // attachment names (url already not always portable)
    if (data.attachmentName || data.attachmentUrl) {
      noteParts.push(
        '[附件] ' +
          stripHtmlText(data.attachmentName || data.attachmentUrl)
      )
    }

    // formula / annotation text when present as plain fields
    if (data.formula) {
      noteParts.push('[公式] ' + stripHtmlText(data.formula))
    }
    if (data.annotation) {
      noteParts.push('[标注] ' + stripHtmlText(data.annotation))
    }

    const styleBits = []
    if (data.color) styleBits.push('字色:' + stripHtmlText(data.color))
    if (data.fillColor || data.backgroundColor) {
      styleBits.push(
        '底色:' + stripHtmlText(data.fillColor || data.backgroundColor)
      )
    }
    if (data.borderColor) styleBits.push('边框:' + stripHtmlText(data.borderColor))
    if (data.fontSize) styleBits.push('字号:' + stripHtmlText(data.fontSize))
    if (data.fontWeight) styleBits.push('粗细:' + stripHtmlText(data.fontWeight))
    if (styleBits.length) {
      noteParts.push('[样式] ' + styleBits.join(' | '))
    }

    if (noteParts.length) {
      data.note = noteParts.join(NEWLINE + NEWLINE)
    }

    // icons -> labels for portability
    const icons = Array.isArray(data.icon) ? data.icon : []
    const tags = Array.isArray(data.tag)
      ? data.tag.map(item =>
          typeof item === 'object' && item !== null ? item.text : item
        )
      : []
    const iconLabels = icons
      .map(key => {
        const raw = String(key || '')
        if (raw.startsWith('priority_')) return 'P' + raw.slice('priority_'.length)
        if (raw.startsWith('progress_')) return 'G' + raw.slice('progress_'.length)
        if (raw.startsWith('expression_')) return 'E' + raw.slice('expression_'.length)
        if (raw.startsWith('sign_')) return 'S' + raw.slice('sign_'.length)
        return raw
      })
      .filter(Boolean)
    const mergedLabels = [...new Set([...tags, ...iconLabels].filter(Boolean))]
    if (mergedLabels.length) {
      data.tag = mergedLabels
    }

    // ensure hyperlink retained (library maps data.hyperlink)
    if (!data.hyperlink && data.link) {
      data.hyperlink = data.link
    }

    if (Array.isArray(node.children)) node.children.forEach(walk)
  }
  walk(clone)
  return clone
}

export const exportMindmapWorkbookToXmind = async (data, fileName = '思维导图') => {
  const workbook = ensureMindmapWorkbook(data)
  const xmindMod = await import('simple-mind-map/src/parse/xmind.js')
  const xmind = xmindMod.default || xmindMod
  if (typeof xmind.transformToXmind !== 'function') {
    throw new Error('XMind export unavailable')
  }
  if (workbook.sheets.length <= 1) {
    return xmind.transformToXmind(
      enrichNodeForXmindExport(workbook.root),
      workbook.sheets[0]?.name || fileName
    )
  }

  const JSZip = (await import('jszip')).default || (await import('jszip'))
  const out = new JSZip()
  const sheetTrees = []
  const resourceMap = new Map() // path -> base64
  const usedNames = new Set()
  const manifestEntries = {
    'content.json': {},
    'metadata.json': {},
    'content.xml': {}
  }

  const uniqueName = (name, sheetIndex) => {
    const base = String(name || 'image.png').replace(/[\/]/g, '_')
    if (!usedNames.has(base) && !resourceMap.has('resources/' + base)) {
      usedNames.add(base)
      return base
    }
    const dot = base.lastIndexOf('.')
    const stem = dot > 0 ? base.slice(0, dot) : base
    const ext = dot > 0 ? base.slice(dot) : ''
    let i = 1
    let next = stem + '_' + sheetIndex + '_' + i + ext
    while (usedNames.has(next) || resourceMap.has('resources/' + next)) {
      i += 1
      next = stem + '_' + sheetIndex + '_' + i + ext
    }
    usedNames.add(next)
    return next
  }

  const rewriteResourceRefs = (value, renameMap) => {
    if (!value || typeof value !== 'object') return
    if (Array.isArray(value)) {
      value.forEach(item => rewriteResourceRefs(item, renameMap))
      return
    }
    Object.keys(value).forEach(key => {
      const current = value[key]
      if (typeof current === 'string') {
        Object.keys(renameMap).forEach(from => {
          if (current.includes(from)) {
            value[key] = current.split(from).join(renameMap[from])
          }
        })
      } else if (current && typeof current === 'object') {
        rewriteResourceRefs(current, renameMap)
      }
    })
  }

  for (let sheetIndex = 0; sheetIndex < workbook.sheets.length; sheetIndex += 1) {
    const sheet = workbook.sheets[sheetIndex]
    const blob = await xmind.transformToXmind(
      enrichNodeForXmindExport(sheet.root),
      sheet.name || fileName + '-' + (sheetIndex + 1)
    )
    const zip = await JSZip.loadAsync(blob)
    const contentJson = await zip.file('content.json').async('string')
    const arr = JSON.parse(contentJson)
    const tree = Array.isArray(arr) ? arr[0] : arr
    if (!tree) continue

    // force stable unique sheet id
    const sheetId =
      String(sheet.id || '').replace(/[^a-zA-Z0-9_-]/g, '_') ||
      'sheet_' + (sheetIndex + 1)
    tree.id = sheetId
    tree.title = sheet.name || tree.title || 'Sheet ' + (sheetIndex + 1)
    tree.class = tree.class || 'sheet'

    const renameMap = {}
    const resourceFiles = Object.keys(zip.files).filter(name =>
      name.startsWith('resources/') && !zip.files[name].dir
    )
    for (const resourcePath of resourceFiles) {
      const rawName = resourcePath.slice('resources/'.length)
      const base64 = await zip.file(resourcePath).async('base64')
      // de-dupe identical content
      let existingPath = ''
      for (const [pathKey, content] of resourceMap.entries()) {
        if (content === base64) {
          existingPath = pathKey
          break
        }
      }
      if (existingPath) {
        if (existingPath !== resourcePath) {
          renameMap['xap:resources/' + rawName] =
            'xap:' + existingPath
          renameMap['resources/' + rawName] = existingPath
        }
        continue
      }
      const nextName = uniqueName(rawName, sheetIndex)
      const nextPath = 'resources/' + nextName
      resourceMap.set(nextPath, base64)
      if (nextName !== rawName) {
        renameMap['xap:resources/' + rawName] = 'xap:resources/' + nextName
        renameMap['resources/' + rawName] = 'resources/' + nextName
      }
    }
    if (Object.keys(renameMap).length) {
      rewriteResourceRefs(tree, renameMap)
    }
    sheetTrees.push(tree)
  }

  const activeId =
    sheetTrees.find(item => item.id === workbook.activeSheetId)?.id ||
    sheetTrees[0]?.id ||
    ''

  out.file('content.json', JSON.stringify(sheetTrees))
  out.file(
    'metadata.json',
    JSON.stringify({
      modifier: '',
      dataStructureVersion: '2',
      creator: { name: 'mind-map' },
      layoutEngineVersion: '3',
      activeSheetId: activeId
    })
  )
  if (typeof xmind.getXmindContentXmlData === 'function') {
    out.file('content.xml', xmind.getXmindContentXmlData())
  } else {
    // fallback minimal xml marker used by library
    try {
      const { getXmindContentXmlData } = await import(
        'simple-mind-map/src/utils/xmind.js'
      )
      out.file('content.xml', getXmindContentXmlData())
    } catch (_error) {
      out.file(
        'content.xml',
        '<?xml version="1.0" encoding="UTF-8" standalone="no"?><xmap-content xmlns="urn:xmind:xmap:xmlns:content:2.0" xmlns:fo="http://www.w3.org/1999/XSL/Format" xmlns:svg="http://www.w3.org/2000/svg" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:xlink="http://www.w3.org/1999/xlink" version="2.0"></xmap-content>'
      )
    }
  }

  resourceMap.forEach((base64, resourcePath) => {
    manifestEntries[resourcePath] = {}
    out.file(resourcePath, base64, { base64: true })
  })
  out.file(
    'manifest.json',
    JSON.stringify({
      'file-entries': manifestEntries
    })
  )
  return out.generateAsync({ type: 'blob' })
}

export const exportMindmapWorkbookToFreemind = async (data, fileName = '思维导图') => {
  const { serializeFreemindXml } = await import('@/services/freemindParse')
  const workbook = ensureMindmapWorkbook(data)
  if (workbook.sheets.length <= 1) {
    const sheet = workbook.sheets[0]
    return {
      kind: 'text',
      extension: 'mm',
      content: serializeFreemindXml(
        { root: sheet.root, theme: sheet.theme, layout: sheet.layout },
        { title: sheet.name || fileName }
      )
    }
  }
  const JSZip = (await import('jszip')).default || (await import('jszip'))
  const zip = new JSZip()
  workbook.sheets.forEach((sheet, index) => {
    const safe =
      String(sheet.name || 'sheet-' + (index + 1))
        .replace(/[\/:*?"<>|]/g, '_')
        .trim() || 'sheet-' + (index + 1)
    const xml = serializeFreemindXml(
      { root: sheet.root, theme: sheet.theme, layout: sheet.layout },
      { title: sheet.name || fileName }
    )
    zip.file(safe + '.mm', xml)
  })
  const blob = await zip.generateAsync({ type: 'blob' })
  return {
    kind: 'zip',
    extension: 'zip',
    content: blob
  }
}
