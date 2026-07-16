import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const contextmenuSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/Contextmenu.vue'),
  'utf8'
)
const outlineSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/Outline.vue'),
  'utf8'
)
const navigatorSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/Navigator.vue'),
  'utf8'
)
const baseStyleSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/BaseStyle.vue'),
  'utf8'
)
const settingSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/Setting.vue'),
  'utf8'
)
const richTextToolbarSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/RichTextToolbar.vue'),
  'utf8'
)
const toolbarSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/Toolbar.vue'),
  'utf8'
)
const flowchartToolbarSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/FlowchartToolbar.vue'),
  'utf8'
)
const editSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/Edit.vue'),
  'utf8'
)
const langSource = fs.readFileSync(path.resolve('src/lang/index.js'), 'utf8')
const projectRoadmapSource = fs.readFileSync(
  path.resolve('docs/project-roadmap.md'),
  'utf8'
)
const editorToolbarActionPath = path.resolve(
  'src/pages/Edit/components/EditorToolbarAction.vue'
)
const editorToolbarActionSource = fs.readFileSync(editorToolbarActionPath, 'utf8')

// ─── Contextmenu position fix ───

test('Contextmenu show() sets left/top before isShow=true', () => {
  const showMatch = contextmenuSource.match(/show\s*\(\s*e\s*,\s*node\s*\)\s*\{[\s\S]*?(?=\n\s{4}\w|\n\s{4}\/\/)/)
  assert.ok(showMatch, 'show() method should exist')
  const body = showMatch[0]
  const isShowIdx = body.indexOf('this.isShow = true')
  assert.ok(isShowIdx > 0, 'should set isShow=true')
  const leftIdx = body.indexOf('this.left =')
  const topIdx = body.indexOf('this.top =')
  assert.ok(leftIdx >= 0, 'should set this.left')
  assert.ok(topIdx >= 0, 'should set this.top')
  assert.ok(leftIdx < isShowIdx, 'this.left should be set BEFORE isShow=true')
  assert.ok(topIdx < isShowIdx, 'this.top should be set BEFORE isShow=true')
})

test('Contextmenu show2() sets left/top before isShow=true', () => {
  const show2Match = contextmenuSource.match(/show2\s*\(\s*e\s*\)\s*\{[\s\S]*?(?=\n\s{4}\w|\n\s{4}\/\/)/)
  assert.ok(show2Match, 'show2() method should exist')
  const body = show2Match[0]
  const isShowIdx = body.indexOf('this.isShow = true')
  assert.ok(isShowIdx > 0, 'should set isShow=true')
  const leftIdx = body.indexOf('this.left =')
  const topIdx = body.indexOf('this.top =')
  assert.ok(leftIdx >= 0, 'should set this.left')
  assert.ok(topIdx >= 0, 'should set this.top')
  assert.ok(leftIdx < isShowIdx, 'this.left should be set BEFORE isShow=true')
  assert.ok(topIdx < isShowIdx, 'this.top should be set BEFORE isShow=true')
})

// ─── Outline debounce ───

test('Outline scheduleRefresh uses setTimeout debounce, not rAF', () => {
  assert.ok(
    outlineSource.includes('setTimeout'),
    'Outline should use setTimeout for debounce'
  )
  // Should NOT use rAF for refresh scheduling
  const scheduleRefreshMatch = outlineSource.match(
    /scheduleRefresh\s*\(\s*\)\s*\{[\s\S]*?(?=\n\s{4}\w|\n\s{4}\/\/)/
  )
  assert.ok(scheduleRefreshMatch, 'scheduleRefresh method should exist')
  const body = scheduleRefreshMatch[0]
  assert.ok(
    !body.includes('requestAnimationFrame'),
    'scheduleRefresh should not use requestAnimationFrame'
  )
  assert.ok(body.includes('setTimeout'), 'scheduleRefresh should use setTimeout')
})

test('Outline scheduleRefresh debounce is between 100ms and 300ms', () => {
  const match = outlineSource.match(/setTimeout\s*\(\s*\(\)\s*=>\s*\{[\s\S]*?\}\s*,\s*(\d+)\s*\)/)
  assert.ok(match, 'should find setTimeout with delay')
  const delay = parseInt(match[1], 10)
  assert.ok(delay >= 100 && delay <= 300, `debounce delay should be 100-300ms, got ${delay}`)
})

test('Outline cleans up refreshTimer in beforeUnmount', () => {
  const beforeUnmountMatch = outlineSource.match(
    /beforeUnmount\s*\(\)\s*\{[\s\S]*?\n\s{2}\}/
  )
  assert.ok(beforeUnmountMatch, 'beforeUnmount should exist')
  const body = beforeUnmountMatch[0]
  assert.ok(
    body.includes('clearTimeout') && body.includes('refreshTimer'),
    'beforeUnmount should clear refreshTimer'
  )
})

// ─── Navigator debounce ───

test('Navigator data_change debounce is 300ms or less', () => {
  // Find the data_change method
  const match = navigatorSource.match(
    /data_change\s*\(\)\s*\{[\s\S]*?(?=\n\s{4}\w|\n\s{4}\/\/)/
  )
  assert.ok(match, 'data_change method should exist')
  const body = match[0]
  const timerMatch = body.match(/setTimeout\s*\(\s*\(\)\s*=>\s*\{[\s\S]*?\}\s*,\s*(\d+)\s*\)/)
  assert.ok(timerMatch, 'should find setTimeout in data_change')
  const delay = parseInt(timerMatch[1], 10)
  assert.ok(delay <= 300, `debounce should be <= 300ms, got ${delay}`)
})

// ─── BaseStyle persistence debounce ───

test('BaseStyle update() debounces storeData call', () => {
  const updateMatch = baseStyleSource.match(
    /update\s*\(\s*key\s*,\s*value\s*\)\s*\{[\s\S]*?(?=\n\s{4}\w|\n\s{4}\/\/)/
  )
  assert.ok(updateMatch, 'update() method should exist')
  const body = updateMatch[0]
  assert.ok(body.includes('storeData'), 'update() should call storeData')
  assert.ok(
    body.includes('setTimeout') || body.includes('clearTimeout'),
    'update() should debounce storeData'
  )
  assert.ok(
    body.includes('storeDataTimer') || body.includes('debounce'),
    'update() should use a timer variable for debounce'
  )
})

test('BaseStyle updateMargin() debounces storeData call', () => {
  const match = baseStyleSource.match(
    /updateMargin\s*\(\s*type\s*,\s*value\s*\)\s*\{[\s\S]*?(?=\n\s{4}\w|\n\s{4}\/\/)/
  )
  assert.ok(match, 'updateMargin() method should exist')
  const body = match[0]
  assert.ok(body.includes('storeData'), 'updateMargin() should call storeData')
  assert.ok(
    body.includes('setTimeout') || body.includes('clearTimeout'),
    'updateMargin() should debounce storeData'
  )
})

test('BaseStyle updateOuterFramePadding() debounces storeConfig call', () => {
  const match = baseStyleSource.match(
    /updateOuterFramePadding\s*\(\s*\w+\s*,\s*\w+\s*\)\s*\{[\s\S]*?(?=\n\s{4}\w|\n\s{4}\/\/)/
  )
  assert.ok(match, 'updateOuterFramePadding() method should exist')
  const body = match[0]
  assert.ok(body.includes('storeConfig'), 'updateOuterFramePadding() should call storeConfig')
  assert.ok(
    body.includes('setTimeout') || body.includes('clearTimeout'),
    'updateOuterFramePadding() should debounce storeConfig'
  )
})

// ─── Setting persistence debounce ───

test('Setting updateOtherConfig() debounces storeConfig call', () => {
  const match = settingSource.match(
    /updateOtherConfig\s*\(\s*key\s*,\s*value\s*\)\s*\{[\s\S]*?(?=\n\s{4}\w|\n\s{4}\/\/)/
  )
  assert.ok(match, 'updateOtherConfig() method should exist')
  const body = match[0]
  assert.ok(body.includes('storeConfig'), 'updateOtherConfig() should call storeConfig')
  assert.ok(
    body.includes('setTimeout') || body.includes('clearTimeout'),
    'updateOtherConfig() should debounce storeConfig'
  )
  assert.ok(
    body.includes('storeConfigTimer') || body.includes('debounce'),
    'updateOtherConfig() should use a timer variable for debounce'
  )
})

// ─── RichTextToolbar boundary check ───

test('RichTextToolbar checks viewport boundaries', () => {
  const match = richTextToolbarSource.match(
    /onRichTextSelectionChange\s*\(\s*hasRange\s*,\s*rect\s*,\s*formatInfo\s*\)\s*\{[\s\S]*?(?=\n\s{4}\w|\n\s{4}\/\/)/
  )
  assert.ok(match, 'onRichTextSelectionChange should exist')
  const body = match[0]
  assert.ok(
    body.includes('window.innerHeight') || body.includes('top < ') || body.includes('top < 0'),
    'should check top boundary'
  )
})

test('RichTextToolbar has CSS transition', () => {
  assert.ok(
    richTextToolbarSource.includes('transition'),
    'RichTextToolbar should have CSS transition'
  )
})

test('思维导图顶部快捷区提供专注、大纲和粘贴大纲入口', () => {
  assert.equal(fs.existsSync(editorToolbarActionPath), true)
  assert.match(toolbarSource, /EditorToolbarAction/)
  assert.match(flowchartToolbarSource, /EditorToolbarAction/)
  assert.doesNotMatch(editorToolbarActionSource, /@keydown\.\w+\.prevent/)
  assert.match(editorToolbarActionSource, /v-on="keyboardListeners"/)
  assert.match(toolbarSource, /toggleZenMode\(/)
  assert.match(toolbarSource, /openOutlinePanel\(/)
  assert.match(toolbarSource, /pasteOutlineFromClipboard\(/)
  assert.match(toolbarSource, /\$t\('toolbar\.focusModeAction'\)/)
  assert.match(toolbarSource, /\$t\('toolbar\.outlineAction'\)/)
  assert.match(toolbarSource, /\$t\('toolbar\.pasteOutlineAction'\)/)
  assert.match(langSource, /"focusModeAction": "专注"/)
  assert.match(langSource, /"outlineAction": "大纲"/)
  assert.match(langSource, /"pasteOutlineAction": "粘贴大纲"/)
})

test('思维导图支持把剪贴板多行文本作为当前节点的子主题导入', () => {
  assert.match(toolbarSource, /\$bus\.\$emit\('pasteOutlineFromClipboard'\)/)
  assert.match(editSource, /\$bus\.\$on\(\s*'pasteOutlineFromClipboard'/)
  assert.match(editSource, /\$bus\.\$off\(\s*'pasteOutlineFromClipboard'/)
  assert.match(editSource, /readClipboardText\(/)
  assert.match(editSource, /parsePastedOutlineText\(/)
  assert.match(editSource, /INSERT_MULTI_CHILD_NODE/)
  assert.match(editSource, /renderer\?\.activeNodeList|renderer\.activeNodeList/)
  assert.match(editSource, /\$t\('toolbar\.pasteOutlineNeedSelection'\)/)
  assert.match(editSource, /\$t\('toolbar\.pasteOutlineEmpty'\)/)
  assert.match(langSource, /"pasteOutlineNeedSelection": "请先选择一个主题"/)
  assert.match(langSource, /"pasteOutlineSuccess": "已从剪贴板生成子主题"/)
})

test('思维导图核心界面不出现待办或任务管理入口', () => {
  assert.doesNotMatch(contextmenuSource, /contextmenu\.addToDo/)
  assert.doesNotMatch(contextmenuSource, /contextmenu\.removeToDo/)
  assert.doesNotMatch(contextmenuSource, /contextmenu\.taskPriority/)
  assert.doesNotMatch(contextmenuSource, /contextmenu\.taskDueDate/)
  assert.doesNotMatch(contextmenuSource, /ADD_TO_DO/)
  assert.doesNotMatch(contextmenuSource, /REMOVE_TO_DO/)
  assert.doesNotMatch(contextmenuSource, /SET_TASK_PRIORITY/)
  assert.doesNotMatch(contextmenuSource, /SET_TASK_DUE_DATE/)

  assert.doesNotMatch(toolbarSource, /toolbar\.taskSummaryAction/)
  assert.doesNotMatch(toolbarSource, /key:\s*'tasks'/)
  assert.doesNotMatch(toolbarSource, /openTaskSummaryPanel/)

  assert.doesNotMatch(editSource, /taskSummary/)
  assert.doesNotMatch(editSource, /mindMapTaskCheckbox/)
  assert.doesNotMatch(editSource, /mindMapTaskPrefixWrap/)
  assert.doesNotMatch(editSource, /node\.getData\('checkbox'\)/)

  assert.doesNotMatch(langSource, /"addToDo": "添加待办"/)
  assert.doesNotMatch(langSource, /"removeToDo": "删除待办"/)
  assert.doesNotMatch(langSource, /"taskSummaryAction": "任务"/)
  assert.doesNotMatch(langSource, /"taskSummaryEmpty": "暂无待办任务"/)

  assert.doesNotMatch(projectRoadmapSource, /待办/)
  assert.doesNotMatch(projectRoadmapSource, /任务属性/)
  assert.doesNotMatch(projectRoadmapSource, /任务视图/)
  assert.doesNotMatch(projectRoadmapSource, /任务汇总/)
  assert.doesNotMatch(projectRoadmapSource, /任务系统/)
})


test('大纲侧边栏支持节点搜索过滤', () => {
  const sidebarSource = fs.readFileSync(
    path.resolve('src/pages/Edit/components/OutlineSidebar.vue'),
    'utf8'
  )
  const outlineSource = fs.readFileSync(
    path.resolve('src/pages/Edit/components/Outline.vue'),
    'utf8'
  )
  const langSource = fs.readFileSync(path.resolve('src/lang/index.js'), 'utf8')
  assert.match(sidebarSource, /outlineKeyword/)
  assert.match(sidebarSource, /outlineSearch/)
  assert.match(outlineSource, /filterOutlineNode/)
  assert.match(outlineSource, /filter-node-method/)
  assert.match(langSource, /搜索大纲节点/)
})


test('导图导入失败会优先展示具体错误信息', () => {
  const importSource = fs.readFileSync(
    path.resolve('src/pages/Edit/components/Import.vue'),
    'utf8'
  )
  assert.match(importSource, /error\?\.message \|\| this\.\$t\('import\.fileParsingFailed'\)/)
  assert.match(importSource, /error\?\.i18nKey/)
})


test('思维导图命令面板支持转换为流程图', () => {
  const toolbarSource = fs.readFileSync(path.resolve('src/pages/Edit/components/Toolbar.vue'), 'utf8')
  const langSource = fs.readFileSync(path.resolve('src/lang/index.js'), 'utf8')
  assert.ok(toolbarSource.includes('convertCurrentToFlowchart'))
  assert.ok(toolbarSource.includes("key: 'convertToFlowchart'"))
  assert.match(langSource, /"convertToFlowchart"/)
})


test('思维导图导入支持 FreeMind .mm', () => {
  const importSource = fs.readFileSync(path.resolve('src/pages/Edit/components/Import.vue'), 'utf8')
  const desktopSource = fs.readFileSync(path.resolve('src/platform/desktop/index.js'), 'utf8')
  const parseSource = fs.readFileSync(path.resolve('src/services/freemindParse.js'), 'utf8')
  assert.ok(importSource.includes('handleFreemind'))
  assert.ok(importSource.includes('.mm'))
  assert.ok(desktopSource.includes("'mm'") || desktopSource.includes('"mm"') || desktopSource.includes('.mm'))
  assert.ok(parseSource.includes('parseFreemindXml'))
})


test('导图粘贴大纲无选中时回落到根节点', () => {
  const editSource = fs.readFileSync(path.resolve('src/pages/Edit/components/Edit.vue'), 'utf8')
  assert.ok(editSource.includes('renderer?.root'))
  assert.ok(editSource.includes('activeNodeList = [rootNode]'))
})


test('思维导图工具栏提供转换为流程图入口', () => {
  const toolbarSource = fs.readFileSync(path.resolve('src/pages/Edit/components/Toolbar.vue'), 'utf8')
  assert.ok(toolbarSource.includes('@click="convertCurrentToFlowchart"'))
  assert.ok(toolbarSource.includes("('toolbar.convertToFlowchart')"))
})


test('导图转流程后会立即同步编辑器文档模式', () => {
  const toolbarSource = fs.readFileSync(path.resolve('src/pages/Edit/components/Toolbar.vue'), 'utf8')
  assert.ok(toolbarSource.includes('useEditorStore'))
  assert.ok(toolbarSource.includes("documentMode: 'flowchart'"))
})


test('默认开启拖拽导入以便核心打开链路更顺手', () => {
  const schemaSource = fs.readFileSync(
    path.resolve('src/platform/shared/configSchema.js'),
    'utf8'
  )
  assert.ok(schemaSource.includes('enableDragImport: true'))
})


test('思维导图 Space 打开备注编辑', () => {
  const toolbarSource = fs.readFileSync(path.resolve('src/pages/Edit/components/Toolbar.vue'), 'utf8')
  const configSource = fs.readFileSync(path.resolve('src/config/zh.js'), 'utf8')
  assert.ok(toolbarSource.includes("event.key === ' '"))
  assert.ok(toolbarSource.includes('openNodeNoteDialog'))
  assert.ok(configSource.includes('编辑备注'))
  assert.ok(configSource.includes("'Space'"))
})


test('思维导图 Ctrl+Shift+K 打开超链接编辑', () => {
  const toolbarSource = fs.readFileSync(path.resolve('src/pages/Edit/components/Toolbar.vue'), 'utf8')
  const configSource = fs.readFileSync(path.resolve('src/config/zh.js'), 'utf8')
  assert.ok(toolbarSource.includes("event.key?.toLowerCase() === 'k'"))
  assert.ok(toolbarSource.includes('openNodeLinkDialog'))
  assert.ok(configSource.includes('编辑超链接'))
})


test('思维导图 Ctrl+Shift+T 打开标签编辑', () => {
  const toolbarSource = fs.readFileSync(path.resolve('src/pages/Edit/components/Toolbar.vue'), 'utf8')
  const configSource = fs.readFileSync(path.resolve('src/config/zh.js'), 'utf8')
  assert.ok(toolbarSource.includes("event.key?.toLowerCase() === 't'"))
  assert.ok(toolbarSource.includes('openNodeTagDialog'))
  assert.ok(configSource.includes('编辑标签'))
})


test('思维导图图片与关联线快捷键可用', () => {
  const toolbarSource = fs.readFileSync(path.resolve('src/pages/Edit/components/Toolbar.vue'), 'utf8')
  const configSource = fs.readFileSync(path.resolve('src/config/zh.js'), 'utf8')
  assert.ok(toolbarSource.includes("event.key?.toLowerCase() === 'i'"))
  assert.ok(toolbarSource.includes('openNodeImageDialog'))
  assert.ok(toolbarSource.includes("event.key?.toLowerCase() === 'a'"))
  assert.ok(toolbarSource.includes("createAssociativeLine"))
  assert.ok(configSource.includes('编辑图片'))
  assert.ok(configSource.includes('创建关联线'))
})


test('思维导图格式刷/外框/概要快捷键可用', () => {
  const toolbarSource = fs.readFileSync(path.resolve('src/pages/Edit/components/Toolbar.vue'), 'utf8')
  const configSource = fs.readFileSync(path.resolve('src/config/zh.js'), 'utf8')
  assert.ok(toolbarSource.includes("event.key?.toLowerCase() === 'p'"))
  assert.ok(toolbarSource.includes('startPainter'))
  assert.ok(toolbarSource.includes('ADD_OUTER_FRAME'))
  assert.ok(toolbarSource.includes('ADD_GENERALIZATION'))
  assert.ok(configSource.includes('格式刷'))
  assert.ok(configSource.includes('添加外框'))
})


test('思维导图导出/图标/公式快捷键可用', () => {
  const toolbarSource = fs.readFileSync(path.resolve('src/pages/Edit/components/Toolbar.vue'), 'utf8')
  const configSource = fs.readFileSync(path.resolve('src/config/zh.js'), 'utf8')
  assert.ok(toolbarSource.includes("event.key?.toLowerCase() === 'e'"))
  assert.ok(toolbarSource.includes('openExportDialog'))
  assert.ok(toolbarSource.includes("setActiveSidebar('nodeIconSidebar')"))
  assert.ok(toolbarSource.includes("setActiveSidebar('formulaSidebar')"))
  assert.ok(configSource.includes('打开导出中心'))
  assert.ok(configSource.includes('节点图标'))
  assert.ok(configSource.includes('插入公式'))
})


test('思维导图导入与专注模式快捷键可用', () => {
  const toolbarSource = fs.readFileSync(path.resolve('src/pages/Edit/components/Toolbar.vue'), 'utf8')
  const configSource = fs.readFileSync(path.resolve('src/config/zh.js'), 'utf8')
  assert.ok(toolbarSource.includes('openImportDialog'))
  assert.ok(toolbarSource.includes('toggleZenMode'))
  assert.ok(toolbarSource.includes("event.key?.toLowerCase() === 'o'"))
  assert.ok(configSource.includes('打开导入'))
  assert.ok(configSource.includes('切换专注模式'))
})


test('思维导图展开收起与适应画布快捷键可用', () => {
  const toolbarSource = fs.readFileSync(path.resolve('src/pages/Edit/components/Toolbar.vue'), 'utf8')
  const configSource = fs.readFileSync(path.resolve('src/config/zh.js'), 'utf8')
  assert.ok(toolbarSource.includes('EXPAND_ALL'))
  assert.ok(toolbarSource.includes('UNEXPAND_ALL'))
  assert.ok(toolbarSource.includes('FIT_CANVAS'))
  assert.ok(toolbarSource.includes('RETURN_CENTER'))
  assert.ok(toolbarSource.includes('selectAttachment'))
  assert.ok(configSource.includes('展开全部主题'))
  assert.ok(configSource.includes('收起全部主题'))
  assert.ok(configSource.includes('适应画布'))
  assert.ok(configSource.includes('回到根节点'))
})


test('思维导图编辑器提供多画布工作簿标签栏', () => {
  const editSource = fs.readFileSync(path.resolve('src/pages/Edit/components/Edit.vue'), 'utf8')
  const serviceSource = fs.readFileSync(path.resolve('src/services/mindmapWorkbook.js'), 'utf8')
  const langSource = fs.readFileSync(path.resolve('src/lang/index.js'), 'utf8')
  assert.ok(editSource.includes('mindmapSheetBar'))
  assert.ok(editSource.includes('switchMindmapSheetById'))
  assert.ok(serviceSource.includes('ensureMindmapWorkbook'))
  assert.ok(langSource.includes('sheetSwitched') || langSource.includes('sheetAdded'))
})


test('思维导图支持 Ctrl+Tab 切换画布', () => {
  const toolbarSource = fs.readFileSync(path.resolve('src/pages/Edit/components/Toolbar.vue'), 'utf8')
  const editSource = fs.readFileSync(path.resolve('src/pages/Edit/components/Edit.vue'), 'utf8')
  assert.ok(toolbarSource.includes('mindmapNextSheet'))
  assert.ok(toolbarSource.includes('mindmapPrevSheet'))
  assert.ok(editSource.includes('handleMindmapNextSheet'))
  assert.ok(editSource.includes('handleMindmapPrevSheet'))
})


test('多画布标签栏在专注模式下隐藏，并支持 Ctrl+T 新建', () => {
  const editSource = fs.readFileSync(path.resolve('src/pages/Edit/components/Edit.vue'), 'utf8')
  const toolbarSource = fs.readFileSync(path.resolve('src/pages/Edit/components/Toolbar.vue'), 'utf8')
  assert.ok(editSource.includes('mindmapSheets.length && !isZenMode'))
  assert.ok(toolbarSource.includes('mindmapAddSheet'))
  assert.ok(toolbarSource.includes("event.key?.toLowerCase() === 't'"))
})


test('storeData 在局部 root 更新时保留多画布 sheets', () => {
  const apiSource = fs.readFileSync(path.resolve('src/api/index.js'), 'utf8')
  assert.ok(apiSource.includes('workbook-aware merge'))
  assert.ok(apiSource.includes('activeSheetId'))
})


test('思维导图画布标签支持拖拽排序', () => {
  const editSource = fs.readFileSync(path.resolve('src/pages/Edit/components/Edit.vue'), 'utf8')
  assert.ok(editSource.includes('onSheetDragStart'))
  assert.ok(editSource.includes('onSheetDrop'))
  assert.ok(editSource.includes('draggable="true"'))
})


test('思维导图支持 Shift+F2 重命名当前画布', () => {
  const toolbarSource = fs.readFileSync(path.resolve('src/pages/Edit/components/Toolbar.vue'), 'utf8')
  const editSource = fs.readFileSync(path.resolve('src/pages/Edit/components/Edit.vue'), 'utf8')
  assert.ok(toolbarSource.includes('mindmapRenameActiveSheet'))
  assert.ok(editSource.includes('handleMindmapRenameActiveSheet'))
})


test('思维导图搜索可命中其他画布结果', () => {
  const searchSource = fs.readFileSync(path.resolve('src/pages/Edit/components/Search.vue'), 'utf8')
  assert.ok(searchSource.includes('collectWorkbookSheetMatches'))
  assert.ok(searchSource.includes('jumpToCrossSheetResult'))
  assert.ok(searchSource.includes('isCrossSheet'))
})
