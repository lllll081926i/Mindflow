import { getDefaultAiConfig } from '@/utils/aiProviders.mjs'

export const DESKTOP_STATE_VERSION = 1
export const DEFAULT_MIND_MAP_THEME_TEMPLATE = 'classic4'
export const DEFAULT_MIND_MAP_LAYOUT = 'logicalStructure'

export const DEFAULT_LOCAL_CONFIG = {
  isZenMode: false,
  openNodeRichText: true,
  showToolbarLabels: true,
  editorBackgroundStyle: 'blank',
  useLeftKeySelectionRightKeyDrag: false,
  isShowScrollbar: false,
  isDark: false,
  lastDarkTheme: 'dark4',
  lastLightTheme: 'default',
  enableAi: false,
  // Keep drag-import on by default so open/import stays one gesture away.
  enableDragImport: true
}

export const createDefaultMindMapData = (
  title = '思维导图',
  themeTemplate = DEFAULT_MIND_MAP_THEME_TEMPLATE,
  layout = DEFAULT_MIND_MAP_LAYOUT
) => ({
  root: {
    data: {
      text: String(title || '思维导图')
    },
    children: []
  },
  theme: {
    template:
      String(themeTemplate || '').trim() || DEFAULT_MIND_MAP_THEME_TEMPLATE,
    config: {}
  },
  layout: String(layout || '').trim() || DEFAULT_MIND_MAP_LAYOUT
})

export const DEFAULT_BOOTSTRAP_STATE = () => ({
  version: DESKTOP_STATE_VERSION,
  mindMapData: null,
  mindMapConfig: null,
  flowchartData: null,
  flowchartConfig: null,
  localConfig: {
    ...DEFAULT_LOCAL_CONFIG
  },
  aiConfig: getDefaultAiConfig('volcanoArk'),
  recentFiles: [],
  lastDirectory: '',
  currentDocument: null
})
