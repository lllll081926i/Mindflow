/**
 * Extra mind-map search matchers (note / tag / comments) beyond title text.
 */

import { getTextFromHtml } from 'simple-mind-map/src/utils/index'

const toPlain = (data = {}) => {
  let text = data.text || ''
  if (data.richText) {
    try {
      text = getTextFromHtml(text)
    } catch (_error) {}
  }
  return String(text || '').trim()
}

const tagText = data => {
  const tags = data.tag
  if (!Array.isArray(tags)) return ''
  return tags
    .map(item => (typeof item === 'object' ? item.text || item.name : item))
    .filter(Boolean)
    .join(' ')
}

const commentText = data => {
  const comments = data.comments
  if (!Array.isArray(comments)) return ''
  return comments
    .map(item => {
      if (!item) return ''
      if (typeof item === 'string') return item
      const replies = Array.isArray(item.replies)
        ? item.replies.map(r => r?.text || r).join(' ')
        : ''
      return [item.text, item.body, replies].filter(Boolean).join(' ')
    })
    .join(' ')
}

export const collectNodeSearchFields = data => {
  const title = toPlain(data)
  const note = String(data?.note || '').trim()
  const tags = tagText(data || {})
  const comments = commentText(data || {})
  return { title, note, tags, comments }
}

export const matchNodeSearchFields = (data, keyword) => {
  const key = String(keyword || '')
    .trim()
    .toLowerCase()
  if (!key) return []
  const fields = collectNodeSearchFields(data)
  const hits = []
  if (fields.title.toLowerCase().includes(key)) {
    hits.push({ field: 'title', value: fields.title })
  }
  if (fields.note.toLowerCase().includes(key)) {
    hits.push({ field: 'note', value: fields.note })
  }
  if (fields.tags.toLowerCase().includes(key)) {
    hits.push({ field: 'tag', value: fields.tags })
  }
  if (fields.comments.toLowerCase().includes(key)) {
    hits.push({ field: 'comment', value: fields.comments })
  }
  return hits
}

export const walkMindMapSearchMatches = (root, keyword, options = {}) => {
  const results = []
  const key = String(keyword || '').trim()
  if (!key || !root) return results
  const sheetId = options.sheetId || ''
  const sheetName = options.sheetName || ''
  const skipTitle = !!options.skipTitle
  const walk = node => {
    if (!node) return
    const data = node.data || {}
    const hits = matchNodeSearchFields(data, key).filter(hit =>
      skipTitle ? hit.field !== 'title' : true
    )
    if (hits.length) {
      const title = collectNodeSearchFields(data).title || '未命名主题'
      hits.forEach(hit => {
        results.push({
          id: `${data.uid || title}@${sheetId}@${hit.field}`,
          nodeUid: data.uid || '',
          sheetId,
          sheetName,
          name: title,
          field: hit.field,
          fieldValue: hit.value,
          isMetaMatch: hit.field !== 'title'
        })
      })
    }
    ;(node.children || []).forEach(walk)
  }
  walk(root)
  return results
}
