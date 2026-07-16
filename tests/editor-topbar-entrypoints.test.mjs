import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const toolbarSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/Toolbar.vue'),
  'utf8'
)
const searchSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/Search.vue'),
  'utf8'
)
const editIndexSource = fs.readFileSync(
  path.resolve('src/pages/Edit/Index.vue'),
  'utf8'
)
const editSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/Edit.vue'),
  'utf8'
)

test('编辑页顶部提供返回首页入口', () => {
  assert.match(toolbarSource, /toolbar\.returnHome/)
  assert.match(toolbarSource, /\/home/)
})

test('编辑页导出入口跳转到导出弹窗路由，并由编辑页壳层挂载导出弹窗', () => {
  assert.match(toolbarSource, /\/export/)
  assert.match(toolbarSource, /toolbar\.exportCenter/)
  assert.match(editIndexSource, /ExportDialog/)
  assert.match(editIndexSource, /v-if="isExportRoute"/)
})

test('编辑页页面级入口合并到主工具栏，不再使用独立悬浮层', () => {
  assert.doesNotMatch(toolbarSource, /toolbarPageActions/)
  assert.match(toolbarSource, /class="toolbarBtn fileActionBtn"/)
  assert.match(toolbarSource, /toolbar\.directory/)
  assert.match(toolbarSource, /toolbar\.newFile/)
  assert.match(toolbarSource, /toolbar\.openFile/)
  assert.match(toolbarSource, /toolbar\.saveAs/)
  assert.match(toolbarSource, /toolbar\.import/)
  assert.match(toolbarSource, /toolbar\.exportCenter/)
  assert.match(toolbarSource, /toolbar\.returnHome/)
})

test('编辑页顶部工具栏保留搜索入口并移除状态卡片与快捷键按钮', () => {
  assert.doesNotMatch(toolbarSource, /class="toolbarStatus"/)
  assert.match(toolbarSource, /class="toolbarSaveStatus"/)
  assert.match(toolbarSource, /toolbarStatusText/)
  assert.match(toolbarSource, /toolbarStatusType/)
  assert.match(toolbarSource, /class="toolbarQuickActions"/)
  assert.match(toolbarSource, /toolbar\.searchAction/)
  assert.match(toolbarSource, /toolbar\.commandPaletteAction/)
  assert.match(toolbarSource, /toolbar\.save/)
  assert.match(toolbarSource, /saveCurrentLocalFile/)
  assert.match(toolbarSource, /canDirectSave/)
  assert.match(toolbarSource, /emitShowSearch\(\)/)
  assert.match(toolbarSource, /toolbar\.shortcutAction/)
})

test('编辑页提供命令面板集中触发高频动作', () => {
  assert.match(toolbarSource, /commandPaletteVisible/)
  assert.match(toolbarSource, /commandPaletteKeyword/)
  assert.match(toolbarSource, /commandPaletteActiveIndex/)
  assert.match(toolbarSource, /filteredCommandPaletteItems/)
  assert.match(toolbarSource, /openCommandPalette\(\)/)
  assert.match(toolbarSource, /closeCommandPalette\(\)/)
  assert.match(toolbarSource, /executeCommandPaletteItem\(/)
  assert.match(toolbarSource, /onCommandPaletteKeydown\(/)
  assert.match(toolbarSource, /onCommandPaletteInputKeydown\(/)
  assert.match(toolbarSource, /moveCommandPaletteSelection\(/)
  assert.match(toolbarSource, /window\.addEventListener\('keydown', this\.onCommandPaletteKeydown\)/)
  assert.match(toolbarSource, /window\.removeEventListener\('keydown', this\.onCommandPaletteKeydown\)/)
  assert.match(toolbarSource, /event\.key\?\.toLowerCase\(\) === 's'/)
  assert.match(toolbarSource, /saveCurrentLocalFile\(\)/)
  assert.match(toolbarSource, /toolbar\.commandPalettePlaceholder/)
  assert.match(toolbarSource, /toolbar\.commandPaletteEmpty/)
  assert.match(toolbarSource, /showSearch/)
  assert.match(toolbarSource, /openImportDialog/)
  assert.match(toolbarSource, /openExportDialog/)
  assert.match(toolbarSource, /toggleZenMode/)
  assert.match(toolbarSource, /openOutlinePanel/)
  assert.match(toolbarSource, /saveCurrentLocalFile/)
  assert.match(toolbarSource, /saveLocalFile/)
})

test('编辑页命令面板覆盖大型导图导航命令', () => {
  assert.match(toolbarSource, /emitEditorCommand\(/)
  assert.match(toolbarSource, /toolbar\.fitCanvasAction/)
  assert.match(toolbarSource, /toolbar\.expandAllAction/)
  assert.match(toolbarSource, /toolbar\.collapseAllAction/)
  assert.match(toolbarSource, /toolbar\.pasteOutlineAction/)
  assert.match(toolbarSource, /toolbar\.undo/)
  assert.match(toolbarSource, /toolbar\.redo/)
  assert.match(toolbarSource, /contextmenu\.backToRoot/)
  assert.match(toolbarSource, /\$bus\.\$emit\('execCommand',\s*\.\.\.args\)/)
  assert.match(toolbarSource, /emitEditorCommand\('FIT_CANVAS'\)/)
  assert.match(toolbarSource, /emitEditorCommand\('RETURN_CENTER'\)/)
  assert.match(toolbarSource, /emitEditorCommand\('BACK'\)/)
  assert.match(toolbarSource, /emitEditorCommand\('FORWARD'\)/)
  assert.match(toolbarSource, /emitEditorCommand\('EXPAND_ALL'\)/)
  assert.match(toolbarSource, /emitEditorCommand\('UNEXPAND_ALL',\s*true,\s*''\)/)
  assert.match(editSource, /case 'FIT_CANVAS':/)
  assert.match(editSource, /this\.mindMap\.view\.fit\(\)/)
  assert.match(editSource, /case 'RETURN_CENTER':/)
  assert.match(editSource, /this\.mindMap\.renderer\.setRootNodeCenter\(\)/)
})

test('编辑页命令面板覆盖思维导图节点编辑动作', () => {
  assert.match(toolbarSource, /key:\s*'insertSiblingNode'/)
  assert.match(toolbarSource, /key:\s*'insertChildNode'/)
  assert.match(toolbarSource, /key:\s*'deleteNode'/)
  assert.match(toolbarSource, /key:\s*'nodeImage'/)
  assert.match(toolbarSource, /key:\s*'nodeLink'/)
  assert.match(toolbarSource, /key:\s*'nodeNote'/)
  assert.match(toolbarSource, /key:\s*'nodeTag'/)
  assert.match(toolbarSource, /toolbar\.insertSiblingNode/)
  assert.match(toolbarSource, /toolbar\.insertChildNode/)
  assert.match(toolbarSource, /toolbar\.deleteNode/)
  assert.match(toolbarSource, /toolbar\.image/)
  assert.match(toolbarSource, /toolbar\.link/)
  assert.match(toolbarSource, /toolbar\.note/)
  assert.match(toolbarSource, /toolbar\.tag/)
  assert.match(toolbarSource, /emitEditorCommand\('INSERT_NODE'\)/)
  assert.match(toolbarSource, /emitEditorCommand\('INSERT_CHILD_NODE'\)/)
  assert.match(toolbarSource, /emitEditorCommand\('REMOVE_NODE'\)/)
  assert.match(toolbarSource, /openNodeImageDialog\(this\.getActiveNodesSnapshot\(\)\)/)
  assert.match(toolbarSource, /openNodeLinkDialog\(this\.getActiveNodesSnapshot\(\)\)/)
  assert.match(toolbarSource, /openNodeNoteDialog\(this\.getActiveNodesSnapshot\(\)\)/)
  assert.match(toolbarSource, /openNodeTagDialog\(this\.getActiveNodesSnapshot\(\)\)/)
  assert.match(toolbarSource, /this\.\$bus\.\$on\('node_active', this\.onNodeActive\)/)
  assert.match(toolbarSource, /this\.\$bus\.\$off\('node_active', this\.onNodeActive\)/)
})

test('编辑页在切换上下文前会对未保存风险给出确认', () => {
  assert.match(toolbarSource, /async confirmPotentialDataLoss\(/)
  assert.match(toolbarSource, /getLeaveConfirmOptions\(/)
  assert.match(toolbarSource, /toolbar\.leaveConfirmTitle/)
  assert.match(toolbarSource, /toolbar\.leaveConfirmMessage/)
  assert.match(toolbarSource, /toolbar\.leaveConfirmReturnHomeTitle/)
  assert.match(toolbarSource, /toolbar\.leaveConfirmOpenFileTitle/)
  assert.match(toolbarSource, /toolbar\.leaveConfirmOpenRecentFileTitle/)
  assert.match(toolbarSource, /toolbar\.leaveConfirmOpenDirectoryTitle/)
  assert.match(toolbarSource, /toolbar\.leaveConfirmEditLocalFileTitle/)
  assert.match(toolbarSource, /toolbar\.leaveConfirmNewFileTitle/)
  assert.match(toolbarSource, /await this\.confirmPotentialDataLoss\('returnHome'\)/)
  assert.match(toolbarSource, /await this\.confirmPotentialDataLoss\('openFile'\)/)
  assert.match(toolbarSource, /await this\.confirmPotentialDataLoss\('newFile'\)/)
})

test('工具栏本地文件读写会保留思维导图 config，并在打开文件时回填到编辑态', () => {
  const localFileSessionSource = fs.readFileSync(
    path.resolve('src/pages/Edit/components/editorLocalFileSession.js'),
    'utf8'
  )
  assert.match(localFileSessionSource, /configData:\s*parsedDocument\.mindMapConfig \|\| null/)
  assert.match(toolbarSource, /configData:\s*getConfig\(\)/)
  assert.match(localFileSessionSource, /serializeStoredDocumentContent/)
  assert.match(localFileSessionSource, /mindMapConfig: configData/)
  assert.match(toolbarSource, /configData:\s*normalized\.configData \|\| null/)
  assert.match(
    toolbarSource,
    /\$bus\.\$emit\(\s*'setData',\s*normalized\.data,\s*\{[\s\S]*skipSave:\s*true,[\s\S]*configData:\s*setDataOptions\.configData/
  )
  assert.match(editSource, /if \('configData' in options\)/)
  assert.match(editSource, /this\.mindMapConfig = options\.configData \|\| \{\}/)
})

test('编辑页工具栏打开流程图文件时走统一文档解析并切换到流程图模式', () => {
  const localFileSessionSource = fs.readFileSync(
    path.resolve('src/pages/Edit/components/editorLocalFileSession.js'),
    'utf8'
  )
  assert.match(localFileSessionSource, /parseStoredDocumentContent/)
  assert.match(toolbarSource, /normalized\.documentMode === 'flowchart'/)
  assert.match(toolbarSource, /documentMode:\s*normalized\.documentMode/)
  assert.match(toolbarSource, /flowchartData:\s*normalized\.flowchartData/)
  assert.match(toolbarSource, /flowchartConfig:\s*normalized\.flowchartConfig/)
  assert.doesNotMatch(toolbarSource, /root:\s*data[\s\S]{0,120}documentMode === 'flowchart'/)
})

test('编辑页工具栏打开思维导图文件时清空旧流程图快照', () => {
  assert.match(toolbarSource, /normalized\.documentMode === 'flowchart'/)
  assert.match(toolbarSource, /flowchartData:\s*null/)
  assert.match(toolbarSource, /flowchartConfig:\s*null/)
})

test('编辑器 setData 会先回填导入配置再触发保存，避免写回旧 config', () => {
  const setDataSection = editSource.match(/async setData\(data, options = \{\}\) \{[\s\S]*?\n\s{4}\},/)
  assert.ok(setDataSection)
  assert.ok(
    setDataSection[0].indexOf("if ('configData' in options)") <
      setDataSection[0].indexOf('this.manualSave()')
  )
})

test('搜索面板精简说明区，并支持回车直接开始搜索', () => {
  assert.doesNotMatch(searchSource, /class="searchTips"/)
  assert.doesNotMatch(searchSource, /class="closeBtnBox"/)
  assert.match(searchSource, /class="searchActions"/)
  assert.match(searchSource, /class="searchResultItem"/)
  assert.match(searchSource, /active:\s*activeResultIndex === index/)
  assert.match(searchSource, /@keyup\.enter\.stop\.prevent="onSearchEnter"/)
  assert.match(searchSource, /@keydown\.down\.stop\.prevent="jumpToNextResult\(\)"/)
  assert.match(searchSource, /@keydown\.up\.stop\.prevent="jumpToPrevResult\(\)"/)
  assert.match(searchSource, /executeSearch\(\{ restart = false \} = \{\}\)/)
  assert.match(searchSource, /this\.mindMap\.search\.endSearch\(\)/)
  assert.match(searchSource, /toggleSearch\(\)/)
  assert.match(searchSource, /openSearch\(\)/)
  assert.match(searchSource, /jumpToPrevResult\(\)/)
  assert.match(searchSource, /jumpToNextResult\(\)/)
  assert.match(searchSource, /syncActiveSearchResult\(index\)/)
  assert.match(searchSource, /this\.activeResultIndex = index/)
  assert.match(searchSource, /this\.currentIndex = index \+ 1/)
  assert.match(searchSource, /this\.total = this\.searchResultList\.length/)
  assert.match(searchSource, /this\.showSearchInfo = this\.searchResultList\.length > 0/)
  assert.match(searchSource, /this\.syncActiveSearchResult\(nextIndex\)/)
  assert.match(searchSource, /this\.syncActiveSearchResult\(index\)/)
  assert.match(searchSource, /searchDraftText/)
  assert.match(searchSource, /replaceDraftText/)
  assert.match(searchSource, /cacheSearchDraft\(\)/)
  assert.match(searchSource, /restoreSearchDraft\(\)/)
  assert.match(searchSource, /resetSearchDraft\(\)/)
  assert.match(searchSource, /this\.mindMap\.keyCommand\.addShortcut\('Control\+f', this\.toggleSearch\)/)
  assert.match(searchSource, /this\.mindMap\.keyCommand\.removeShortcut\('Control\+f', this\.toggleSearch\)/)
  assert.match(searchSource, /this\.\$refs\.searchInputRef\?\.select\?\.\(\)/)
  assert.match(searchSource, /width: 248px;/)
  assert.match(searchSource, /min-height: 34px;/)
  assert.match(searchSource, /flex: 1;/)
})

test('命令面板纯函数帮助方法支持过滤与键盘选中', async () => {
  const helperPath = path.resolve('src/pages/Edit/components/editorCommandPalette.js')
  const source = fs.readFileSync(helperPath, 'utf8')
  assert.match(source, /export const filterCommandPaletteItems/)
  assert.match(source, /export const resolveActiveCommandPaletteItem/)
  assert.match(source, /export const moveCommandPaletteIndex/)
  assert.match(source, /export const isCommandPaletteTypingTarget/)
  assert.match(toolbarSource, /from '\.\/editorCommandPalette'/)
  assert.match(toolbarSource, /filterCommandPaletteItems\(/)
  assert.match(toolbarSource, /resolveActiveCommandPaletteItem\(/)
  assert.match(toolbarSource, /moveCommandPaletteIndex\(/)
  assert.match(toolbarSource, /isCommandPaletteTypingTarget\(/)
})

test('工具栏本地文件会话纯函数已抽到独立模块', () => {
  const helperPath = path.resolve(
    'src/pages/Edit/components/editorLocalFileSession.js'
  )
  const helperSource = fs.readFileSync(helperPath, 'utf8')
  assert.match(helperSource, /export const snapshotLocalFileRef/)
  assert.match(helperSource, /export const isSameLocalFileRef/)
  assert.match(helperSource, /export const formatTimeLabel/)
  assert.match(helperSource, /export const parseToolbarLocalFileContent/)
  assert.match(helperSource, /parseStoredDocumentContent/)
  assert.match(toolbarSource, /from '\.\/editorLocalFileSession'/)
  assert.match(toolbarSource, /parseToolbarLocalFileContent/)
  assert.match(toolbarSource, /snapshotLocalFileRef/)
})

test('工具栏本地文件写任务与排队状态判断已抽为纯函数', () => {
  const helperSource = fs.readFileSync(
    path.resolve('src/pages/Edit/components/editorLocalFileSession.js'),
    'utf8'
  )
  assert.match(helperSource, /export const createLocalWriteTaskData/)
  assert.match(helperSource, /export const hasPendingLocalWriteState/)
  assert.match(helperSource, /export const serializeMindMapWriteContent/)
  assert.match(toolbarSource, /createLocalWriteTaskData/)
  assert.match(toolbarSource, /hasPendingLocalWriteState/)
  assert.match(toolbarSource, /serializeMindMapWriteContent/)
})


test('编辑页工具栏展示文档保存状态提示', () => {
  assert.match(toolbarSource, /toolbarSaveStatus/)
  assert.match(toolbarSource, /toolbarStatusText/)
  assert.match(toolbarSource, /toolbarStatusDetail/)
  assert.match(toolbarSource, /statusAutosaving/)
  assert.match(toolbarSource, /statusUnsynced/)
})


test('思维导图命令面板覆盖主题结构与基础样式入口', () => {
  assert.match(toolbarSource, /key:\s*'theme'/)
  assert.match(toolbarSource, /key:\s*'structure'/)
  assert.match(toolbarSource, /key:\s*'baseStyle'/)
  assert.match(toolbarSource, /setActiveSidebar\('theme'\)/)
  assert.match(toolbarSource, /setActiveSidebar\('structure'\)/)
  assert.match(toolbarSource, /setActiveSidebar\('baseStyle'\)/)
})


test('思维导图命令面板支持切换滚动条显示', () => {
  assert.match(toolbarSource, /key:\s*'scrollbar'/)
  assert.match(toolbarSource, /toggleScrollbar/)
  assert.match(toolbarSource, /isShowScrollbar/)
})
