import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve('src/services')
const srcFile = path.join(root, 'flowchartDocument.js')
const outDir = path.join(root, 'flowchart')
fs.mkdirSync(outDir, { recursive: true })

const lines = fs.readFileSync(srcFile, 'utf8').split(/\r?\n/)
const slice = (a, b) => lines.slice(a - 1, b).join('\n') + '\n'
const find = re => {
  for (let i = 0; i < lines.length; i += 1) {
    if (re.test(lines[i])) return i + 1
  }
  throw new Error(`not found: ${re}`)
}

// If already split (facade), abort
if (lines.some(line => line.includes("./flowchart/core.js"))) {
  console.log('Already split; skip')
  process.exit(0)
}

const themeDefStart = find(/^export const getFlowchartThemeDefinition/)
const escapeXmlStart = find(/^const escapeXml/)
const createNodeStart = find(/^function createFlowchartNode/)
const templatesStart = find(/^const FLOWCHART_TEMPLATES/)
const templateMetaStart = find(/^export const getFlowchartTemplateMeta/)

const constantsJs = `/** Flowchart shared constants and errors */
export const createI18nError = (message, i18nKey) => {
  const error = new Error(message)
  error.i18nKey = i18nKey
  return error
}

export const FLOWCHART_DOCUMENT_MODE = 'flowchart'
export const MINDMAP_DOCUMENT_MODE = 'mindmap'
export const FLOWCHART_DOCUMENT_VERSION = 1
export const DEFAULT_FLOWCHART_TITLE = '流程图'
export const DEFAULT_UNNAMED_NODE_TEXT = '未命名节点'

export const FLOWCHART_NODE_TYPES = [
  { type: 'start', label: '开始' },
  { type: 'process', label: '处理' },
  { type: 'decision', label: '判断' },
  { type: 'input', label: '输入' },
  { type: 'end', label: '结束' }
]

export const DEFAULT_FLOWCHART_CONFIG = {
  snapToGrid: false,
  gridSize: 24,
  themeId: 'blueprint',
  strictAlignment: false,
  backgroundStyle: 'grid'
}

export const FLOWCHART_BACKGROUND_STYLES = ['none', 'dots', 'grid']
`

let themesBody = slice(33, templatesStart - 1) + '\n' + slice(themeDefStart, escapeXmlStart - 1)
themesBody = themesBody
  .replace(/^const FLOWCHART_THEME_PRESET_MAP/m, 'export const FLOWCHART_THEME_PRESET_MAP')
  .replace(/^const FLOWCHART_EDGE_DASH_ARRAY_MAP/m, 'export const FLOWCHART_EDGE_DASH_ARRAY_MAP')

const themesJs = `/** Flowchart themes and edge style helpers */
${themesBody}
`

let svgBody = slice(escapeXmlStart, createNodeStart - 1)
svgBody = svgBody
  .replace(/^const escapeXml/m, 'export const escapeXml')
  .replace(/^const sanitizeFlowchartSvgMarkup/m, 'export const sanitizeFlowchartSvgMarkup')
  .replace(/^const createSvgSafeId/m, 'export const createSvgSafeId')

const svgUtilsJs = `/** Flowchart SVG safety helpers */
${svgBody}
`

// templates + remaining implementation (skip themeDef + svg utils already extracted)
const coreBody = slice(templatesStart, themeDefStart - 1) + '\n' + slice(createNodeStart, lines.length)

const coreJs = `/** Flowchart document core: templates, routing, layout, document IO, export */
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
  FLOWCHART_THEME_PRESET_MAP,
  FLOWCHART_THEME_PRESETS,
  FLOWCHART_NODE_STYLE_PRESETS,
  FLOWCHART_EDGE_STYLE_PRESETS,
  FLOWCHART_EDGE_DASH_ARRAY_MAP,
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

${coreBody}
`

const facade = `/**
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
`

// Backup original once
const backupPath = path.join(outDir, '_legacy_flowchartDocument.backup.js')
if (!fs.existsSync(backupPath)) {
  fs.copyFileSync(srcFile, backupPath)
}

fs.writeFileSync(path.join(outDir, 'constants.js'), constantsJs)
fs.writeFileSync(path.join(outDir, 'themes.js'), themesJs)
fs.writeFileSync(path.join(outDir, 'svgUtils.js'), svgUtilsJs)
fs.writeFileSync(path.join(outDir, 'core.js'), coreJs)
fs.writeFileSync(srcFile, facade)

const sizes = Object.fromEntries(
  ['constants.js', 'themes.js', 'svgUtils.js', 'core.js'].map(name => [
    name,
    fs.statSync(path.join(outDir, name)).size
  ])
)
console.log('split complete', sizes, 'facade', fs.statSync(srcFile).size)
console.log('templateMetaStart', templateMetaStart)
