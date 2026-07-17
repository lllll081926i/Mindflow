/**
 * Sort child nodes of a parent alphabetically by plain text.
 */

const plainText = node => {
  if (!node) return ''
  if (typeof node.getData === 'function') {
    let text = node.getData('text') || ''
    if (node.getData('richText') && String(text).includes('<')) {
      text = String(text)
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    }
    return String(text || '').trim()
  }
  return String(node.data?.text || '').trim()
}

export const sortChildrenAlphabetically = (mindMap, parentNode) => {
  if (!mindMap || !parentNode) return false
  const children = parentNode.children || []
  if (children.length <= 1) return false

  const dataChildren = parentNode.nodeData?.children
  if (!Array.isArray(dataChildren) || dataChildren.length <= 1) {
    return false
  }

  const indexed = dataChildren.map((child, index) => ({
    child,
    index,
    text: plainText(children[index] || { data: child.data })
  }))
  indexed.sort((a, b) =>
    a.text.localeCompare(b.text, undefined, {
      sensitivity: 'base',
      numeric: true
    })
  )

  const changed = indexed.some((item, i) => item.index !== i)
  if (!changed) return false

  parentNode.nodeData.children = indexed.map(item => item.child)

  if (typeof mindMap.render === 'function') {
    mindMap.render()
  }
  // Ensure persistence/history observe the reorder
  try {
    const data =
      typeof mindMap.getData === 'function' ? mindMap.getData() : null
    if (data) {
      mindMap.emit?.('data_change', data)
    }
  } catch (_error) {}
  if (mindMap.command?.addHistory) {
    mindMap.command.addHistory()
  }
  return true
}
