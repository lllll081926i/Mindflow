import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

test('多页转换服务已接入导图/流程图转换入口', () => {
  const convertSource = fs.readFileSync(
    path.resolve('src/services/documentConvert.js'),
    'utf8'
  )
  const toolbarSource = fs.readFileSync(
    path.resolve('src/pages/Edit/components/Toolbar.vue'),
    'utf8'
  )
  const documentSource = fs.readFileSync(
    path.resolve('src/pages/Edit/components/flowchartEditorDocument.js'),
    'utf8'
  )
  assert.ok(convertSource.includes('convertMindmapWorkbookToFlowchartWorkbook'))
  assert.ok(convertSource.includes('convertFlowchartWorkbookToMindmapWorkbook'))
  assert.ok(toolbarSource.includes('convertMindmapWorkbookToFlowchartWorkbook'))
  assert.ok(documentSource.includes('convertMindmapWorkbookToFlowchartWorkbook'))
  assert.ok(documentSource.includes('convertFlowchartWorkbookToMindmapWorkbook'))
  assert.ok(toolbarSource.includes('convert multi confirm') || toolbarSource.includes('convertMultiSheetConfirm') || toolbarSource.includes('sheetCount'))
  assert.ok(documentSource.includes('pageCount') || documentSource.includes('convert multi page confirm'))
})
