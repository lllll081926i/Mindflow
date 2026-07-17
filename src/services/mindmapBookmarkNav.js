import { isBookmarkIcon } from './nodeBookmarks.js'

/**
 * Collect bookmarked MindMapNode instances in DFS order.
 */
export const collectBookmarkedNodes = mindMap => {
  const list = []
  const root = mindMap?.renderer?.root
  if (!root) return list
  const walk = node => {
    if (!node) return
    const icons = node.getData?.('icon') || []
    if (Array.isArray(icons) && icons.some(isBookmarkIcon)) {
      list.push(node)
    }
    ;(node.children || []).forEach(walk)
  }
  walk(root)
  return list
}

export const jumpToAdjacentBookmark = (mindMap, currentNode, direction = 1) => {
  const list = collectBookmarkedNodes(mindMap)
  if (!list.length) return null
  let index = list.findIndex(
    node => node === currentNode || node.uid === currentNode?.uid
  )
  if (index < 0) {
    // No current bookmark selection: start from ends
    index = direction > 0 ? -1 : 0
  }
  const nextIndex = (index + direction + list.length) % list.length
  const target = list[nextIndex]
  if (!target) return null
  if (mindMap.renderer.clearActiveNodeList) mindMap.renderer.clearActiveNodeList()
  if (mindMap.renderer.addNodeToActiveList) {
    mindMap.renderer.addNodeToActiveList(target)
    mindMap.renderer.emitNodeActiveEvent?.(target, [target])
  }
  mindMap.renderer.moveNodeToCenter?.(target)
  return target
}
