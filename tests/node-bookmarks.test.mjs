import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const root = path.resolve('.')
const serviceSource = fs.readFileSync(
  path.join(root, 'src/services/nodeBookmarks.js'),
  'utf8'
)
const sidebarSource = fs.readFileSync(
  path.join(root, 'src/pages/Edit/components/BookmarkSidebar.vue'),
  'utf8'
)
const editSource = fs.readFileSync(
  path.join(root, 'src/pages/Edit/components/Edit.vue'),
  'utf8'
)
const toolbarSource = fs.readFileSync(
  path.join(root, 'src/pages/Edit/components/Toolbar.vue'),
  'utf8'
)
const zhSource = fs.readFileSync(path.join(root, 'src/config/zh.js'), 'utf8')
const langSource = fs.readFileSync(path.join(root, 'src/lang/index.js'), 'utf8')

test('书签服务支持 star 图标切换与跨画布收集', async () => {
  assert.match(serviceSource, /DEFAULT_BOOKMARK_ICON/)
  assert.match(serviceSource, /toggleNodeBookmark/)
  assert.match(serviceSource, /collectBookmarksFromWorkbook/)

  const mod = await import(
    pathToFileURL(path.join(root, 'src/services/nodeBookmarks.js')).href
  )
  assert.deepEqual(mod.toggleBookmarkIcons(['priority_1']), [
    'priority_1',
    'star_0'
  ])
  assert.deepEqual(mod.toggleBookmarkIcons(['priority_1', 'star_0']), [
    'priority_1'
  ])

  const workbook = {
    activeSheetId: 's1',
    sheets: [
      {
        id: 's1',
        name: '画布 1',
        root: {
          data: { text: 'root', uid: 'r1' },
          children: [
            {
              data: {
                text: '收藏点',
                uid: 'n1',
                icon: ['star_0']
              },
              children: []
            }
          ]
        }
      }
    ]
  }
  const list = mod.collectBookmarksFromWorkbook(workbook)
  assert.equal(list.length, 1)
  assert.equal(list[0].uid, 'n1')
  assert.equal(list[0].sheetName, '画布 1')
})

test('书签侧栏与入口已接入编辑页/工具栏/触发器', () => {
  assert.match(sidebarSource, /BookmarkSidebar/)
  assert.match(sidebarSource, /collectBookmarksFromWorkbook/)
  assert.match(sidebarSource, /toggleSelected/)
  assert.match(editSource, /BookmarkSidebar/)
  assert.match(editSource, /activeSidebar === 'bookmark'/)
  assert.match(toolbarSource, /toggleSelectedBookmark/)
  assert.match(toolbarSource, /Alt\+Shift\+B/)
  assert.match(toolbarSource, /setActiveSidebar\('bookmark'\)/)
  assert.match(zhSource, /value: 'bookmark'/)
  assert.match(langSource, /"bookmark":\s*\{/)
  assert.match(langSource, /"toggle": "切换收藏"/)
})
