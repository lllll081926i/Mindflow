import {
  parseStoredDocumentContent,
  serializeStoredDocumentContent
} from '@/services/flowchartDocument'

export const LOCAL_FILE_WRITE_DEBOUNCE_MS = 1000
export const RECOVERY_WRITE_DEBOUNCE_MS = 2500

export const snapshotLocalFileRef = fileRef => {
  if (!fileRef || typeof fileRef !== 'object') return null
  const path = String(fileRef.path || '').trim()
  if (!path) return null
  return {
    ...fileRef,
    path,
    name: String(fileRef.name || '').trim(),
    mode: String(fileRef.mode || 'desktop').trim() || 'desktop'
  }
}

export const isSameLocalFileRef = (left, right) => {
  const leftRef = snapshotLocalFileRef(left)
  const rightRef = snapshotLocalFileRef(right)
  if (!leftRef || !rightRef) return false
  return leftRef.path === rightRef.path && leftRef.mode === rightRef.mode
}

export const formatTimeLabel = timestamp => {
  const value = Number(timestamp || 0)
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

export const parseToolbarLocalFileContent = (str, invalidContentMessage) => {
  let parsedDocument
  try {
    parsedDocument = parseStoredDocumentContent(str)
  } catch (error) {
    throw new Error(invalidContentMessage, {
      cause: error
    })
  }
  if (parsedDocument.documentMode === 'flowchart') {
    return {
      documentMode: 'flowchart',
      data: parsedDocument.flowchartData,
      flowchartData: parsedDocument.flowchartData,
      flowchartConfig: parsedDocument.flowchartConfig || null,
      isFullDataFile: true,
      configData: parsedDocument.flowchartConfig || null
    }
  }
  return {
    documentMode: 'mindmap',
    data: parsedDocument.mindMapData,
    isFullDataFile: parsedDocument.isFullDataFile,
    configData: parsedDocument.mindMapConfig || null
  }
}

export const buildMindMapWritePayload = ({
  documentMode = 'mindmap',
  data,
  configData = null,
  flowchartData = null,
  flowchartConfig = null,
  isFullDataFile = true
} = {}) => {
  if (documentMode === 'flowchart') {
    return serializeStoredDocumentContent({
      documentMode: 'flowchart',
      flowchartData: flowchartData || data,
      flowchartConfig: flowchartConfig || configData
    })
  }
  return serializeStoredDocumentContent({
    documentMode: 'mindmap',
    data,
    mindMapData: data,
    mindMapConfig: configData,
    config: configData,
    isFullDataFile
  })
}


export const createLocalWriteTaskData = ({
  fileRef,
  content,
  isFullDataFile = true,
  configData = null,
  requestId
} = {}) => {
  const snapshot = snapshotLocalFileRef(fileRef)
  if (!snapshot) return null
  return {
    id: Number(requestId) || 0,
    fileRef: snapshot,
    content,
    isFullDataFile: !!isFullDataFile,
    configData: configData || null
  }
}

export const hasPendingLocalWriteState = ({
  timer = null,
  currentLocalFileWriteRequestId = 0,
  localFileWriteRequestId = 0,
  completedLocalFileWriteRequestId = 0,
  requestId = 0
} = {}) => {
  const completedRequestId = Math.max(
    Number(completedLocalFileWriteRequestId) || 0,
    Number(requestId) || 0
  )
  return (
    !!timer ||
    Number(currentLocalFileWriteRequestId) > completedRequestId ||
    Number(localFileWriteRequestId) > completedRequestId
  )
}

export const serializeMindMapWriteContent = ({
  content,
  configData = null,
  isFullDataFile = true
} = {}) => {
  return serializeStoredDocumentContent({
    documentMode: 'mindmap',
    mindMapData: content,
    mindMapConfig: configData,
    isFullDataFile: !!isFullDataFile
  })
}

/**
 * Core local mind-map write pipeline extracted from Toolbar.
 * Keeps recovery draft cleanup and dirty-flag transitions centralized.
 *
 * Note: recovery cleanup runs on successful write of THIS task. Callers should
 * still recompute waitingWriteToLocalFile after updating request id counters.
 */
export const performLocalMindMapWrite = async ({
  writeTask,
  writeMindMapFile,
  recordRecentFile,
  clearRecoveryDraft,
  markDocumentDirty,
  onSuccess,
  onError,
  fileSaveFailedMessage = '保存失败'
} = {}) => {
  if (!writeTask) {
    return {
      writeSucceeded: false
    }
  }

  let writeSucceeded = false
  try {
    const string = serializeMindMapWriteContent({
      content: writeTask.content,
      configData: writeTask.configData,
      isFullDataFile: writeTask.isFullDataFile
    })
    await writeMindMapFile(writeTask.fileRef, string)
    if (typeof recordRecentFile === 'function') {
      await recordRecentFile(writeTask.fileRef)
    }
    writeSucceeded = true
    if (typeof onSuccess === 'function') {
      onSuccess(writeTask)
    }
    try {
      if (typeof clearRecoveryDraft === 'function') {
        await clearRecoveryDraft(writeTask.fileRef)
      }
    } catch (_error) {
      // recovery cleanup failure should not mark save as failed
    }
    if (typeof markDocumentDirty === 'function') {
      markDocumentDirty(false)
    }
  } catch (error) {
    if (typeof onError === 'function') {
      onError(error, writeTask)
    } else {
      throw error
    }
  }

  return {
    writeSucceeded,
    fileSaveFailedMessage
  }
}

export const buildRecoveryDraftWriteArgs = ({
  writeTask,
  config = null
} = {}) => {
  if (!writeTask?.fileRef || !writeTask.content) {
    return null
  }
  return {
    fileRef: writeTask.fileRef,
    data: writeTask.content,
    config,
    isFullDataFile: writeTask.isFullDataFile
  }
}
