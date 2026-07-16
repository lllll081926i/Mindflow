import platform, {
  getBootstrapState,
  recordRecentFile,
  saveBootstrapStatePatch
} from '@/platform'
import {
  createDesktopFsError,
  flushDocumentSessionSync,
  getCurrentFileRef,
  getLastDirectory,
  markDocumentDirty,
  setCurrentFileRef,
  updateCurrentFileRef
} from '@/services/documentSession'
import {
  clearRecoveryDraftForFile,
  resolveFileContentWithRecovery,
  writeRecoveryDraftForFile
} from '@/services/recoveryStorage'
import {
  createDefaultFlowchartData,
  convertMindMapToFlowchart,
  convertFlowchartToMindMap,
  hasConvertibleFlowchartData,
  normalizeFlowchartAiResult,
  parseStoredDocumentContent,
  serializeStoredDocumentContent
} from '@/services/flowchartDocument'
import xmind from 'simple-mind-map/src/parse/xmind.js'
import markdown from 'simple-mind-map/src/parse/markdown.js'
import { parseFreemindFile, isFreemindXml } from '@/services/freemindParse'
import {
  FLOWCHART_AUTO_SAVE_INTERVAL,
  cloneJson,
  hasConvertibleMindMapData
} from './flowchartEditorShared'

export const flowchartDocumentMethods = {
  queueInteractiveFlowchartPersist(options = {}) {
    const nextOptions = {
      dirty: true,
      autoSave: true,
      recordHistory: true,
      delay: 160,
      ...options
    }
    this.interactivePersistOptions = nextOptions
    if (this.interactivePersistTimer) {
      clearTimeout(this.interactivePersistTimer)
    }
    this.interactivePersistTimer = window.setTimeout(() => {
      const pendingOptions = this.interactivePersistOptions
      this.interactivePersistTimer = 0
      this.interactivePersistOptions = null
      if (!pendingOptions) {
        return
      }
      const { delay: _delay, ...persistOptions } = pendingOptions
      void this.persistFlowchartState(persistOptions)
    }, nextOptions.delay)
  },

  async flushInteractiveFlowchartPersist() {
    if (!this.interactivePersistTimer || !this.interactivePersistOptions) {
      return
    }
    clearTimeout(this.interactivePersistTimer)
    this.interactivePersistTimer = 0
    const pendingOptions = this.interactivePersistOptions
    this.interactivePersistOptions = null
    const { delay: _delay, ...persistOptions } = pendingOptions
    await this.persistFlowchartState(persistOptions)
  },

  async persistFlowchartState({
    dirty = true,
    autoSave = true,
    recordHistory = true
  } = {}) {
    if (this.interactivePersistTimer) {
      clearTimeout(this.interactivePersistTimer)
      this.interactivePersistTimer = 0
    }
    this.interactivePersistOptions = null
    this.syncEdgeToolbarState()
    if (recordHistory) {
      this.commitFlowchartHistorySnapshot()
    }
    await this.ensureFlowchartDocumentSession()
    await saveBootstrapStatePatch({
      flowchartData: cloneJson(this.flowchartData),
      flowchartConfig: cloneJson(this.flowchartConfig)
    })
    markDocumentDirty(dirty)
    await flushDocumentSessionSync()
    if (dirty && this.currentDocument?.path) {
      this.queueRecoveryDraftWrite()
    }
    if (autoSave && this.currentDocument?.path) {
      this.queueAutoSave()
    }
  },

  async ensureFlowchartDocumentSession() {
    const path = String(this.currentDocument?.path || '').trim()
    if (!path) {
      return
    }
    const nextFileRef = {
      ...this.currentDocument,
      path,
      documentMode: 'flowchart',
      isFullDataFile: true
    }
    const currentFileRef = getCurrentFileRef()
    const currentPath = String(currentFileRef?.path || '').trim()
    if (!currentPath || currentPath !== path) {
      setCurrentFileRef(nextFileRef, this.currentDocument.source || 'desktop')
      await flushDocumentSessionSync()
      return
    }
    if (
      currentFileRef.documentMode !== 'flowchart' ||
      !currentFileRef.isFullDataFile
    ) {
      updateCurrentFileRef({
        documentMode: 'flowchart',
        isFullDataFile: true
      })
      await flushDocumentSessionSync()
    }
  },

  queueRecoveryDraftWrite() {
    if (this.recoveryTimer) {
      clearTimeout(this.recoveryTimer)
    }
    this.recoveryTimer = window.setTimeout(() => {
      this.recoveryTimer = 0
      void this.writeRecoveryDraft()
    }, 800)
  },

  async writeRecoveryDraft() {
    if (!this.currentDocument?.path) {
      return
    }
    try {
      await writeRecoveryDraftForFile({
        fileRef: {
          ...this.currentDocument,
          documentMode: 'flowchart'
        },
        data: cloneJson(this.flowchartData),
        config: cloneJson(this.flowchartConfig),
        isFullDataFile: true,
        documentMode: 'flowchart'
      })
    } catch (error) {
      console.error('writeFlowchartRecoveryDraft failed', error)
    }
  },

  queueAutoSave() {
    if (this.persistTimer) {
      clearTimeout(this.persistTimer)
    }
    this.persistTimer = window.setTimeout(() => {
      this.persistTimer = 0
      void this.saveCurrentFile({
        silent: true
      }).catch(error => {
        console.error('autoSaveFlowchart failed', error)
      })
    }, FLOWCHART_AUTO_SAVE_INTERVAL)
  },

  async confirmPotentialFlowchartLeave() {
    if (!this.hasPotentialUnsavedFlowchart) {
      return true
    }
    try {
      await this.$confirm(
        this.$t('toolbar.leaveConfirmReturnHomeMessage'),
        this.$t('toolbar.leaveConfirmReturnHomeTitle'),
        {
          type: 'warning'
        }
      )
      return true
    } catch (_error) {
      return false
    }
  },

  onBeforeUnload(event) {
    if (!this.hasPotentialUnsavedFlowchart) {
      return undefined
    }
    const message = this.$t('toolbar.unsavedData')
    event.returnValue = message
    return message
  },

  resetTransientFlowchartInteractionState() {
    this.cancelConnectorDrag()
    this.cancelEdgeReconnect()
    this.cancelEdgeBendDrag()
    this.cancelEdgeLabelDrag()
    this.dragState = null
    this.pendingDragPoint = null
    this.edgeDirectionLockMap = null
    this.removeDragListeners()
    this.canvasPanState = null
    this.pendingCanvasPanPoint = null
    this.removeCanvasPanListeners()
    this.selectionState = null
    this.removeAreaSelectionListeners()
    this.resizeState = null
    this.removeNodeResizeListeners()
    this.clearAlignmentGuides()
  },

  async requestApplyTemplate(templateId = 'blank') {
    try {
      await this.$confirm(
        this.$t('flowchart.templateReplaceConfirmMessage'),
        this.$t('flowchart.templateReplaceConfirmTitle'),
        {
          type: 'warning'
        }
      )
    } catch (_error) {
      return false
    }
    this.applyTemplate(templateId)
    return true
  },

  applyTemplate(templateId = 'blank') {
    this.resetTransientFlowchartInteractionState()
    this.flowchartData = createDefaultFlowchartData(
      this.flowchartData.title || this.$t('flowchart.fileNameFallback'),
      templateId
    )
    this.selectedNodeIds = []
    this.selectedEdgeId = ''
    this.edgeToolbarState = null
    this.inlineTextEditorState = null
    this.$nextTick(() => {
      this.fitCanvasToView({
        persist: false
      })
      void this.persistFlowchartState()
    })
    this.$message.success(this.$t('flowchart.templateApplied'))
  },

  async openExportCenter() {
    await this.flushInteractiveFlowchartPersist()
    await this.persistFlowchartState({
      dirty: !!this.currentDocument?.dirty,
      autoSave: false,
      recordHistory: false
    })
    await this.$router.push('/export')
  },

  convertCurrentMindMap() {
    const bootstrapState = getBootstrapState()
    if (!hasConvertibleMindMapData(bootstrapState.mindMapData)) {
      this.$message.warning(this.$t('flowchart.noMindMapToConvert'))
      return
    }
    const nextDocument = convertMindMapToFlowchart(bootstrapState.mindMapData, {
      title: this.flowchartData.title || this.$t('flowchart.fileNameFallback')
    })
    this.applyGeneratedFlowchart(nextDocument)
    this.$message.success(this.$t('flowchart.mindMapConverted'))
  },

  async convertCurrentFlowchartToMindMap() {
    if (!hasConvertibleFlowchartData(this.flowchartData)) {
      this.$message.warning(this.$t('flowchart.noFlowchartToConvert'))
      return
    }
    try {
      await this.flushInteractiveFlowchartPersist()
      const title =
        String(this.flowchartData?.title || '').trim() ||
        this.$t('flowchart.fileNameFallback')
      const mindMapData = convertFlowchartToMindMap(this.flowchartData, { title })
      await saveBootstrapStatePatch({
        mindMapData: cloneJson(mindMapData),
        mindMapConfig: null,
        flowchartData: null,
        flowchartConfig: null
      })
      const baseRef = this.currentDocument
        ? { ...this.currentDocument }
        : {
            path: '',
            name: title + '.smm',
            isFullDataFile: true
          }
      setCurrentFileRef(
        {
          ...baseRef,
          documentMode: 'mindmap',
          isFullDataFile: true
        },
        baseRef.source || 'desktop'
      )
      markDocumentDirty(true)
      await flushDocumentSessionSync()
      this.$message.success(this.$t('flowchart.flowchartConverted'))
      if (this.$route.path !== '/edit') {
        await this.$router.push('/edit')
      }
    } catch (error) {
      console.error('convertCurrentFlowchartToMindMap failed', error)
      this.$message.error(error?.message || this.$t('home.actionFailed'))
    }
  },

  async importMindMapFile() {
    try {
      const fileRef = await platform.openMindMapFile({
        defaultPath: getLastDirectory()
      })
      if (!fileRef) return
      await this.importMindMapContent(fileRef.content, fileRef)
    } catch (error) {
      const normalizedError = createDesktopFsError(error)
      this.$message.error(
        normalizedError.message || this.$t('flowchart.importMindMapFileFailed')
      )
    }
  },

  async importMindMapFileFromBlob(file) {
    if (!file) return
    const name = String(file.name || '').toLowerCase()

    if (/\.xmind$/.test(name)) {
      const mindMapData = await xmind.parseXmindFile(file, async content => {
        if (!Array.isArray(content) || content.length <= 1) {
          return Array.isArray(content) ? content[0] : content
        }
        if (typeof this.selectXmindCanvas === 'function') {
          const selected = await this.selectXmindCanvas(content)
          return selected || content[0]
        }
        return content[0]
      })
      if (!hasConvertibleMindMapData(mindMapData)) {
        this.$message.warning(this.$t('flowchart.importMindMapFileInvalid'))
        return
      }
      const nextDocument = convertMindMapToFlowchart(mindMapData, {
        title: this.flowchartData.title || this.$t('flowchart.fileNameFallback')
      })
      this.applyGeneratedFlowchart(nextDocument)
      this.$message.success(this.$t('flowchart.importMindMapFileDone'))
      return
    }

    if (/\.md$/.test(name)) {
      const text = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onerror = () =>
          reject(new Error(this.$t('flowchart.importMindMapFileFailed')))
        reader.onload = () => resolve(String(reader.result || ''))
        reader.readAsText(file)
      })
      const mindMapData = markdown.transformMarkdownTo(text)
      if (!hasConvertibleMindMapData(mindMapData)) {
        this.$message.warning(this.$t('flowchart.importMindMapFileInvalid'))
        return
      }
      const nextDocument = convertMindMapToFlowchart(mindMapData, {
        title: this.flowchartData.title || this.$t('flowchart.fileNameFallback')
      })
      this.applyGeneratedFlowchart(nextDocument)
      this.$message.success(this.$t('flowchart.importMindMapFileDone'))
      return
    }

    if (/.mm$/.test(name)) {
      const mindMapData = await parseFreemindFile(file)
      if (!hasConvertibleMindMapData(mindMapData)) {
        this.$message.warning(this.$t('flowchart.importMindMapFileInvalid'))
        return
      }
      const nextDocument = convertMindMapToFlowchart(mindMapData, {
        title: this.flowchartData.title || this.$t('flowchart.fileNameFallback')
      })
      this.applyGeneratedFlowchart(nextDocument)
      this.$message.success(this.$t('flowchart.importMindMapFileDone'))
      return
    }

    const content = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onerror = () =>
        reject(new Error(this.$t('flowchart.importMindMapFileFailed')))
      reader.onload = () => resolve(String(reader.result || ''))
      reader.readAsText(file)
    })
    await this.importMindMapContent(content, {
      name: file.name || this.$t('flowchart.fileNameFallback')
    })
  },

  async importMindMapContent(content, fileRef = null) {
    const resolved = await resolveFileContentWithRecovery(fileRef || {}, content)
    let mindMapData
    try {
      const parsedDocument = parseStoredDocumentContent(resolved.content)
      if (parsedDocument.documentMode === 'flowchart') {
        this.$message.warning(this.$t('flowchart.importMindMapFileInvalid'))
        return
      }
      mindMapData = parsedDocument.mindMapData
    } catch (_error) {
      const raw =
        typeof resolved.content === 'string'
          ? resolved.content
          : ''
      if (raw && isFreemindXml(raw)) {
        mindMapData = await parseFreemindFile(raw)
      } else {
        const parsed =
          typeof resolved.content === 'string'
            ? JSON.parse(resolved.content)
            : resolved.content
        mindMapData = parsed?.root ? parsed : parsed?.mindMapData || parsed
      }
    }
    if (!hasConvertibleMindMapData(mindMapData)) {
      this.$message.warning(this.$t('flowchart.importMindMapFileInvalid'))
      return
    }
    const nextDocument = convertMindMapToFlowchart(mindMapData, {
      title: this.flowchartData.title || this.$t('flowchart.fileNameFallback')
    })
    this.applyGeneratedFlowchart(nextDocument)
    this.$message.success(this.$t('flowchart.importMindMapFileDone'))
  },

  applyGeneratedFlowchart(result) {
    const normalized = normalizeFlowchartAiResult(result)
    this.resetTransientFlowchartInteractionState()
    this.flowchartData = cloneJson(normalized.flowchartData)
    const nextFlowchartConfig = {
      snapToGrid: false,
      gridSize: 24,
      themeId: this.flowchartConfig?.themeId || 'blueprint',
      strictAlignment: false,
      backgroundStyle: this.flowchartConfig?.backgroundStyle || 'grid',
      ...cloneJson(normalized.flowchartConfig || {})
    }
    nextFlowchartConfig.snapToGrid = false
    nextFlowchartConfig.themeId = this.flowchartConfig?.themeId || 'blueprint'
    nextFlowchartConfig.backgroundStyle = ['grid', 'dots'].includes(
      nextFlowchartConfig.backgroundStyle
    )
      ? nextFlowchartConfig.backgroundStyle
      : 'none'
    this.flowchartConfig = nextFlowchartConfig
    this.selectedNodeIds = []
    this.selectedEdgeId = ''
    this.edgeToolbarState = null
    this.inlineTextEditorState = null
    this.closeInspector()
    this.$nextTick(() => {
      this.fitCanvasToView({
        persist: false
      })
      void this.persistFlowchartState()
    })
  },

  async saveCurrentFile({ silent = false } = {}) {
    try {
      await this.flushInteractiveFlowchartPersist()
      if (this.persistTimer) {
        clearTimeout(this.persistTimer)
        this.persistTimer = 0
      }
      if (!this.currentDocument?.path) {
        await this.saveAsFile({
          silent
        })
        return true
      }
      const serialized = this.serializeCurrentDocument()
      await platform.writeMindMapFile(
        {
          ...this.currentDocument,
          documentMode: 'flowchart'
        },
        serialized
      )
      await recordRecentFile({
        ...this.currentDocument,
        documentMode: 'flowchart'
      })
      setCurrentFileRef(
        {
          ...this.currentDocument,
          documentMode: 'flowchart',
          isFullDataFile: true
        },
        this.currentDocument.source || 'desktop'
      )
      if (this.recoveryTimer) {
        clearTimeout(this.recoveryTimer)
        this.recoveryTimer = 0
      }
      try {
        await clearRecoveryDraftForFile({
          ...this.currentDocument,
          documentMode: 'flowchart'
        })
      } catch (error) {
        console.error('clearFlowchartRecoveryDraft failed', error)
      }
      markDocumentDirty(false)
      if (!silent) {
        this.$message.success(this.$t('flowchart.saveSuccess'))
      }
      return true
    } catch (error) {
      const normalizedError = createDesktopFsError(error)
      if (!silent) {
        this.$message.error(normalizedError.message || this.$t('home.actionFailed'))
      } else {
        console.error('saveFlowchartCurrentFile failed', error)
      }
      return false
    }
  },

  async saveAsFile({ silent = false } = {}) {
    const previousFileRef = this.currentDocument
      ? {
          ...this.currentDocument,
          documentMode: 'flowchart'
        }
      : null
    try {
      await this.flushInteractiveFlowchartPersist()
      const { createWorkspaceFlowchartFile } = await import('@/services/workspaceActions')
      await createWorkspaceFlowchartFile({
        router: this.$router,
        content: cloneJson(this.flowchartData),
        config: cloneJson(this.flowchartConfig),
        suggestedName: this.getDocumentBaseName()
      })
      if (previousFileRef?.path) {
        try {
          await clearRecoveryDraftForFile(previousFileRef)
        } catch (error) {
          console.error('clearPreviousFlowchartRecoveryDraft failed', error)
        }
      }
      if (!silent) {
        this.$message.success(this.$t('flowchart.saveAsSuccess'))
      }
      return true
    } catch (error) {
      const normalizedError = createDesktopFsError(error)
      if (!silent) {
        this.$message.error(normalizedError.message || this.$t('home.actionFailed'))
      } else {
        console.error('saveFlowchartAsFile failed', error)
      }
      return false
    }
  },

  serializeCurrentDocument() {
    return serializeStoredDocumentContent({
      documentMode: 'flowchart',
      data: this.flowchartData,
      config: this.flowchartConfig
    })
  },

  getDocumentBaseName() {
    const raw = String(
      this.currentDocument?.name ||
        this.flowchartData.title ||
        this.$t('flowchart.fileNameFallback')
    ).trim()
    return raw.replace(/\.[^.]+$/u, '') || this.$t('flowchart.fileNameFallback')
  },

  async goHome() {
    await this.flushInteractiveFlowchartPersist()
    if (!(await this.confirmPotentialFlowchartLeave())) {
      return
    }
    await this.$router.push('/home')
  }
}
