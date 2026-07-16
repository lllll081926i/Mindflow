import test from 'node:test'
import assert from 'node:assert/strict'
import {
  isFreemindXml,
  parseFreemindXml
} from '../src/services/freemindParse.js'

test('识别 FreeMind / Freeplane XML', () => {
  assert.equal(isFreemindXml('<map><node TEXT="A"/></map>'), true)
  assert.equal(isFreemindXml('{"root":{}}'), false)
})

test('解析 FreeMind 节点树、备注与链接', () => {
  const xml = `<?xml version="1.0"?>
<map version="1.0.1">
<node TEXT="中心主题">
  <node TEXT="分支 A">
    <node TEXT="细节 1"/>
    <node TEXT="细节 2" LINK="https://example.com"/>
  </node>
  <node TEXT="分支 B">
    <richcontent TYPE="NOTE"><html><body><p>备注内容</p></body></html></richcontent>
  </node>
</node>
</map>`
  const data = parseFreemindXml(xml)
  assert.equal(data.root.data.text, '中心主题')
  assert.equal(data.root.children.length, 2)
  assert.equal(data.root.children[0].children.length, 2)
  assert.equal(data.root.children[0].children[1].data.hyperlink, 'https://example.com')
  assert.equal(data.root.children[1].data.note, '备注内容')
  assert.equal(data.root.data.note || '', '')
})
