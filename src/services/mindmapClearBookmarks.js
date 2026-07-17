import { isBookmarkIcon } from './nodeBookmarks.js'

export const clearAllMindMapBookmarks = mindMap => {
  if (!mindMap?.renderer?.root) return 0
  let cleared = 0
  const walk = node => {
    if (!node) return
    const icons = typeof node.getData === 'function' ? node.getData('icon') || [] : []
    if (Array.isArray(icons) && icons.some(isBookmarkIcon)) {
      const next = icons.filter(icon => !isBookmarkIcon(icon))
      if (mindMap.renderer.setNodeIcon) {
        mindMap.renderer.setNodeIcon(node, next)
      } else if (typeof node.setData === 'function') {
        node.setData({ icon: next })
      }
      cleared += 1
    }
    ;(node.children || []).forEach(walk)
  }
  walk(mindMap.renderer.root)
  return cleared
}
