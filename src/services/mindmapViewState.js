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
