import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const attachmentServiceSource = fs.readFileSync(
  path.resolve('src/services/nodeAttachment.js'),
  'utf8'
)
const toolbarSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/Toolbar.vue'),
  'utf8'
)
const platformSource = fs.readFileSync(
  path.resolve('src/platform/desktop/index.js'),
  'utf8'
)
const mainRsSource = fs.readFileSync(
  path.resolve('src-tauri/src/main.rs'),
  'utf8'
)
const configRsSource = fs.readFileSync(
  path.resolve('src-tauri/src/commands/config.rs'),
  'utf8'
)
const noteShowSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/NodeNoteContentShow.vue'),
  'utf8'
)
const searchSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/Search.vue'),
  'utf8'
)
const langSource = fs.readFileSync(path.resolve('src/lang/index.js'), 'utf8')

test('节点附件服务提供挂载/清理/读取 helper', () => {
  assert.match(attachmentServiceSource, /export const applyAttachmentToNodes/)
  assert.match(attachmentServiceSource, /export const clearAttachmentFromNodes/)
  assert.match(attachmentServiceSource, /export const getAttachmentFromNode/)
  assert.match(attachmentServiceSource, /setNodeAttachment/)
})

test('工具栏默认按钮包含附件，并监听选择/打开/删除事件', () => {
  assert.match(toolbarSource, /'attachment'/)
  assert.match(toolbarSource, /\$bus\.\$on\('selectAttachment'/)
  assert.match(toolbarSource, /\$bus\.\$on\('node_attachmentClick'/)
  assert.match(toolbarSource, /\$bus\.\$on\('node_attachmentContextmenu'/)
  assert.match(toolbarSource, /async onSelectAttachment/)
  assert.match(toolbarSource, /async onAttachmentClick/)
  assert.match(toolbarSource, /async onAttachmentContextmenu/)
  assert.match(toolbarSource, /platform\.pickOpenFile/)
  assert.match(toolbarSource, /platform\.openLocalPath/)
})

test('桌面平台支持选择本地文件与打开本地路径', () => {
  assert.match(platformSource, /async pickOpenFile/)
  assert.match(platformSource, /async openLocalPath/)
  assert.match(platformSource, /open_local_path/)
  assert.match(mainRsSource, /commands::config::open_local_path/)
  assert.match(configRsSource, /pub async fn open_local_path/)
  assert.match(configRsSource, /仅支持打开绝对路径的本地文件/)
})

test('备注浮层支持编辑入口与暗色样式', () => {
  assert.match(noteShowSource, /openNoteEditor/)
  assert.match(noteShowSource, /noteEditBtn/)
  assert.match(noteShowSource, /node_note_dblclick/)
  assert.match(noteShowSource, /isDark/)
  assert.match(langSource, /"edit": "编辑"/)
})

test('跨画布搜索结果携带 nodeUid 并支持跳转后定位', () => {
  assert.match(searchSource, /nodeUid: data\.uid/)
  assert.match(searchSource, /jumpToCrossSheetResult/)
  assert.match(searchSource, /tryJumpByUid/)
})
