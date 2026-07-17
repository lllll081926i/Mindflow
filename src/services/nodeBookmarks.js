/**
 * Node bookmark helpers — XMind-like star bookmarks using star_* icons.
 */

export const BOOKMARK_ICON_PREFIX = 'star_'
export const DEFAULT_BOOKMARK_ICON = 'star_0'

export const isBookmarkIcon = icon =>
  String(icon || '').startsWith(BOOKMARK_ICON_PREFIX)

export const getNodeIconList = node => {
  if (!node) return []
  if (typeof node.getData === 'function') {
    const icons = node.getData('icon')
    return Array.isArray(icons) ? icons.slice() : []
  }
  const icons = node.data?.icon
  return Array.isArray(icons) ? icons.slice() : []
}

export const isNodeBookmarked = node => {
  return getNodeIconList(node).some(isBookmarkIcon)
}

export const toggleBookmarkIcons = (icons = [], preferIcon = DEFAULT_BOOKMARK_ICON) => {
  const list = Array.isArray(icons) ? icons.slice() : []
  const has = list.some(isBookmarkIcon)
  if (has) {
    return list.filter(icon => !isBookmarkIcon(icon))
  }
  // Keep a single star bookmark icon.
  const withoutStars = list.filter(icon => !isBookmarkIcon(icon))
  withoutStars.push(preferIcon || DEFAULT_BOOKMARK_ICON)
  return withoutStars
}

export const applyBookmarkToNode = (node, bookmarked, preferIcon = DEFAULT_BOOKMARK_ICON) => {
  if (!node) return false
  const current = getNodeIconList(node)
  const has = current.some(isBookmarkIcon)
  if (bookmarked === has) return false
  const next = bookmarked
    ? [...current.filter(icon => !isBookmarkIcon(icon)), preferIcon]
    : current.filter(icon => !isBookmarkIcon(icon))
  if (node.mindMap?.renderer?.setNodeIcon) {
    node.mindMap.renderer.setNodeIcon(node, next)
    return true
  }
  if (typeof node.setIcon === 'function') {
    node.setIcon(next)
    return true
  }
  if (typeof node.setData === 'function') {
    node.setData({ icon: next })
    return true
  }
  return false
}

export const toggleNodeBookmark = (node, preferIcon = DEFAULT_BOOKMARK_ICON) => {
  if (!node) return false
  return applyBookmarkToNode(node, !isNodeBookmarked(node), preferIcon)
}

export const toggleNodesBookmark = (nodes = [], preferIcon = DEFAULT_BOOKMARK_ICON) => {
  const list = Array.isArray(nodes) ? nodes.filter(Boolean) : []
  let changed = 0
  list.forEach(node => {
    if (toggleNodeBookmark(node, preferIcon)) changed += 1
  })
  return changed
}

const getText = data => {
  let text = data?.text || ''
  if (data?.richText && typeof text === 'string' && text.includes('<')) {
    text = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  }
  return String(text || '').trim() || '未命名主题'
}

/**
 * Collect bookmarked topics from a mind-map root tree.
 */
export const collectBookmarksFromRoot = (root, sheetMeta = null) => {
  const results = []
  const walk = (node, path = []) => {
    if (!node) return
    const data = node.data || {}
    const icons = Array.isArray(data.icon) ? data.icon : []
    const text = getText(data)
    const nextPath = path.concat(text)
    if (icons.some(isBookmarkIcon)) {
      results.push({
        uid: data.uid || '',
        text,
        path: nextPath.slice(0, -1).join(' / '),
        icons: icons.filter(isBookmarkIcon),
        sheetId: sheetMeta?.id || '',
        sheetName: sheetMeta?.name || ''
      })
    }
    ;(node.children || []).forEach(child => walk(child, nextPath))
  }
  walk(root)
  return results
}

/**
 * Collect bookmarks across a mindmap workbook (all sheets).
 */
export const collectBookmarksFromWorkbook = workbook => {
  if (!workbook || typeof workbook !== 'object') return []
  const sheets = Array.isArray(workbook.sheets) ? workbook.sheets : null
  if (sheets && sheets.length) {
    return sheets.flatMap(sheet =>
      collectBookmarksFromRoot(sheet.root, {
        id: sheet.id,
        name: sheet.name
      })
    )
  }
  return collectBookmarksFromRoot(workbook.root || workbook, null)
}
