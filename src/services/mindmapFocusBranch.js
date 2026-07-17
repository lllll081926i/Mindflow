/**
 * Collapse sibling branches so only the path to the focus node stays open.
 */

export const collapseSiblingBranches = (mindMap, focusNode) => {
  if (!mindMap?.renderer || !focusNode) return 0

  const keep = new Set()
  let current = focusNode
  const guard = new Set()
  while (current && !guard.has(current)) {
    guard.add(current)
    keep.add(current)
    // keep ancestors expanded
    if (typeof current.getData === 'function' && current.getData('expand') === false) {
      if (current.nodeData?.data) current.nodeData.data.expand = true
    }
    current = current.parent || null
  }

  // keep focus subtree expanded state as-is, but mark all descendants as "keep"
  const markDesc = node => {
    if (!node) return
    keep.add(node)
    ;(node.children || []).forEach(markDesc)
  }
  markDesc(focusNode)

  let collapsed = 0
  const walk = node => {
    if (!node) return
    ;(node.children || []).forEach(child => {
      if (!keep.has(child)) {
        if (child.children && child.children.length > 0) {
          const expanded = child.getData?.('expand')
          if (expanded !== false) {
            if (child.nodeData?.data) {
              child.nodeData.data.expand = false
            } else if (typeof child.setData === 'function') {
              child.setData({ expand: false })
            }
            collapsed += 1
          }
        }
      } else {
        walk(child)
      }
    })
  }

  walk(mindMap.renderer.root)

  if (typeof mindMap.render === 'function') {
    mindMap.render()
  } else if (typeof mindMap.reRender === 'function') {
    mindMap.reRender()
  }

  return collapsed
}
