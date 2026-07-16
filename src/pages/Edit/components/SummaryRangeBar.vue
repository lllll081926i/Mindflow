<template>
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
      <el-button size="small" :disabled="!canShrinkStart" @click="shrinkStart">收起起点</el-button>
      <el-button size="small" :disabled="!canExpandStart" @click="expandStart">扩展起点</el-button>
      <el-button size="small" :disabled="!canShrinkEnd" @click="shrinkEnd">收起终点</el-button>
      <el-button size="small" :disabled="!canExpandEnd" @click="expandEnd">扩展终点</el-button>
      <el-button size="small" type="danger" @click="removeSummary">删除概要</el-button>
      <el-button size="small" @click="close">关闭</el-button>
    </div>
    <div class="hint">
      {{
        $t('summaryRange.hint') ||
        '选中多个同级主题后按 Ctrl+G 可创建范围概要；选中概要节点可在此调整覆盖范围。'
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
      brotherCount: 0
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
    this.$bus.$on('draw_click', this.close)
  },
  beforeUnmount() {
    this.$bus.$off('node_active', this.onNodeActive)
    this.$bus.$off('draw_click', this.close)
  },
  methods: {
    close() {
      this.visible = false
      this.generalizationNode = null
      this.parentNode = null
      this.range = null
      this.brotherCount = 0
    },
    onNodeActive(node, nodeList = []) {
      const list = Array.isArray(nodeList) ? nodeList : []
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
          return
        }
      }

      const target = list[0] || node
      if (!target || !target.isGeneralization) {
        this.close()
        return
      }
      this.generalizationNode = target
      this.parentNode = target.generalizationBelongNode || target.parent || null
      const data = target.getData?.() || {}
      this.range = Array.isArray(data.range) ? [...data.range] : null
      this.brotherCount = this.parentNode?.children?.length || 0
      this.visible = true
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
    },expandStart() {
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
.summaryRangeBar {
  position: fixed;
  left: 50%;
  bottom: 88px;
  transform: translateX(-50%);
  z-index: 1400;
  min-width: 520px;
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
