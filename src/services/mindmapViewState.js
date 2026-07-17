/**
 * Mind map view / expand restore helpers (XMind-like session memory).
 */

export const hasMindMapViewState = view => {
  return !!(view && typeof view === 'object' && Object.keys(view).length > 0)
}

/**
 * Apply saved transform if present; otherwise leave current transform alone.
 * Returns true when a saved view was applied.
 */
export const restoreMindMapViewState = (mindMap, view) => {
  if (!mindMap?.view) return false
  if (!hasMindMapViewState(view)) return false
  if (typeof mindMap.view.setTransformData === 'function') {
    mindMap.view.setTransformData(view)
    return true
  }
  return false
}

/**
 * After loading a sheet/document: restore saved view, or fit when no view.
 */
export const applyMindMapViewAfterLoad = (
  mindMap,
  view,
  { fitIfEmpty = true } = {}
) => {
  if (!mindMap?.view) return 'none'
  if (restoreMindMapViewState(mindMap, view)) {
    return 'restored'
  }
  if (fitIfEmpty && typeof mindMap.view.fit === 'function') {
    mindMap.view.fit()
    return 'fitted'
  }
  if (typeof mindMap.view.reset === 'function') {
    mindMap.view.reset()
    return 'reset'
  }
  return 'none'
}

/**
 * Walk tree and collect expand flags for regression/debug.
 */
export const collectExpandState = (root, out = []) => {
  if (!root) return out
  const data = root.data || {}
  out.push({
    uid: data.uid || '',
    text: data.text || '',
    expand: data.expand
  })
  ;(root.children || []).forEach(child => collectExpandState(child, out))
  return out
}

/**
 * Ensure every node has an explicit expand boolean so reload is deterministic.
 * Missing expand defaults to true (library convention).
 */
export const ensureExplicitExpandFlags = root => {
  if (!root || typeof root !== 'object') return root
  if (!root.data || typeof root.data !== 'object') {
    root.data = {}
  }
  if (typeof root.data.expand !== 'boolean') {
    root.data.expand = root.data.expand === false ? false : true
  }
  ;(root.children || []).forEach(child => ensureExplicitExpandFlags(child))
  return root
}

/**
 * Compute a bounding box for selected nodes (SVG rbox style).
 * Returns null when no measurable nodes.
 */
export const getNodesBoundingBox = (nodes = []) => {
  const list = Array.isArray(nodes) ? nodes.filter(Boolean) : []
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  let count = 0
  list.forEach(node => {
    try {
      const box =
        typeof node.getRect === 'function'
          ? node.getRect()
          : node.group?.rbox?.()
      if (!box) return
      const x = Number(box.x)
      const y = Number(box.y)
      const width = Number(box.width)
      const height = Number(box.height)
      if (![x, y, width, height].every(Number.isFinite)) return
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x + width)
      maxY = Math.max(maxY, y + height)
      count += 1
    } catch (_error) {}
  })
  if (!count) return null
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  }
}

/**
 * Fit view to active selection; falls back to whole canvas fit.
 */
export const fitMindMapSelection = (mindMap, { padding = 48 } = {}) => {
  if (!mindMap?.view) return 'none'
  const active = mindMap.renderer?.activeNodeList || []
  if (active.length > 0 && typeof mindMap.view.fit === 'function') {
    const box = getNodesBoundingBox(active)
    if (box && box.width > 0 && box.height > 0) {
      mindMap.view.fit(() => box, true, padding)
      return 'selection'
    }
    // single node fallback
    const node = active[0]
    if (node && mindMap.renderer?.moveNodeToCenter) {
      mindMap.renderer.moveNodeToCenter(node)
      return 'center'
    }
  }
  if (typeof mindMap.view.fit === 'function') {
    mindMap.view.fit()
    return 'canvas'
  }
  return 'none'
}

/**
 * Pan so the selection bounding-box center is in view, without changing zoom.
 */
export const centerMindMapSelection = mindMap => {
  if (!mindMap?.view || !mindMap?.renderer) return 'none'
  const active = mindMap.renderer.activeNodeList || []
  if (!active.length) {
    if (typeof mindMap.renderer.setRootNodeCenter === 'function') {
      mindMap.renderer.setRootNodeCenter()
      return 'root'
    }
    return 'none'
  }
  if (active.length === 1 && mindMap.renderer.moveNodeToCenter) {
    mindMap.renderer.moveNodeToCenter(active[0])
    return 'node'
  }
  const box = getNodesBoundingBox(active)
  if (!box) {
    if (mindMap.renderer.moveNodeToCenter) {
      mindMap.renderer.moveNodeToCenter(active[0])
      return 'node'
    }
    return 'none'
  }
  // Approximate center using first node transform API when available
  if (mindMap.renderer.moveNodeToCenter) {
    mindMap.renderer.moveNodeToCenter(active[0])
    return 'node'
  }
  return 'none'
}
