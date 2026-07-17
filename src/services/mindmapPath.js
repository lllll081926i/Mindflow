/**
 * Build breadcrumb path text from root to a target node.
 */

const getNodeText = node => {
  if (!node) return ''
  if (typeof node.getData === 'function') {
    let text = node.getData('text') || ''
    if (node.getData('richText') && typeof text === 'string' && text.includes('<')) {
      text = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    }
    return String(text || '').trim()
  }
  const data = node.data || {}
  let text = data.text || ''
  if (data.richText && typeof text === 'string' && text.includes('<')) {
    text = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  }
  return String(text || '').trim()
}

export const buildMindMapNodePath = (node, { separator = ' / ' } = {}) => {
  if (!node) return ''
  const parts = []
  let current = node
  const guard = new Set()
  while (current && !guard.has(current)) {
    guard.add(current)
    const text = getNodeText(current)
    if (text) parts.unshift(text)
    current = current.parent || null
  }
  return parts.join(separator)
}
