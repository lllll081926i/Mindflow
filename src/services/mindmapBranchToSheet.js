/**
 * Clone a selected mind-map branch into a new workbook sheet.
 */

const clone = value => {
  try {
    return JSON.parse(JSON.stringify(value))
  } catch (_error) {
    return value
  }
}

const getText = nodeOrData => {
  if (!nodeOrData) return '画布'
  if (typeof nodeOrData.getData === 'function') {
    let text = nodeOrData.getData('text') || ''
    if (nodeOrData.getData('richText') && String(text).includes('<')) {
      text = String(text)
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    }
    return String(text || '').trim() || '画布'
  }
  const data = nodeOrData.data || nodeOrData
  let text = data.text || ''
  if (data.richText && String(text).includes('<')) {
    text = String(text)
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }
  return String(text || '').trim() || '画布'
}

const sanitizeTree = node => {
  if (!node || typeof node !== 'object') return node
  if (node.data && typeof node.data === 'object') {
    const { isActive, ...rest } = node.data
    node.data = rest
  }
  if (Array.isArray(node.children)) {
    node.children = node.children.map(child => sanitizeTree(child))
  }
  return node
}

/**
 * Extract plain tree data from a MindMapNode instance.
 */
export const extractBranchTreeData = node => {
  if (!node) return null
  if (node.nodeData) {
    return sanitizeTree(clone(node.nodeData))
  }
  return sanitizeTree(clone(node))
}

export const createSheetFromBranchOptions = (node, options = {}) => {
  const tree = extractBranchTreeData(node)
  if (!tree) return null
  const name =
    String(options.name || '').trim() || getText(node) || '画布'
  return {
    name,
    root: tree,
    copyActive: false,
    fromBranch: true
  }
}
