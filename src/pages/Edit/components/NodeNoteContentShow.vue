<template>
  <div
    class="noteContentViewer customScrollbar"
    ref="noteContentViewer"
    :class="{ isDark: isDark }"
    :style="{
      left: this.left + 'px',
      top: this.top + 'px',
      visibility: show ? 'visible' : 'hidden'
    }"
    @click.stop
    @mousedown.stop
    @mousemove.stop
    @mouseup.stop
    @wheel.stop
    @mouseenter="onViewerEnter"
    @mouseleave="onViewerLeave"
  >
    <div class="noteContentHeader" v-if="show">
      <span class="noteContentTitle">{{ $t('note.title') || '备注' }}</span>
      <button
        type="button"
        class="noteEditBtn"
        @click.stop="openNoteEditor"
      >
        {{ $t('note.edit') || '编辑' }}
      </button>
    </div>
    <div class="noteContentWrap customScrollbar" ref="noteContentWrap"></div>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { useThemeStore } from '@/stores/theme'

let noteViewerLoader = null

const loadNoteViewer = async () => {
  if (!noteViewerLoader) {
    noteViewerLoader = Promise.all([
      import('@toast-ui/editor/dist/toastui-editor-viewer'),
      import('@toast-ui/editor/dist/toastui-editor-viewer.css')
    ]).then(([module]) => module.default || module)
  }
  return noteViewerLoader
}

// 节点备注内容显示
export default {
  props: {
    mindMap: {
      type: Object,
      default() {
        return null
      }
    }
  },
  data() {
    return {
      editor: null,
      show: false,
      left: 0,
      top: 0,
      node: null,
      hoverLocked: false,
      hideTimer: null
    }
  },
  computed: {
    ...mapState(useThemeStore, {
      isDark: 'isDark'
    })
  },
  created() {
    this.$bus.$on('showNoteContent', this.onShowNoteContent)
    this.$bus.$on('hideNoteContent', this.scheduleHideNoteContent)
    document.body.addEventListener('click', this.scheduleHideNoteContent)
    this.$bus.$on('node_active', this.onNodeActive)
    this.$bus.$on('scale', this.onScale)
    this.$bus.$on('translate', this.onScale)
    this.$bus.$on('svg_mousedown', this.scheduleHideNoteContent)
    this.$bus.$on('expand_btn_click', this.scheduleHideNoteContent)
  },
  mounted() {
    this.mindMap.el.appendChild(this.$refs.noteContentViewer)
  },
  beforeUnmount() {
    this.clearHideTimer()
    this.$bus.$off('showNoteContent', this.onShowNoteContent)
    this.$bus.$off('hideNoteContent', this.scheduleHideNoteContent)
    document.body.removeEventListener('click', this.scheduleHideNoteContent)
    this.$bus.$off('node_active', this.onNodeActive)
    this.$bus.$off('scale', this.onScale)
    this.$bus.$off('translate', this.onScale)
    this.$bus.$off('svg_mousedown', this.scheduleHideNoteContent)
    this.$bus.$off('expand_btn_click', this.scheduleHideNoteContent)
    const viewerEl = this.$refs.noteContentViewer
    const parentEl = viewerEl?.parentNode
    if (
      viewerEl &&
      parentEl &&
      typeof parentEl.removeChild === 'function'
    ) {
      parentEl.removeChild(viewerEl)
    }
  },
  methods: {
    onNodeActive(...args) {
      const nodes = [...(args[1] || [])]
      if (nodes.length > 0) {
        if (nodes[0] !== this.node) {
          this.hideNoteContent()
        }
      } else {
        this.hideNoteContent()
      }
    },

    // 显示备注浮层
    async onShowNoteContent(content, left, top, node) {
      this.clearHideTimer()
      this.node = node
      await this.initEditor()
      this.editor.setMarkdown(content)
      this.handleALink()
      this.updateNoteContentPosition(left, top)
      this.show = true
    },

    // 超链接新窗口打开
    handleALink() {
      const list = this.$refs.noteContentViewer.querySelectorAll('a')
      Array.from(list).forEach(a => {
        a.setAttribute('target', '_blank')
        a.setAttribute('rel', 'noopener noreferrer')
      })
    },

    // 更新位置
    updateNoteContentPosition(left, top) {
      const { width, height } = this.$refs.noteContentViewer.getBoundingClientRect()
      const { right, bottom } = this.mindMap.elRect
      this.left = left + width > right ? right - width : left
      this.top = top + height > bottom ? bottom - height : top
    },

    // 画布缩放事件
    onScale() {
      if (!this.node || !this.show) return
      const { left, top } = this.node.getNoteContentPosition()
      this.updateNoteContentPosition(left, top)
    },

    clearHideTimer() {
      if (this.hideTimer) {
        clearTimeout(this.hideTimer)
        this.hideTimer = null
      }
    },

    onViewerEnter() {
      this.hoverLocked = true
      this.clearHideTimer()
    },

    onViewerLeave() {
      this.hoverLocked = false
      this.scheduleHideNoteContent()
    },

    scheduleHideNoteContent() {
      if (this.hoverLocked) return
      this.clearHideTimer()
      this.hideTimer = setTimeout(() => {
        this.hideTimer = null
        if (!this.hoverLocked) {
          this.hideNoteContent()
        }
      }, 180)
    },

    // 隐藏备注浮层
    hideNoteContent() {
      this.clearHideTimer()
      this.hoverLocked = false
      this.show = false
    },

    openNoteEditor() {
      if (!this.node) return
      this.hideNoteContent()
      // Reuse toolbar path so NodeNote panel is mounted before opening.
      this.$bus.$emit('node_note_dblclick', this.node, {
        stopPropagation() {},
        preventDefault() {}
      })
    },

    // 初始化编辑器
    async initEditor() {
      if (!this.editor) {
        const Viewer = await loadNoteViewer()
        this.editor = new Viewer({
          el: this.$refs.noteContentWrap
        })
      }
    }
  }
}
</script>

<style lang="less" scoped>
.noteContentViewer {
  position: fixed;
  background-color: #fff;
  padding: 10px;
  border-radius: 10px;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.14);
  border: 1px solid rgba(15, 23, 42, 0.08);
  z-index: 2;
  min-width: 180px;

  &.isDark {
    background-color: #1f242b;
    color: rgba(255, 255, 255, 0.92);
    border-color: rgba(255, 255, 255, 0.08);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.36);

    .noteEditBtn {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.12);
      color: rgba(255, 255, 255, 0.92);
    }
  }

  .noteContentHeader {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 8px;
  }

  .noteContentTitle {
    font-size: 12px;
    font-weight: 600;
    opacity: 0.72;
  }

  .noteEditBtn {
    appearance: none;
    border: 1px solid rgba(15, 23, 42, 0.1);
    background: rgba(15, 23, 42, 0.04);
    border-radius: 6px;
    padding: 2px 8px;
    font-size: 12px;
    cursor: pointer;
    color: rgba(15, 23, 42, 0.86);
  }

  .noteContentWrap {
    max-width: 280px;
    max-height: 320px;
    overflow-y: auto;
  }
}
</style>
