export const getFlowchartExportBounds = (
  flowchartData,
  { paddingX = 120, paddingY = 120, edgeLayouts = [] } = {}
) => {
  const nodes = Array.isArray(flowchartData?.nodes) ? flowchartData.nodes : []
  const lanes = Array.isArray(flowchartData?.lanes) ? flowchartData.lanes : []
  const items = [...lanes, ...nodes]
  const bounds = items.reduce(
    (result, item) => ({
      minX: Math.min(result.minX, Number(item.x || 0)),
      minY: Math.min(result.minY, Number(item.y || 0)),
      maxX: Math.max(
        result.maxX,
        Number(item.x || 0) + Number(item.width || 0)
      ),
      maxY: Math.max(
        result.maxY,
        Number(item.y || 0) + Number(item.height || 0)
      )
    }),
    {
      minX: Infinity,
      minY: Infinity,
      maxX: -Infinity,
      maxY: -Infinity
    }
  )
  let hasContent = items.length > 0
  const extendBoundsWithPoint = point => {
    const x = Number(point?.x)
    const y = Number(point?.y)
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return
    }
    bounds.minX = Math.min(bounds.minX, x)
    bounds.minY = Math.min(bounds.minY, y)
    bounds.maxX = Math.max(bounds.maxX, x)
    bounds.maxY = Math.max(bounds.maxY, y)
    hasContent = true
  }
  const extendBoundsWithRect = rect => {
    const x = Number(rect?.x)
    const y = Number(rect?.y)
    const width = Number(rect?.width)
    const height = Number(rect?.height)
    if (
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      !Number.isFinite(width) ||
      !Number.isFinite(height)
    ) {
      return
    }
    bounds.minX = Math.min(bounds.minX, x)
    bounds.minY = Math.min(bounds.minY, y)
    bounds.maxX = Math.max(bounds.maxX, x + width)
    bounds.maxY = Math.max(bounds.maxY, y + height)
    hasContent = true
  }
  edgeLayouts.forEach(entry => {
    const edge = entry?.edge || entry
    const layout = entry?.layout || entry
    ;(Array.isArray(layout?.pathPoints) ? layout.pathPoints : []).forEach(
      extendBoundsWithPoint
    )
    ;(Array.isArray(layout?.arrowMarkers) ? layout.arrowMarkers : []).forEach(marker => {
      const arrowReach = Math.max(6, Number(marker?.size || 1) * 6)
      extendBoundsWithRect({
        x: Number(marker?.x || 0) - arrowReach,
        y: Number(marker?.y || 0) - arrowReach,
        width: arrowReach * 2,
        height: arrowReach * 2
      })
    })
    if (edge?.label) {
      extendBoundsWithRect(
        getFlowchartEdgeLabelBox({
          ...layout,
          edge
        })
      )
    }
  })
  if (!hasContent) {
    return {
      x: 0,
      y: 0,
      width: 1200,
      height: 720
    }
  }
  return {
    x: Math.floor(bounds.minX - paddingX),
    y: Math.floor(bounds.minY - paddingY),
    width: Math.max(1200, Math.ceil(bounds.maxX - bounds.minX + paddingX * 2)),
    height: Math.max(720, Math.ceil(bounds.maxY - bounds.minY + paddingY * 2))
  }
}

export const buildFlowchartSvgMarkup = (
  flowchartData,
  {
    flowchartConfig = null,
    isDark = false,
    transparent = false,
    paddingX = 120,
    paddingY = 120
  } = {}
) => {
  const normalizedData = normalizeFlowchartData(flowchartData || {})
  const normalizedConfig = normalizeFlowchartConfig(
    flowchartConfig,
    normalizedData.templateId
  )
  const theme = resolveFlowchartThemeFromConfig(
    normalizedConfig,
    normalizedData.templateId,
    { isDark }
  )
  const edgeItems = normalizedData.edges
    .map(edge => {
      const sourceNode = normalizedData.nodes.find(node => node.id === edge.source)
      const targetNode = normalizedData.nodes.find(node => node.id === edge.target)
      if (!sourceNode || !targetNode) return null
      return {
        edge,
        layout: getFlowchartEdgeLayout(edge, sourceNode, targetNode, {
          theme,
          strictAlignment: !!normalizedConfig.strictAlignment,
          nodes: normalizedData.nodes
        })
      }
    })
    .filter(Boolean)
  const bounds = getFlowchartExportBounds(normalizedData, {
    paddingX,
    paddingY,
    edgeLayouts: edgeItems
  })
  const backgroundStyle = normalizeFlowchartBackgroundStyle(
    normalizedConfig.backgroundStyle
  )
  const backgroundPatternId = `flowchart-bg-${createSvgSafeId(
    `${normalizedData.title || 'document'}-${backgroundStyle}`
  )}`
  const backgroundPatternDefs =
    backgroundStyle === 'dots'
      ? `<pattern id="${backgroundPatternId}" width="18" height="18" patternUnits="userSpaceOnUse"><rect width="18" height="18" fill="${escapeXml(
          theme.canvasBg
        )}"/><circle cx="2" cy="2" r="1.4" fill="${escapeXml(
          theme.gridColor
        )}"/></pattern>`
      : backgroundStyle === 'grid'
      ? `<pattern id="${backgroundPatternId}" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill="${escapeXml(
          theme.canvasBg
        )}"/><path d="M 24 0 L 0 0 0 24" fill="none" stroke="${escapeXml(
          theme.gridColor
        )}" stroke-width="1"/></pattern>`
      : ''
  const edges = edgeItems
    .map(({ edge, layout }) => {
      const dash = layout.style.dashArray ? ` stroke-dasharray="${layout.style.dashArray}"` : ''
      const label = edge.label
        ? `<text x="${layout.labelX}" y="${layout.labelY}" font-size="14" font-weight="700" font-family="&quot;Microsoft YaHei&quot;, &quot;PingFang SC&quot;, &quot;Noto Sans SC&quot;, sans-serif" fill="${escapeXml(layout.style.labelColor)}" stroke="${escapeXml(theme.canvasBg)}" stroke-width="4" paint-order="stroke" stroke-linejoin="round" text-anchor="middle" dominant-baseline="middle">${escapeXml(edge.label)}</text>`
        : ''
      return `<g><path d="${layout.path}" fill="none" stroke="${escapeXml(layout.style.stroke)}" stroke-width="2"${dash}/>${label}</g>`
    })
    .join('')
  const arrows = edgeItems
    .map(({ layout }) => {
      return (layout.arrowMarkers || [])
        .map(marker => {
          return `<path class="flowchart-arrow-head" d="${getFlowchartArrowHeadPath(
            marker
          )}" transform="translate(${marker.x} ${marker.y}) rotate(${marker.angle})" fill="${escapeXml(layout.style.stroke)}"/>`
        })
        .join('')
    })
    .join('')
  const lanes = normalizedData.lanes
    .map(lane =>
      buildSvgLaneMarkup(lane, {
        theme,
        flowchartConfig: normalizedConfig
      })
    )
    .join('')
  const nodes = normalizedData.nodes
    .map(node => {
      const visualStyle = getFlowchartNodeVisualStyle(node, {
        isDark,
        theme
      })
      return `<g>${buildSvgNodeShapeMarkup(node, {
        isDark,
        theme
      })}<text x="${
        Number(node.x || 0) + Number(node.width || 0) / 2
      }" y="${
        Number(node.y || 0) + Number(node.height || 0) / 2
      }" font-size="16" font-family="&quot;Microsoft YaHei&quot;, &quot;PingFang SC&quot;, &quot;Noto Sans SC&quot;, sans-serif" fill="${escapeXml(visualStyle.textColor)}" text-anchor="middle" dominant-baseline="middle">${escapeXml(node.text)}</text></g>`
    })
    .join('')
  const background = transparent
    ? ''
    : `<rect x="${bounds.x}" y="${bounds.y}" width="${bounds.width}" height="${bounds.height}" fill="${
        backgroundStyle === 'grid'
          ? `url(#${backgroundPatternId})`
          : backgroundStyle === 'dots'
            ? `url(#${backgroundPatternId})`
          : theme.canvasBg
      }"/>`
  const arrowLayer = arrows ? `<g class="flowchart-arrow-layer">${arrows}</g>` : ''
  return sanitizeFlowchartSvgMarkup(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${bounds.width}" height="${bounds.height}" viewBox="${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}"><defs>${backgroundPatternDefs}</defs>${background}${lanes}${edges}${nodes}${arrowLayer}</svg>`
  )
}

export const getFlowchartTemplateIds = () => Object.keys(FLOWCHART_TEMPLATES)



