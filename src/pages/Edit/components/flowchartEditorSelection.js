import { FLOWCHART_INTERACTION_CLICK_GUARD_MS } from './flowchartEditorShared'

export const flowchartSelectionMethods = {
  suppressPointerClick(duration = FLOWCHART_INTERACTION_CLICK_GUARD_MS) {
    this.interactionClickGuardUntil = Date.now() + Math.max(0, Number(duration || 0))
  },

  hasSuppressedPointerClick() {
    return Number(this.interactionClickGuardUntil || 0) > Date.now()
  },

  selectNode(nodeId, event) {
    if (this.hasSuppressedPointerClick()) {
      return
    }
    this.cancelConnectorDrag()
    this.cancelEdgeReconnect()
    this.cancelEdgeBendDrag()
    this.cancelEdgeLabelDrag()
    if (
      this.inlineTextEditorState &&
      !(this.inlineTextEditorState.kind === 'node' && this.inlineTextEditorState.id === nodeId)
    ) {
      void this.commitInlineTextEditor()
    }
    const isAppend = !!(event?.shiftKey || event?.ctrlKey || event?.metaKey)
    if (isAppend) {
      const nextIds = this.selectedNodeIds.includes(nodeId)
        ? this.selectedNodeIds.filter(id => id !== nodeId)
        : [...this.selectedNodeIds, nodeId]
      this.selectedNodeIds = nextIds
    } else {
      this.selectedNodeIds = [nodeId]
    }
    this.selectedEdgeId = ''
    this.edgeToolbarState = null
    if (this.isInspectorOpen) {
      this.inspectorPanelSection = 'inspector'
    }
  },

  selectEdge(edgeId) {
    if (this.hasSuppressedPointerClick()) {
      return
    }
    this.cancelConnectorDrag()
    this.cancelEdgeReconnect()
    this.cancelEdgeBendDrag()
    this.cancelEdgeLabelDrag()
    if (
      this.inlineTextEditorState &&
      !(this.inlineTextEditorState.kind === 'edge' && this.inlineTextEditorState.id === edgeId)
    ) {
      void this.commitInlineTextEditor()
    }
    this.selectedEdgeId = edgeId
    this.selectedNodeIds = []
    this.inspectorPanelSection = 'inspector'
    this.isInspectorOpen = true
    this.edgeToolbarState = null
  },

  clearSelection() {
    this.cancelConnectorDrag()
    this.cancelEdgeReconnect()
    this.cancelEdgeBendDrag()
    this.cancelEdgeLabelDrag()
    this.selectedNodeIds = []
    this.selectedEdgeId = ''
    this.edgeToolbarState = null
  },

  syncEdgeToolbarState(edgeId = this.selectedEdgeId) {
    void edgeId
    this.edgeToolbarState = null
  },

  toggleInspector() {
    this.isInspectorOpen = !this.isInspectorOpen
  },

  closeInspector() {
    this.isInspectorOpen = false
  },

  isTextEditingTarget(target) {
    const tagName = String(target?.tagName || '').toLowerCase()
    return (
      tagName === 'input' ||
      tagName === 'select' ||
      tagName === 'textarea' ||
      target?.isContentEditable
    )
  },

  handleGlobalKeydown(event) {
    if (this.isTextEditingTarget(event.target)) {
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      if (this.commandPaletteVisible) {
        this.closeCommandPalette()
        return
      }
      if (this.flowchartOutlineVisible) {
        this.closeFlowchartOutline()
        return
      }
      if (this.flowchartSearchVisible) {
        this.closeFlowchartSearch()
        return
      }
      if (this.flowchartShortcutVisible) {
        this.closeFlowchartShortcuts()
        return
      }
      if (this.flowchartValidationVisible) {
        this.closeFlowchartValidationPanel()
        return
      }
      if (this.flowchartAiPreviewVisible) {
        this.discardFlowchartAiPreview()
        return
      }
      this.discardInlineTextEditor()
      this.closeInspector()
      this.clearSelection()
      return
    }
    const isMetaKey = event.ctrlKey || event.metaKey
    if (isMetaKey && event.key.toLowerCase() === 'k') {
      event.preventDefault()
      if (this.commandPaletteVisible) this.closeCommandPalette()
      else this.openCommandPalette()
      return
    }
    if (isMetaKey && event.key.toLowerCase() === 'f') {
      event.preventDefault()
      this.openFlowchartSearch()
      return
    }
    if (isMetaKey && event.shiftKey && event.key.toLowerCase() === 'o') {
      event.preventDefault()
      if (this.flowchartOutlineVisible) this.closeFlowchartOutline()
      else this.openFlowchartOutline()
      return
    }
    if (isMetaKey && event.key === '/') {
      event.preventDefault()
      if (this.flowchartShortcutVisible) this.closeFlowchartShortcuts()
      else this.openFlowchartShortcuts()
      return
    }
    if (isMetaKey && event.shiftKey && event.key.toLowerCase() === 'l') {
      event.preventDefault()
      this.validateCurrentFlowchart({ openPanel: true })
      return
    }
    if (isMetaKey && event.shiftKey && event.key.toLowerCase() === 'r') {
      event.preventDefault()
      this.autofixCurrentFlowchart()
      return
    }
    if (isMetaKey && event.shiftKey && event.key.toLowerCase() === 'z') {
      event.preventDefault()
      this.undoLastFlowchartAutofix()
      return
    }
    if (isMetaKey && event.key.toLowerCase() === 's') {
      event.preventDefault()
      // Shift keeps a quiet write path for rapid save loops.
      void this.saveCurrentFile({
        silent: !!event.shiftKey
      })
      return
    }
    if (isMetaKey && !event.shiftKey && event.key.toLowerCase() === '0') {
      event.preventDefault()
      this.fitCanvasToView()
      return
    }
    if (isMetaKey && event.key.toLowerCase() === '1') {
      event.preventDefault()
      this.resetViewport()
      return
    }
    if (isMetaKey && event.key.toLowerCase() === 'z') {
      event.preventDefault()
      if (event.shiftKey) {
        this.redoFlowchartChange()
      } else {
        this.undoFlowchartChange()
      }
      return
    }
    if (isMetaKey && event.key.toLowerCase() === 'y') {
      event.preventDefault()
      this.redoFlowchartChange()
      return
    }
    if (isMetaKey && event.key.toLowerCase() === 'a') {
      event.preventDefault()
      this.selectAllNodes()
      return
    }
    if (isMetaKey && event.key.toLowerCase() === 'd') {
      event.preventDefault()
      this.duplicateSelectedNodes()
      return
    }
    // Quick type keys (no modifiers): 1 start / 2 process / 3 decision / 4 input / 5 end
    if (
      !isMetaKey &&
      !event.altKey &&
      !event.shiftKey &&
      ['1', '2', '3', '4', '5'].includes(event.key)
    ) {
      const typeMap = {
        1: 'start',
        2: 'process',
        3: 'decision',
        4: 'input',
        5: 'end'
      }
      event.preventDefault()
      void this.addNodeByType({
        type: typeMap[event.key],
        autoConnect: this.selectedNodeIds.length === 1,
        startInlineEdit: true
      })
      return
    }
    if (event.altKey && event.shiftKey && event.key.startsWith('Arrow')) {
      event.preventDefault()
      this.cloneAndConnectSelectedNode(event.key)
      return
    }
    if (event.key === 'Enter' || event.key === 'F2') {
      if (this.selectedNodeIds.length === 1) {
        event.preventDefault()
        this.editNodeText(this.selectedNodeIds[0])
        return
      }
      if (this.selectedEdgeId) {
        event.preventDefault()
        this.editEdgeLabel(this.selectedEdgeId)
        return
      }
      // No selection: create a node and enter edit immediately.
      if (!this.selectedNodeIds.length && !this.selectedEdgeId) {
        event.preventDefault()
        const isEmptyCanvas = !(this.flowchartData?.nodes || []).length
        void this.addNodeByType({
          type: isEmptyCanvas ? 'start' : 'process',
          autoConnect: false,
          startInlineEdit: true
        })
        return
      }
    }
    // XMind-like structure keys: Tab inserts a connected child process.
    if (event.key === 'Tab' && !isMetaKey) {
      event.preventDefault()
      const hasSelection = this.selectedNodeIds.length === 1
      const isEmptyCanvas = !(this.flowchartData?.nodes || []).length
      const type = event.shiftKey
        ? 'decision'
        : isEmptyCanvas && !hasSelection
          ? 'start'
          : 'process'
      void this.addNodeByType({
        type,
        autoConnect: hasSelection,
        startInlineEdit: true
      })
      return
    }
    if (!isMetaKey && !event.altKey && !event.shiftKey && event.key === 'Insert') {
      event.preventDefault()
      const hasSelection = this.selectedNodeIds.length === 1
      const isEmptyCanvas = !(this.flowchartData?.nodes || []).length
      void this.addNodeByType({
        type: isEmptyCanvas && !hasSelection ? 'start' : 'process',
        autoConnect: hasSelection,
        startInlineEdit: true
      })
      return
    }
    if (isMetaKey && event.key.toLowerCase() === 'c') {
      event.preventDefault()
      this.copySelectedNodes()
      return
    }
    if (isMetaKey && event.key.toLowerCase() === 'v') {
      event.preventDefault()
      this.pasteCopiedNodes()
      return
    }
    if (event.key === 'Delete' || event.key === 'Backspace') {
      if (this.selectedNodeIds.length || this.selectedEdgeId) {
        event.preventDefault()
        this.removeSelection()
      }
      return
    }
    if (event.key.startsWith('Arrow') && this.selectedNodeIds.length) {
      // Ctrl/Cmd + Arrow: jump selection along graph structure (XMind-like topic nav)
      if (isMetaKey && this.selectedNodeIds.length === 1) {
        event.preventDefault()
        this.navigateConnectedNode(event.key)
        return
      }
      event.preventDefault()
      this.nudgeSelectedNodes(event.key, event)
    }
  },

  navigateConnectedNode(direction) {
    const currentId = this.selectedNodeIds[0]
    if (!currentId) return false
    const nodes = Array.isArray(this.flowchartData?.nodes)
      ? this.flowchartData.nodes
      : []
    const edges = Array.isArray(this.flowchartData?.edges)
      ? this.flowchartData.edges
      : []
    const current = nodes.find(node => node.id === currentId)
    if (!current) return false
    const center = {
      x: Number(current.x || 0) + Number(current.width || 0) / 2,
      y: Number(current.y || 0) + Number(current.height || 0) / 2
    }
    const neighborIds = new Set()
    edges.forEach(edge => {
      if (edge.source === currentId) neighborIds.add(edge.target)
      if (edge.target === currentId) neighborIds.add(edge.source)
    })
    const candidates = nodes.filter(
      node => neighborIds.has(node.id) && node.id !== currentId
    )
    if (!candidates.length) return false
    const score = node => {
      const nx = Number(node.x || 0) + Number(node.width || 0) / 2
      const ny = Number(node.y || 0) + Number(node.height || 0) / 2
      const dx = nx - center.x
      const dy = ny - center.y
      if (direction === 'ArrowRight') return dx > 8 ? dx + Math.abs(dy) * 0.35 : Infinity
      if (direction === 'ArrowLeft') return dx < -8 ? -dx + Math.abs(dy) * 0.35 : Infinity
      if (direction === 'ArrowDown') return dy > 8 ? dy + Math.abs(dx) * 0.35 : Infinity
      if (direction === 'ArrowUp') return dy < -8 ? -dy + Math.abs(dx) * 0.35 : Infinity
      return Infinity
    }
    let best = null
    let bestScore = Infinity
    candidates.forEach(node => {
      const value = score(node)
      if (value < bestScore) {
        bestScore = value
        best = node
      }
    })
    if (!best || !Number.isFinite(bestScore)) return false
    this.selectedNodeIds = [best.id]
    this.selectedEdgeId = ''
    if (typeof this.centerViewportAt === 'function') {
      this.centerViewportAt({
        x: Number(best.x || 0) + Number(best.width || 0) / 2,
        y: Number(best.y || 0) + Number(best.height || 0) / 2
      })
    }
    return true
  },

  getSelectedNodes() {
    const selectedSet = new Set(this.selectedNodeIds)
    return this.flowchartData.nodes.filter(node => selectedSet.has(node.id))
  },

  selectAllNodes() {
    this.selectedNodeIds = this.flowchartData.nodes.map(node => node.id)
    this.selectedEdgeId = ''
    this.edgeToolbarState = null
  },

  removeSelection() {
    if (!this.selectedEdgeId && !this.selectedNodeIds.length) {
      this.$message.warning(this.$t('flowchart.selectionEmpty'))
      return
    }
    if (this.selectedEdgeId) {
      this.flowchartData.edges = this.flowchartData.edges.filter(
        edge => edge.id !== this.selectedEdgeId
      )
      this.selectedEdgeId = ''
      this.edgeToolbarState = null
    }
    if (this.selectedNodeIds.length) {
      const selectedSet = new Set(this.selectedNodeIds)
      this.flowchartData.nodes = this.flowchartData.nodes.filter(node => !selectedSet.has(node.id))
      this.flowchartData.edges = this.flowchartData.edges.filter(edge => {
        return !selectedSet.has(edge.source) && !selectedSet.has(edge.target)
      })
      this.selectedNodeIds = []
    }
    this.discardInlineTextEditor()
    this.$message.success(this.$t('flowchart.deleteSuccess'))
    void this.persistFlowchartState()
  }
}
