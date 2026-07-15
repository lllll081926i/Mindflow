/** Flowchart SVG safety helpers */
export const escapeXml = value => {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export const sanitizeFlowchartSvgMarkup = svgMarkup => {
  const normalizedSvgMarkup = String(svgMarkup || '')
    .trim()
    .replace(/<\?xml[\s\S]*?\?>/gi, '')
  if (!normalizedSvgMarkup) {
    return ''
  }
  const stripUnsafeSvgMarkup = markup => {
    return String(markup || '')
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
      .replace(/\s+on[a-z-]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .replace(
        /\s+(href|xlink:href)\s*=\s*(['"])\s*javascript:[\s\S]*?\2/gi,
        ''
      )
  }
  if (
    typeof DOMParser === 'undefined' ||
    typeof XMLSerializer === 'undefined'
  ) {
    return stripUnsafeSvgMarkup(normalizedSvgMarkup)
  }
  try {
    const svgDocument = new DOMParser().parseFromString(
      normalizedSvgMarkup,
      'image/svg+xml'
    )
    if (
      svgDocument.querySelector('parsererror') ||
      svgDocument.documentElement?.nodeName?.toLowerCase() !== 'svg'
    ) {
      return stripUnsafeSvgMarkup(normalizedSvgMarkup)
    }
    svgDocument.querySelectorAll('script').forEach(node => {
      node.remove()
    })
    svgDocument.querySelectorAll('*').forEach(element => {
      Array.from(element.attributes).forEach(attribute => {
        const name = attribute.name.toLowerCase()
        const value = String(attribute.value || '')
        if (name.startsWith('on')) {
          element.removeAttribute(attribute.name)
          return
        }
        if (
          (name === 'href' || name === 'xlink:href') &&
          /^\s*javascript:/i.test(value)
        ) {
          element.removeAttribute(attribute.name)
        }
      })
    })
    return new XMLSerializer().serializeToString(svgDocument.documentElement)
  } catch (_error) {
    return stripUnsafeSvgMarkup(normalizedSvgMarkup)
  }
}

export const createSvgSafeId = value =>
  String(value || 'item').replace(/[^a-zA-Z0-9_-]/g, '-')


