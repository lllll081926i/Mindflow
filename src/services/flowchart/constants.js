/** Flowchart shared constants and errors */
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
