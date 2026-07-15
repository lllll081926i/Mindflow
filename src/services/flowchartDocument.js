/**
 * Flowchart document public API facade.
 * Implementation lives under ./flowchart and is re-exported for stable imports.
 */
export * from './flowchart/core.js'
export {
  createI18nError,
  DEFAULT_FLOWCHART_CONFIG,
  FLOWCHART_BACKGROUND_STYLES
} from './flowchart/constants.js'
export {
  FLOWCHART_THEME_PRESET_MAP,
  FLOWCHART_EDGE_DASH_ARRAY_MAP
} from './flowchart/themes.js'
export {
  escapeXml,
  sanitizeFlowchartSvgMarkup,
  createSvgSafeId
} from './flowchart/svgUtils.js'
