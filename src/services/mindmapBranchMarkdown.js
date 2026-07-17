/**
 * Serialize a mind-map branch (node + descendants) to Markdown.
 */

const getText = node => {
  if (!node) return ''
  if (typeof node.getData === 'function') {
    let text = node.getData('text') || ''
    if (node.getData('richText') && String(text).includes('<')) {
      text = String(text)
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    }
    return String(text || '').trim() || '未命名主题'
  }
  const data = node.data || {}
  let text = data.text || ''
  if (data.richText && String(text).includes('<')) {
    text = String(text)
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }
  return String(text || '').trim() || '未命名主题'
}

export const branchToMarkdown = (rootNode, { headingMode = true } = {}) => {
  if (!rootNode) return ''
  const lines = []
  const walk = (node, depth) => {
    if (!node) return
    const text = getText(node)
    if (headingMode && depth <= 1) {
      lines.push(`${'#'.repeat(depth + 1)} ${text}`)
    } else {
      const indent = '  '.repeat(Math.max(0, depth - (headingMode ? 2 : 0)))
      lines.push(`${indent}- ${text}`)
    }
    ;(node.children || []).forEach(child => walk(child, depth + 1))
  }
  walk(rootNode, 0)
  return lines.join('\n')
}
