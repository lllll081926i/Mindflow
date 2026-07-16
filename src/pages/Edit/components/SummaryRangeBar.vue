<template>
  <div
    v-if="visible && canvasEditMode"
    class="summaryRangeHandles"
    :class="{ isDark: isDark }"
  >
    <div
      v-if="startHandle"
      class="rangeHandle start"
      :class="{ isDragging: draggingEndpoint === 'start' }"
      :style="{ left: startHandle.left + 'px', top: startHandle.top + 'px' }"
      @mousedown.stop.prevent="onHandleDown('start', $event)"
      title="拖拽调整起点"
    >起</div>
    <div
      v-if="endHandle"
      class="rangeHandle end"
      :class="{ isDragging: draggingEndpoint === 'end' }"
      :style="{ left: endHandle.left + 'px', top: endHandle.top + 'px' }"
      @mousedown.stop.prevent="onHandleDown('end', $event)"
      title="拖拽调整终点"
    >终</div>
  </div>
  <div
    v-if="visible"
    class="summaryRangeBar"
    :class="{ isDark: isDark }"
    @mousedown.stop
  >
    <div class="title">
      {{ $t('summaryRange.title') || '范围概要' }}
      <span class="range">{{ rangeLabel }}</span>
    </div>
    <div class="actions">
      <el-button
        v-if="!generalizationNode && range"
        size="small"
        type="primary"
        @click="createRangeSummary"
      >{{ $t('summaryRange.create') || '创建范围概要' }}</el-button>
      <el-button
        size="small"
        :type="canvasEditMode ? 'primary' : 'default'"
        :disabled="!parentNode || !range"
        @click="toggleCanvasEditMode"
      >{{
        canvasEditMode
          ? ($t('summaryRange.canvasEditOn') || '画布改范围中')
          : ($t('summaryRange.canvasEdit') || '画布改范围')
      }}</el-button>
      <el-button size="small" :disabled="!canShrinkStart || !generalizationNode" @click="shrinkStart">收起起点</el-button>
      <el-button size="small" :disabled="!canExpandStart || !generalizationNode" @click="expandStart">扩展起点</el-button>
      <el-button size="small" :disabled="!canShrinkEnd || !generalizationNode" @click="shrinkEnd">收起终点</el-button>
      <el-button size="small" :disabled="!canExpandEnd || !generalizationNode" @click="expandEnd">扩展终点</el-button>
      <el-button size="small" type="danger" :disabled="!generalizationNode" @click="removeSummary">删除概要</el-button>
      <el-button size="small" @click="close">关闭</el-button>
    </div>
    <div class="hint">
      {{
        canvasEditMode
          ? ($t('summaryRange.canvasEditHint') ||
            '画布改范围：拖拽起/终手柄，或点击同级主题；Alt+点击设起点；Shift+点击扩展包含。')
          : ($t('summaryRange.hint') ||
            '选中多个同级主题后按 Ctrl+G 可创建范围概要；选中概要节点可在此调整覆盖范围。')
      }}
    </div>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { useThemeStore } from '@/stores/theme'

export default {
  name: 'SummaryRangeBar',
  props: {
    mindMap: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      visible: false,
      generalizationNode: null,
      parentNode: null,
      range: null,
      brotherCount: 0,
      canvasEditMode: false,
      suppressCloseOnce: false,
      startHandle: null,
      endHandle: null,
      draggingEndpoint: '',
      dragRaf: 0,
      pendingRange: null
    }
  },
  computed: {
    ...mapState(useThemeStore, {
      isDark: 'isDark'
    }),
    rangeLabel() {
      if (!this.range) return this.$t('summaryRange.single') || '单节点概要'
      return `${(this.range[0] || 0) + 1} - ${(this.range[1] || 0) + 1} / ${this.brotherCount}`
    },
    canExpandStart() {
      return Array.isArray(this.range) && this.range[0] > 0
    },
    canShrinkStart() {
      return Array.isArray(this.range) && this.range[0] < this.range[1]
    },
    canExpandEnd() {
      return (
        Array.isArray(this.range) &&
        this.range[1] < Math.max(0, this.brotherCount - 1)
      )
    },
    canShrinkEnd() {
      return Array.isArray(this.range) && this.range[0] < this.range[1]
    }
  },
  created() {
    this.$bus.$on('node_active', this.onNodeActive)
    this.$bus.$on('draw_click', this.onDrawClick)
    this.$bus.$on('node_tree_render_end', this.onRenderEnd)
    this.$bus.$on('translate', this.updateHandlePositions)
    this.$bus.$on('scale', this.updateHandlePositions)
    window.addEventListener('mousemove', this.onHandleMove, true)
    window.addEventListener('mouseup', this.onHandleUp, true)
  },
  beforeUnmount() {
    this.$bus.$off('node_active', this.onNodeActive)
    this.$bus.$off('draw_click', this.onDrawClick)
    this.$bus.$off('node_tree_render_end', this.onRenderEnd)
    this.$bus.$off('translate', this.updateHandlePositions)
    this.$bus.$off('scale', this.updateHandlePositions)
    window.removeEventListener('mousemove', this.onHandleMove, true)
    window.removeEventListener('mouseup', this.onHandleUp, true)
    if (this.dragRaf) cancelAnimationFrame(this.dragRaf)
  },
  methods: {
    onRenderEnd() {
      if (this.visible) {
        this.applyRangeHighlight()
        this.updateHandlePositions()
      }
    },
    onDrawClick() {
      if (this.canvasEditMode) return
      this.close()
    },
    close() {
      this.clearRangeHighlight()
      this.visible = false
      this.generalizationNode = null
      this.parentNode = null
      this.range = null
      this.brotherCount = 0
      this.canvasEditMode = false
      this.suppressCloseOnce = false
      this.startHandle = null
      this.endHandle = null
      this.draggingEndpoint = ''
      this.pendingRange = null
    },
    toggleCanvasEditMode() {
      if (!this.parentNode || !Array.isArray(this.range)) return
      this.canvasEditMode = !this.canvasEditMode
      if (this.canvasEditMode) {
        this.$message?.info?.(
          this.$t('summaryRange.canvasEditHint') ||
            '画布改范围：点击同级主题设终点；Alt+点击设起点；Shift+点击扩展包含。'
        )
        this.applyRangeHighlight()
      }
    },
    getSiblingIndex(node) {
      if (!node || !this.parentNode) return -1
      if (node.parent !== this.parentNode) return -1
      if (typeof node.getIndexInBrothers === 'function') {
        const index = node.getIndexInBrothers()
        return Number.isFinite(index) ? index : -1
      }
      const children = this.parentNode.children || []
      return children.indexOf(node)
    },
    applyCanvasPick(node) {
      if (!this.canvasEditMode || !this.parentNode || !Array.isArray(this.range)) {
        return false
      }
      if (node?.isGeneralization) return false
      const index = this.getSiblingIndex(node)
      if (index < 0) return false
      let [start, end] = this.range
      const ev = window.event || null
      const isAlt = !!(ev && ev.altKey)
      const isShift = !!(ev && ev.shiftKey)
      if (isAlt) {
        start = index
        if (start > end) end = start
      } else if (isShift) {
        start = Math.min(start, index)
        end = Math.max(end, index)
      } else if (index < start) {
        start = index
      } else if (index > end) {
        end = index
      } else {
        const distStart = Math.abs(index - start)
        const distEnd = Math.abs(index - end)
        if (distStart <= distEnd) start = index
        else end = index
      }
      if (start > end) {
        const tmp = start
        start = end
        end = tmp
      }
      if (this.generalizationNode) {
        this.updateRange([start, end])
      } else {
        this.range = [start, end]
        this.applyRangeHighlight()
      }
      this.suppressCloseOnce = true
      return true
    },
    clearRangeHighlight() {
      try {
        const root = this.mindMap?.renderer?.root
        if (!root) return
        const walk = node => {
          if (!node) return
          if (node._summaryRangeHighlight && node.group?.opacity) {
            node.group.opacity(1)
            node._summaryRangeHighlight = false
          }
          if (node._summaryRangeEndpointStroke && node.shapeNode?.stroke) {
            try {
              node.shapeNode.stroke({ width: 1 })
            } catch (_error) {}
            node._summaryRangeEndpointStroke = false
          }
          ;(node.children || []).forEach(walk)
        }
        walk(root)
      } catch (_error) {}
    },
    applyRangeHighlight() {
      this.clearRangeHighlight()
      if (!this.parentNode || !Array.isArray(this.range)) return
      try {
        const children = this.parentNode.children || []
        const [start, end] = this.range
        children.forEach((child, index) => {
          if (!child?.group?.opacity) return
          const inRange = index >= start && index <= end
          const isEndpoint = index === start || index === end
          child.group.opacity(inRange ? (isEndpoint ? 1 : 0.92) : 0.18)
          child._summaryRangeHighlight = true
          try {
            if (child.shapeNode?.stroke) {
              child.shapeNode.stroke({
                color: isEndpoint ? '#2563eb' : undefined,
                width: isEndpoint ? 3 : 1
              })
              child._summaryRangeEndpointStroke = isEndpoint
            }
          } catch (_error) {}
        })
        // keep parent visible
        if (this.parentNode.group?.opacity) {
          this.parentNode.group.opacity(1)
          this.parentNode._summaryRangeHighlight = true
        }
      } catch (_error) {}
      this.updateHandlePositions()
    },
    updateHandlePositions() {
      if (!this.visible || !this.canvasEditMode || !this.parentNode || !Array.isArray(this.range)) {
        this.startHandle = null
        this.endHandle = null
        return
      }
      try {
        const children = this.parentNode.children || []
        const [start, end] = this.range
        const startNode = children[start]
        const endNode = children[end]
        this.startHandle = this.getHandlePoint(startNode, 'start')
        this.endHandle = this.getHandlePoint(endNode, 'end')
      } catch (_error) {
        this.startHandle = null
        this.endHandle = null
      }
    },
    getHandlePoint(node, which) {
      if (!node || typeof node.getNodePosInClient !== 'function') return null
      const pos = node.getNodePosInClient(node.left, node.top)
      const width = Number(node.width || 0)
      const height = Number(node.height || 0)
      const offsetX = which === 'start' ? -10 : width + 10
      return {
        left: Math.round(pos.left + offsetX),
        top: Math.round(pos.top + height / 2)
      }
    },
    onHandleDown(endpoint) {
      if (!this.canvasEditMode || !Array.isArray(this.range)) return
      this.draggingEndpoint = endpoint
      this.pendingRange = Array.isArray(this.range) ? [...this.range] : null
      this.suppressCloseOnce = true
    },
    onHandleMove(event) {
      if (!this.draggingEndpoint || !this.parentNode || !Array.isArray(this.range)) return
      if (this.dragRaf) cancelAnimationFrame(this.dragRaf)
      this.dragRaf = requestAnimationFrame(() => {
        this.dragRaf = 0
        this.dragRangeToPoint(event.clientX, event.clientY)
      })
    },
    onHandleUp() {
      if (!this.draggingEndpoint) return
      const endpoint = this.draggingEndpoint
      this.draggingEndpoint = ''
      this.suppressCloseOnce = true
      if (Array.isArray(this.pendingRange)) {
        const [start, end] = this.pendingRange
        this.pendingRange = null
        if (this.generalizationNode) {
          this.updateRange([start, end])
        } else {
          this.range = [start, end]
          this.applyRangeHighlight()
          this.updateHandlePositions()
        }
      } else {
        this.updateHandlePositions()
      }
      // endpoint currently unused but kept for future analytics
      void endpoint
    },
    dragRangeToPoint(clientX, clientY) {
      const children = this.parentNode?.children || []
      if (!children.length) return
      let bestIndex = -1
      let bestDist = Infinity
      children.forEach((child, index) => {
        if (!child || typeof child.getNodePosInClient !== 'function') return
        const pos = child.getNodePosInClient(child.left, child.top)
        const cx = pos.left + Number(child.width || 0) / 2
        const cy = pos.top + Number(child.height || 0) / 2
        const dist = Math.hypot(clientX - cx, clientY - cy)
        if (dist < bestDist) {
          bestDist = dist
          bestIndex = index
        }
      })
      if (bestIndex < 0) return
      let [start, end] = this.pendingRange || this.range
      if (this.draggingEndpoint === 'start') {
        start = bestIndex
        if (start > end) end = start
      } else {
        end = bestIndex
        if (end < start) start = end
      }
      const current = this.pendingRange || this.range
      if (start === current[0] && end === current[1]) {
        this.updateHandlePositions()
        return
      }
      this.pendingRange = [start, end]
      this.range = [start, end]
      // live visual only; persist on mouseup for one undo step
      this.applyRangeHighlight()
      this.updateHandlePositions()
    },
    onNodeActive(node, nodeList = []) {
      const list = Array.isArray(nodeList) ? nodeList : []
      const target = list[0] || node

      if (this.visible && this.canvasEditMode && target) {
        const handled = this.applyCanvasPick(target)
        if (handled) return
      }
      if (this.suppressCloseOnce) {
        this.suppressCloseOnce = false
        return
      }

      // multi sibling selection hint bar (not a generalization node)
      if (list.length > 1 && list.every(item => !item.isGeneralization)) {
        const parent = list[0]?.parent
        const sameParent = parent && list.every(item => item.parent === parent)
        if (sameParent && !parent.isRoot) {
          const indexes = list
            .map(item => item.getIndexInBrothers?.())
            .filter(n => Number.isFinite(n))
            .sort((a, b) => a - b)
          this.generalizationNode = null
          this.parentNode = parent
          this.range = indexes.length
            ? [indexes[0], indexes[indexes.length - 1]]
            : null
          this.brotherCount = parent.children?.length || 0
          this.visible = true
          this.canvasEditMode = true
          this.$nextTick(() => this.applyRangeHighlight())
          return
        }
      }

      if (!target || !target.isGeneralization) {
        if (
          this.canvasEditMode &&
          this.parentNode &&
          target &&
          target.parent === this.parentNode
        ) {
          this.applyCanvasPick(target)
          return
        }
        this.close()
        return
      }
      this.generalizationNode = target
      this.parentNode = target.generalizationBelongNode || target.parent || null
      const data = target.getData?.() || {}
      this.range = Array.isArray(data.range) ? [...data.range] : null
      this.brotherCount = this.parentNode?.children?.length || 0
      this.visible = true
      this.canvasEditMode = Array.isArray(this.range)
      this.$nextTick(() => this.applyRangeHighlight())
    },
    updateRange(nextRange) {
      if (!this.generalizationNode || !this.parentNode) return
      if (!Array.isArray(nextRange) || nextRange.length !== 2) return
      const [start, end] = nextRange
      if (start < 0 || end < start || end >= this.brotherCount) return
      let generalization = this.parentNode.getData('generalization')
      generalization = generalization
        ? Array.isArray(generalization)
          ? [...generalization]
          : [generalization]
        : []
      const uid =
        this.generalizationNode.uid || this.generalizationNode.getData?.('uid')
      const currentRange = Array.isArray(this.range) ? this.range : null
      let updated = false
      generalization = generalization.map(item => {
        if (!item || typeof item !== 'object') return item
        const sameUid = uid && item.uid === uid
        const sameRange =
          currentRange &&
          Array.isArray(item.range) &&
          item.range[0] === currentRange[0] &&
          item.range[1] === currentRange[1]
        if (sameUid || sameRange) {
          updated = true
          return {
            ...item,
            range: [start, end]
          }
        }
        return item
      })
      if (!updated && generalization.length === 1) {
        generalization[0] = {
          ...generalization[0],
          range: [start, end]
        }
        updated = true
      }
      if (updated) {
        this.mindMap?.execCommand?.('SET_NODE_DATA', this.parentNode, {
          generalization
        })
      }
      this.range = [start, end]
      this.mindMap?.render?.()
      this.$nextTick(() => this.applyRangeHighlight())
    },
    expandStart() {
      if (!this.canExpandStart) return
      this.updateRange([this.range[0] - 1, this.range[1]])
    },
    shrinkStart() {
      if (!this.canShrinkStart) return
      this.updateRange([this.range[0] + 1, this.range[1]])
    },
    expandEnd() {
      if (!this.canExpandEnd) return
      this.updateRange([this.range[0], this.range[1] + 1])
    },
    shrinkEnd() {
      if (!this.canShrinkEnd) return
      this.updateRange([this.range[0], this.range[1] - 1])
    },
    createRangeSummary() {
      if (!this.parentNode || !Array.isArray(this.range)) return
      // ensure siblings in range are selected, then use library command
      try {
        const children = this.parentNode.children || []
        const [start, end] = this.range
        const targets = children.slice(start, end + 1)
        if (!targets.length) return
        this.mindMap?.renderer?.clearActiveNodeList?.()
        targets.forEach(node => node.active?.())
        this.mindMap?.execCommand?.('ADD_GENERALIZATION')
        this.$message?.success?.(
          this.$t('summaryRange.created') || '已创建范围概要'
        )
      } catch (error) {
        console.error('createRangeSummary failed', error)
      }
    },
    removeSummary() {
      if (this.generalizationNode) {
        // select generalization then remove
        this.mindMap?.renderer?.clearActiveNodeList?.()
        this.generalizationNode.active?.()
        this.mindMap?.execCommand?.('REMOVE_GENERALIZATION')
      }
      this.close()
    }
  }
}
</script>

<style lang="less" scoped>
.summaryRangeHandles {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 1390;
}
.rangeHandle {
  position: fixed;
  width: 28px;
  height: 28px;
  margin-left: -14px;
  margin-top: -14px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  pointer-events: auto;
  cursor: grab;
  user-select: none;
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.35);
}
.rangeHandle:active,
.rangeHandle.isDragging {
  cursor: grabbing;
  transform: scale(1.12);
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.45);
}
.rangeHandle.start {
  background: #2563eb;
}
.rangeHandle.end {
  background: #7c3aed;
}
.summaryRangeHandles.isDark .rangeHandle.start {
  background: #3b82f6;
}
.summaryRangeHandles.isDark .rangeHandle.end {
  background: #8b5cf6;
}
.summaryRangeBar {
  position: fixed;
  left: 50%;
  bottom: 88px;
  transform: translateX(-50%);
  z-index: 1400;
  min-width: 560px;
  border-left: 4px solid #2563eb;
  max-width: min(860px, calc(100vw - 32px));
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.16);
  color: rgba(15, 23, 42, 0.92);
  backdrop-filter: blur(14px);
}
.summaryRangeBar.isDark {
  background: rgba(24, 28, 34, 0.96);
  border-color: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.92);
}
.title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.range {
  font-weight: 500;
  opacity: 0.7;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.hint {
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.5;
  opacity: 0.7;
}
</style>
