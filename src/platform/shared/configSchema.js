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
) => {
  const root = {
    data: {
      text: String(title || '思维导图')
    },
    children: []
  }
  const theme = {
    template:
      String(themeTemplate || '').trim() || DEFAULT_MIND_MAP_THEME_TEMPLATE,
    config: {}
  }
  const resolvedLayout = String(layout || '').trim() || DEFAULT_MIND_MAP_LAYOUT
  const sheetId = 'sheet_default'
  return {
    root,
    theme,
    layout: resolvedLayout,
    sheets: [
      {
        id: sheetId,
        name: '画布 1',
        root,
        theme,
        layout: resolvedLayout,
        view: null
      }
    ],
    activeSheetId: sheetId
  }
}

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
