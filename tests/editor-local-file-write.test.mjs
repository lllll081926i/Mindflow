import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve('.')
const sessionSource = fs.readFileSync(
  path.join(root, 'src/pages/Edit/components/editorLocalFileSession.js'),
  'utf8'
)
const toolbarSource = fs.readFileSync(
  path.join(root, 'src/pages/Edit/components/Toolbar.vue'),
  'utf8'
)
const aiCreateSource = fs.readFileSync(
  path.join(root, 'src/pages/Edit/components/AiCreate.vue'),
  'utf8'
)
const contextmenuSource = fs.readFileSync(
  path.join(root, 'src/pages/Edit/components/Contextmenu.vue'),
  'utf8'
)
const outlineSource = fs.readFileSync(
  path.join(root, 'src/pages/Edit/components/Outline.vue'),
  'utf8'
)

test('本地保存核心链路已抽到 editorLocalFileSession', () => {
  assert.match(sessionSource, /export const performLocalMindMapWrite/)
  assert.match(sessionSource, /export const buildRecoveryDraftWriteArgs/)
  assert.match(sessionSource, /serializeMindMapWriteContent/)
  assert.match(sessionSource, /clearRecoveryDraft/)
  assert.match(sessionSource, /markDocumentDirty/)
  assert.match(toolbarSource, /performLocalMindMapWrite/)
  assert.match(toolbarSource, /buildRecoveryDraftWriteArgs/)
  assert.match(
    toolbarSource,
    /核心链路见 editorLocalFileSession\.performLocalMindMapWrite/
  )
})

test('AI 生成完成后进入预览确认而非直接定稿', () => {
  assert.match(aiCreateSource, /previewApplyVisible/)
  assert.match(aiCreateSource, /openAiPreviewApply/)
  assert.match(aiCreateSource, /applyAiPreview/)
  assert.match(aiCreateSource, /discardAiPreview/)
  assert.match(aiCreateSource, /aiPreviewBar/)
  assert.match(aiCreateSource, /\$t\('ai\.applyPreview'\)|applyPreview/)
})

test('右键菜单与大纲支持书签收藏与星标展示', () => {
  assert.match(contextmenuSource, /toggleBookmark/)
  assert.match(contextmenuSource, /nodeBookmarked/)
  assert.match(contextmenuSource, /toggleNodesBookmark/)
  assert.match(outlineSource, /bookmarkStar/)
  assert.match(outlineSource, /bookmarked/)
  assert.match(outlineSource, /isBookmarkIcon/)
})
