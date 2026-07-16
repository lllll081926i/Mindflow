/**
 * FreeMind / Freeplane (.mm) → mind-map data adapter.
 * Lightweight XML walk without third-party deps.
 */

const decodeXmlEntities = value =>
  String(value || '')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&amp;/gi, '&')

const stripTags = value =>
  decodeXmlEntities(
    String(value || '')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
  )
    .replace(/\s+/g, ' ')
    .trim()

const getAttr = (attrs, name) => {
  const re = new RegExp(`${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i')
  const match = String(attrs || '').match(re)
  if (!match) return ''
  return decodeXmlEntities(match[1] != null ? match[1] : match[2] || '')
}

/**
 * Tokenize one element starting at openIndex pointing to '<' of tagName.
 * Returns { attrs, selfClosing, inner, end }
 */
const readElement = (xml, openIndex, tagName) => {
  const source = String(xml || '')
  const openMatch = source.slice(openIndex).match(new RegExp(`^<${tagName}\\b([^>]*)>`, 'i'))
  if (!openMatch) {
    return null
  }
  const fullOpen = openMatch[0]
  const attrs = openMatch[1] || ''
  const openEnd = openIndex + fullOpen.length
  if (/\/\s*>$/.test(fullOpen)) {
    return { attrs, selfClosing: true, inner: '', end: openEnd }
  }
  let depth = 1
  let i = openEnd
  const openRe = new RegExp(`<${tagName}\\b`, 'ig')
  const closeRe = new RegExp(`</${tagName}\\s*>`, 'ig')
  while (i < source.length && depth > 0) {
    openRe.lastIndex = i
    closeRe.lastIndex = i
    const nextOpen = openRe.exec(source)
    const nextClose = closeRe.exec(source)
    if (!nextClose) {
      return {
        attrs,
        selfClosing: false,
        inner: source.slice(openEnd),
        end: source.length
      }
    }
    if (nextOpen && nextOpen.index < nextClose.index) {
      // ignore self-closing opens as nested depth still increases then decreases via />
      // FreeMind rarely uses nested same-tag self-closing without close; treat as open
      const openSliceEnd = source.indexOf('>', nextOpen.index)
      const openSlice = openSliceEnd >= 0 ? source.slice(nextOpen.index, openSliceEnd + 1) : ''
      if (/\/\s*>$/.test(openSlice)) {
        // self-closing child: no depth change beyond skip
        i = openSliceEnd + 1
        continue
      }
      depth += 1
      i = nextOpen.index + nextOpen[0].length
    } else {
      depth -= 1
      if (depth === 0) {
        return {
          attrs,
          selfClosing: false,
          inner: source.slice(openEnd, nextClose.index),
          end: nextClose.index + nextClose[0].length
        }
      }
      i = nextClose.index + nextClose[0].length
    }
  }
  return {
    attrs,
    selfClosing: false,
    inner: source.slice(openEnd),
    end: source.length
  }
}

const extractDirectNote = inner => {
  // Only consider richcontent that appears before the first child <node>
  const source = String(inner || '')
  const firstChildNode = source.search(/<node\b/i)
  const head = firstChildNode >= 0 ? source.slice(0, firstChildNode) : source
  let cursor = 0
  while (cursor < head.length) {
    const hit = head.slice(cursor).search(/<richcontent\b/i)
    if (hit < 0) break
    const idx = cursor + hit
    const el = readElement(head, idx, 'richcontent')
    if (!el) break
    const type = getAttr(el.attrs, 'TYPE') || getAttr(el.attrs, 'type')
    if (String(type).toUpperCase() === 'NOTE') {
      return stripTags(el.inner)
    }
    cursor = el.end
  }
  return ''
}

const parseNodeElement = (xml, openIndex) => {
  const el = readElement(xml, openIndex, 'node')
  if (!el) return null
  const text =
    stripTags(getAttr(el.attrs, 'TEXT') || getAttr(el.attrs, 'text')) || '分支主题'
  const note = extractDirectNote(el.inner)
  const hyperlink =
    getAttr(el.attrs, 'LINK') ||
    getAttr(el.attrs, 'link') ||
    getAttr(el.attrs, 'xlink:href') ||
    ''
  const data = { text }
  if (note) data.note = note
  if (hyperlink) data.hyperlink = hyperlink

  const children = []
  let cursor = 0
  const inner = el.inner || ''
  while (cursor < inner.length) {
    const rel = inner.slice(cursor).search(/<node\b/i)
    if (rel < 0) break
    const childIndex = cursor + rel
    const child = parseNodeElement(inner, childIndex)
    if (!child) break
    children.push(child.node)
    cursor = child.end
  }
  return {
    node: { data, children },
    end: el.end
  }
}

export const isFreemindXml = value => {
  const text = String(value || '').trim()
  if (!text) return false
  return /<map\b/i.test(text) && /<node\b/i.test(text)
}

export const parseFreemindXml = (xml, options = {}) => {
  const source = String(xml || '').trim()
  if (!source) {
    const error = new Error('FreeMind 文件内容为空')
    error.i18nKey = 'import.fileContentError'
    throw error
  }
  if (!isFreemindXml(source)) {
    const error = new Error('不是有效的 FreeMind / Freeplane 文件')
    error.i18nKey = 'import.fileContentError'
    throw error
  }
  const mapOpen = source.match(/<map\b[^>]*>/i)
  const from = mapOpen ? (mapOpen.index || 0) + mapOpen[0].length : 0
  const rootRel = source.slice(from).search(/<node\b/i)
  if (rootRel < 0) {
    const error = new Error('FreeMind 文件缺少根节点')
    error.i18nKey = 'import.fileContentError'
    throw error
  }
  const rootIndex = from + rootRel
  const parsed = parseNodeElement(source, rootIndex)
  if (!parsed?.node) {
    const error = new Error('FreeMind 根节点解析失败')
    error.i18nKey = 'import.fileParsingFailed'
    throw error
  }
  const root = parsed.node
  if (!root.data?.text) {
    root.data = { ...(root.data || {}), text: options.title || '思维导图' }
  }
  return {
    root,
    theme: {
      template: 'classic4',
      config: {}
    },
    layout: 'logicalStructure'
  }
}

export const parseFreemindFile = async file => {
  if (!file) {
    throw new Error('缺少 FreeMind 文件')
  }
  if (typeof file === 'string') {
    return parseFreemindXml(file)
  }
  if (typeof file.text === 'function') {
    return parseFreemindXml(await file.text())
  }
  if (file.raw) {
    return parseFreemindFile(file.raw)
  }
  const error = new Error('无法读取 FreeMind 文件')
  error.i18nKey = 'import.fileParsingFailed'
  throw error
}
