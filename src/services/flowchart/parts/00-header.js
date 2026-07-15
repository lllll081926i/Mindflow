/** Flowchart document core: templates, routing, layout, document IO, export */
import { parseExternalJsonSafely } from '@/utils/json'
import {
  createI18nError,
  FLOWCHART_DOCUMENT_MODE,
  MINDMAP_DOCUMENT_MODE,
  FLOWCHART_DOCUMENT_VERSION,
  DEFAULT_FLOWCHART_TITLE,
  DEFAULT_UNNAMED_NODE_TEXT,
  FLOWCHART_NODE_TYPES,
  DEFAULT_FLOWCHART_CONFIG,
  FLOWCHART_BACKGROUND_STYLES
} from './constants.js'
import {
  FLOWCHART_THEME_PRESETS,
  FLOWCHART_NODE_STYLE_PRESETS,
  FLOWCHART_EDGE_STYLE_PRESETS,
  FLOWCHART_EDGE_DASH_PATTERNS,
  normalizeFlowchartEdgeDashPattern,
  getFlowchartEdgeDashArray,
  getFlowchartThemeDefinition
} from './themes.js'
import {
  escapeXml,
  sanitizeFlowchartSvgMarkup,
  createSvgSafeId
} from './svgUtils.js'

// Re-export the public symbols imported from sibling modules so app can
// continue to import everything from the facade barrel.
export {
  FLOWCHART_DOCUMENT_MODE,
  MINDMAP_DOCUMENT_MODE,
  FLOWCHART_DOCUMENT_VERSION,
  DEFAULT_FLOWCHART_TITLE,
  DEFAULT_UNNAMED_NODE_TEXT,
  FLOWCHART_NODE_TYPES,
  FLOWCHART_THEME_PRESETS,
  FLOWCHART_NODE_STYLE_PRESETS,
  FLOWCHART_EDGE_STYLE_PRESETS,
  FLOWCHART_EDGE_DASH_PATTERNS,
  normalizeFlowchartEdgeDashPattern,
  getFlowchartEdgeDashArray,
  getFlowchartThemeDefinition
}

