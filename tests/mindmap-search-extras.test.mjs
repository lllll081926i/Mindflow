import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve('.')
const extrasSource = fs.readFileSync(
  path.join(root, 'src/services/mindmapSearchExtras.js'),
  'utf8'
)
const searchSource = fs.readFileSync(
  path.join(root, 'src/pages/Edit/components/Search.vue'),
  'utf8'
)
const langSource = fs.readFileSync(path.join(root, 'src/lang/index.js'), 'utf8')

test('搜索扩展支持备注/标签/批注字段匹配', () => {
  assert.match(extrasSource, /export const matchNodeSearchFields/)
  assert.match(extrasSource, /export const walkMindMapSearchMatches/)
  assert.match(extrasSource, /field: 'note'/)
  assert.match(extrasSource, /field: 'tag'/)
  assert.match(extrasSource, /field: 'comment'/)
})

test('Search 面板接入元数据命中与类型文案', () => {
  assert.match(searchSource, /walkMindMapSearchMatches/)
  assert.match(searchSource, /collectCurrentSheetMetaMatches/)
  assert.match(searchSource, /isMetaMatch/)
  assert.match(searchSource, /fieldLabel/)
  assert.match(searchSource, /jumpToNodeUid/)
  assert.match(langSource, /"fieldNote"/)
  assert.match(langSource, /"fieldTag"/)
  assert.match(langSource, /"fieldComment"/)
})
