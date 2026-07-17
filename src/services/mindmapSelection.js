/**
 * Mind-map selection helpers (branch multi-select, etc.)
 */

export const collectBranchNodes = rootNode => {
  const list = []
  const walk = node => {
    if (!node) return
    list.push(node)
    const children = node.children || []
    children.forEach(walk)
  }
  walk(rootNode)
  return list
}

/**
 * Select a node and all of its descendants using renderer APIs.
 */
export const selectMindMapBranch = (mindMap, rootNode) => {
  if (!mindMap?.renderer || !rootNode) return 0
  const renderer = mindMap.renderer
  const nodes = collectBranchNodes(rootNode)
  if (typeof renderer.clearActiveNodeList === 'function') {
    renderer.clearActiveNodeList()
  } else if (typeof mindMap.execCommand === 'function') {
    mindMap.execCommand('CLEAR_ACTIVE_NODE')
  }
  nodes.forEach(node => {
    if (typeof renderer.addNodeToActiveList === 'function') {
      renderer.addNodeToActiveList(node, true)
    } else if (typeof mindMap.execCommand === 'function') {
      mindMap.execCommand('SET_NODE_ACTIVE', node, true)
    }
  })
  if (typeof renderer.emitNodeActiveEvent === 'function') {
    renderer.emitNodeActiveEvent(rootNode, nodes)
  }
  return nodes.length
}
