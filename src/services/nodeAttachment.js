/**
 * Node attachment helpers (XMind-like local file references).
 */

export const getAttachmentFromNode = node => {
  if (!node || typeof node.getData !== 'function') {
    return {
      url: '',
      name: ''
    }
  }
  return {
    url: String(node.getData('attachmentUrl') || '').trim(),
    name: String(node.getData('attachmentName') || '').trim()
  }
}

export const applyAttachmentToNodes = (nodes = [], { url = '', name = '' } = {}) => {
  const list = Array.isArray(nodes) ? nodes.filter(Boolean) : []
  const nextUrl = String(url || '').trim()
  const nextName = String(name || '').trim()
  list.forEach(node => {
    if (node?.mindMap?.renderer?.setNodeAttachment) {
      node.mindMap.renderer.setNodeAttachment(node, nextUrl, nextName)
      return
    }
    if (typeof node?.setData === 'function') {
      node.setData({
        attachmentUrl: nextUrl,
        attachmentName: nextName
      })
    }
  })
  return list.length
}

export const clearAttachmentFromNodes = (nodes = []) => {
  return applyAttachmentToNodes(nodes, {
    url: '',
    name: ''
  })
}
