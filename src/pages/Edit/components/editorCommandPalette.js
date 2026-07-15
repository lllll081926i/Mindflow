/**
 * Pure helpers for the mind-map editor command palette.
 * Kept free of Vue instance APIs so Toolbar can stay thinner.
 */

export const filterCommandPaletteItems = (items = [], keyword = '') => {
  const normalizedKeyword = String(keyword || '')
    .trim()
    .toLowerCase()
  if (!normalizedKeyword) {
    return Array.isArray(items) ? items : []
  }
  return (Array.isArray(items) ? items : []).filter(item => {
    return [item?.key, item?.label]
      .filter(Boolean)
      .some(text =>
        String(text)
          .toLowerCase()
          .includes(normalizedKeyword)
      )
  })
}

export const resolveActiveCommandPaletteItem = (
  items = [],
  activeIndex = 0
) => {
  if (!Array.isArray(items) || items.length <= 0) {
    return null
  }
  const index = Math.min(Math.max(Number(activeIndex) || 0, 0), items.length - 1)
  return items[index] || null
}

export const moveCommandPaletteIndex = (
  items = [],
  activeIndex = 0,
  step = 1
) => {
  if (!Array.isArray(items) || items.length <= 0) {
    return 0
  }
  const total = items.length
  const current = Math.min(Math.max(Number(activeIndex) || 0, 0), total - 1)
  return (current + Number(step || 0) + total * 10) % total
}

export const isCommandPaletteTypingTarget = target => {
  const tagName = String(target?.tagName || '').toLowerCase()
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    !!target?.isContentEditable
  )
}
