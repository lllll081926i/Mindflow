import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve('.')
const toolbar = fs.readFileSync(path.join(root, 'src/pages/Edit/components/Toolbar.vue'), 'utf8')
const demo = fs.readFileSync(path.join(root, 'src/pages/Edit/components/Demonstrate.vue'), 'utf8')
const lang = fs.readFileSync(path.join(root, 'src/lang/index.js'), 'utf8')
const schema = fs.readFileSync(path.join(root, 'src/platform/shared/configSchema.js'), 'utf8')

test('命令面板支持折叠到层级并记忆 lastExpandLevel', () => {
  assert.match(toolbar, /expandToPreferredLevel/)
  assert.match(toolbar, /lastExpandLevel/)
  assert.match(toolbar, /UNEXPAND_TO_LEVEL/)
  assert.match(schema, /lastExpandLevel:\s*2/)
  assert.match(lang, /"expandToLevelDone"/)
})

test('附件缺失有专用提示文案', () => {
  assert.match(toolbar, /attachment\.missingFile/)
  assert.match(lang, /"missingFile"/)
})

test('演示模式展示演讲者备注', () => {
  assert.match(demo, /speakerNotes/)
  assert.match(demo, /resolveSpeakerNote/)
  assert.match(demo, /speakerNote/)
  assert.match(lang, /"speakerNotes"/)
})

test('流程图支持缩放到选中', () => {
  const viewport = fs.readFileSync(path.join(root, 'src/pages/Edit/components/flowchartEditorViewport.js'), 'utf8')
  const editor = fs.readFileSync(path.join(root, 'src/pages/Edit/components/FlowchartEditor.vue'), 'utf8')
  assert.match(viewport, /fitSelectionToView/)
  assert.match(editor, /fitSelectionToView/)
})

test('支持复制主题路径', () => {
  const pathService = fs.readFileSync(path.join(root, 'src/services/mindmapPath.js'), 'utf8')
  const menu = fs.readFileSync(path.join(root, 'src/pages/Edit/components/Contextmenu.vue'), 'utf8')
  assert.match(pathService, /buildMindMapNodePath/)
  assert.match(menu, /copyNodePath/)
  assert.match(lang, /"copyNodePath"/)
})

test('可复制分支为 Markdown', () => {
  const service = fs.readFileSync(path.join(root, 'src/services/mindmapBranchMarkdown.js'), 'utf8')
  const menu = fs.readFileSync(path.join(root, 'src/pages/Edit/components/Contextmenu.vue'), 'utf8')
  assert.match(service, /branchToMarkdown/)
  assert.match(menu, /copyBranchMarkdown/)
  assert.match(lang, /"copyBranchMarkdown"/)
})

test('单选备注迷你预览条', () => {
  const edit = fs.readFileSync(path.join(root, 'src/pages/Edit/components/Edit.vue'), 'utf8')
  assert.match(edit, /selectedNoteStrip/)
  assert.match(edit, /updateSelectedNotePreview/)
  assert.match(edit, /openSelectedNote/)
})
