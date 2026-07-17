<template>
  <el-tree
    ref="tree"
    class="outlineTree"
    node-key="uid"
    draggable
    default-expand-all
    :class="{ isDark: isDark }"
    :data="data"
    :props="defaultProps"
    :highlight-current="true"
    :expand-on-click-node="false"
    :allow-drag="checkAllowDrag"
    @node-drop="onNodeDrop"
    @node-drag-start="onNodeDragStart"
    @node-drag-end="onNodeDragEnd"
    @current-change="onCurrentChange"
    @mouseenter="isInTreArea = true"
    @mouseleave="isInTreArea = false"
    :filter-node-method="filterOutlineNode"
  >
    <template #default="{ node, data }">
      <span class="customNode" :data-id="data.uid" @click="onClick(data)">
        <span
          v-if="data.bookmarked"
          class="bookmarkStar"
          :title="$t('bookmark.title') || '书签'"
          >★</span
        >
        <span
          class="nodeEdit"
          :contenteditable="!isReadonly"
          :key="`${data.uid}-${outlineVersion}`"
          @keydown.stop="onNodeInputKeydown($event, node)"
          @keyup.stop
          @blur="onBlur($event, node)"
          @paste="onPaste($event, node)"
          v-html="node.label"
        ></span>
      </span>
    </template>
  </el-tree>
</template>

<script>
import { mapState } from 'pinia'
import {
  nodeRichTextToTextWithWrap,
  textToNodeRichTextWithWrap,
  createUid,
  htmlEscape,
  handleInputPasteText
} from 'simple-mind-map/src/utils'
import { sanitizeRichTextFragment } from '@/utils'
import { useAppStore } from '@/stores/app'
import { useThemeStore } from '@/stores/theme'
import { setIsDragOutlineTreeNode } from '@/stores/runtime'
import { isBookmarkIcon } from '@/services/nodeBookmarks'

const OUTLINE_INSERT_ACTIONS = new Set(['insertNode', 'insertChildNode', 'moveUp'])

// 大纲树
export default {
  props: {
    keyword: {
      type: String,
      default: ''
    },
    bookmarksOnly: {
      type: Boolean,
      default: false
    },
    mindMap: {
      type: Object
    }
  },
  data() {
    return {
      data: [],
      defaultProps: {
        label: 'label'
      },
      currentData: null,
      notHandleDataChange: false,
      isHandleNodeTreeRenderEnd: false,
      beInsertNodeUid: '',
      insertType: '',
      isInTreArea: false,
      isAfterCreateNewNode: false,
      refreshTimer: 0,
      outlineVersion: 0,
      markerFilterToken: ''
    }
  },
  computed: {
    ...mapState(useAppStore, {
      isReadonly: 'isReadonly'
    }),
    ...mapState(useThemeStore, {
      isDark: 'isDark'
    })
  },
  created() {
    window.addEventListener('keydown', this.onKeyDown)
    this.$bus.$on('data_change', this.handleDataChange)
    this.$bus.$on('node_tree_render_end', this.handleNodeTreeRenderEnd)
    this.$bus.$on('hide_text_edit', this.handleHideTextEdit)
    this.$bus.$on('outlineRevealUid', this.revealUid)
    this.$bus.$on('outlineSetMarkerFilter', this.setMarkerFilter)
  },
  mounted() {
    this.scheduleRefresh()
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.onKeyDown)
    this.$bus.$off('data_change', this.handleDataChange)
    this.$bus.$off('node_tree_render_end', this.handleNodeTreeRenderEnd)
    this.$bus.$off('hide_text_edit', this.handleHideTextEdit)
    this.$bus.$off('outlineRevealUid', this.revealUid)
    this.$bus.$off('outlineSetMarkerFilter', this.setMarkerFilter)
    clearTimeout(this.refreshTimer)
  },
  watch: {
    keyword(value) {
      this.$refs.tree?.filter?.(value || ' ')
    },
    bookmarksOnly() {
      this.$nextTick(() => {
        this.$refs.tree?.filter?.(this.keyword || ' ')
      })
    }
  },
  methods: {
    filterOutlineNode(value, data) {
      const keyword = String(value || this.keyword || '').trim().toLowerCase()
      const marker = String(this.markerFilterToken || '').trim()
      if (this.bookmarksOnly && !this.hasBookmarkedDescendant(data)) {
        return false
      }
      // marker-only filter (icons / has:* tokens)
      if (marker && (marker.includes('_') || marker.startsWith('has:'))) {
        return this.nodeMatchesMarker(data, marker)
      }
      if (!keyword) return true
      const text = String(data?.label || data?.data?.text || data?.text || '')
        .toLowerCase()
      return text.includes(keyword)
    },
    hasBookmarkedDescendant(data) {
      if (!data) return false
      if (data.bookmarked) return true
      const children = data.children || []
      return children.some(child => this.hasBookmarkedDescendant(child))
    },
    setMarkerFilter(token = '') {
      this.markerFilterToken = String(token || '')
      // for marker tokens, force tree filter refresh
      this.$nextTick(() => {
        this.$refs.tree?.filter?.(this.keyword || this.markerFilterToken || '')
      })
    },
    nodeMatchesMarker(data, token) {
      const nodeData = data?.data || data || {}
      const icons = Array.isArray(nodeData.icon) ? nodeData.icon : []
      const tags = Array.isArray(nodeData.tag) ? nodeData.tag : []
      const tagText = tags
        .map(item => (typeof item === 'object' ? item.text : item))
        .join(' ')
      const note = String(nodeData.note || '')
      const comments = Array.isArray(nodeData.comments) ? nodeData.comments : []
      const commentText = comments.map(item => item?.text || item).join(' ')
      const lower = String(token || '').toLowerCase()
      if (lower === 'has:comment' || lower === 'has:comments') return comments.length > 0
      if (lower === 'has:note') return !!note.trim()
      if (lower === 'has:link') return !!(nodeData.hyperlink || nodeData.link)
      if (icons.includes(token)) return true
      if (token.startsWith('priority_') || token.startsWith('progress_')) {
        return icons.includes(token)
      }
      const hay = (tagText + ' ' + note + ' ' + commentText).toLowerCase()
      return hay.includes(lower)
    },
    revealUid(uid) {
      if (!uid || !this.$refs.tree) return
      try {
        this.$refs.tree.setCurrentKey(uid)
        const node = this.$refs.tree.getNode(uid)
        if (node?.data) this.onCurrentChange(node.data)
        const el = document.querySelector(`.customNode[data-id="${uid}"]`)
        if (el) this.$emit('scrollTo', el.offsetTop)
      } catch (error) {
        console.error('revealUid failed', error)
      }
    },
    scheduleRefresh() {
      clearTimeout(this.refreshTimer)
      this.refreshTimer = setTimeout(() => {
        this.refresh()
      }, 150)
    },

    handleHideTextEdit() {
      if (this.notHandleDataChange) {
        this.notHandleDataChange = false
        this.scheduleRefresh()
      }
    },

    handleDataChange() {
      // 在大纲里操作节点时不要响应该事件，否则会重新刷新树
      if (this.notHandleDataChange) {
        this.notHandleDataChange = false
        this.isAfterCreateNewNode = false
        return
      }
      if (this.isAfterCreateNewNode) {
        this.isAfterCreateNewNode = false
        return
      }
      this.scheduleRefresh()
    },

    handleNodeTreeRenderEnd() {
      // 当前存在未完成的节点插入操作
      if (OUTLINE_INSERT_ACTIONS.has(this.insertType)) {
        this[this.insertType]()
        this.insertType = ''
        return
      }
      // 插入了新节点后需要做一些操作
      if (this.isHandleNodeTreeRenderEnd) {
        this.isHandleNodeTreeRenderEnd = false
        this.refresh()
        this.$nextTick(() => {
          this.afterCreateNewNode()
        })
      }
    },

    // 刷新树数据
    refresh() {
      let data = this.mindMap.getData()
      data.root = true // 标记根节点
      let walk = root => {
        let text = root.data.richText
          ? nodeRichTextToTextWithWrap(root.data.text)
          : root.data.text
        text = htmlEscape(text)
        text = text.replace(/\n/g, '<br>')
        root.textCache = text // 保存一份修改前的数据，用于对比是否修改了
        root.label = text
        root.uid = root.data.uid
        const icons = Array.isArray(root.data.icon) ? root.data.icon : []
        root.bookmarked = icons.some(isBookmarkIcon)
        if (root.children && root.children.length > 0) {
          root.children.forEach(item => {
            walk(item)
          })
        }
      }
      walk(data)
      this.data = [data]
      this.outlineVersion += 1
    },

    // 插入了新节点之后
    afterCreateNewNode() {
      // 如果是新插入节点，那么需要手动高亮该节点、定位该节点及聚焦
      let id = this.beInsertNodeUid
      if (id && this.$refs.tree) {
        try {
          this.isAfterCreateNewNode = true
          // 高亮树节点
          this.$refs.tree.setCurrentKey(id)
          let node = this.$refs.tree.getNode(id)
          this.onCurrentChange(node.data)
          // 定位该节点
          this.onClick(node.data)
          // 聚焦该树节点的编辑框
          const el = document.querySelector(
            `.customNode[data-id="${id}"] .nodeEdit`
          )
          if (el) {
            let selection = window.getSelection()
            let range = document.createRange()
            range.selectNodeContents(el)
            selection.removeAllRanges()
            selection.addRange(range)
            let offsetTop = el.offsetTop
            this.$emit('scrollTo', offsetTop)
          }
        } catch (error) {
          console.error('afterCreateNewNode failed', error)
        }
      }
      this.beInsertNodeUid = ''
    },

    // 根节点不允许拖拽
    checkAllowDrag(node) {
      return !node.data.root
    },

    // 失去焦点更新节点文本
    onBlur(e, node) {
      const nextHtml = sanitizeRichTextFragment(e.target.innerHTML)
      // 节点数据没有修改
      if (node.data.textCache === nextHtml) {
        // 如果存在未执行的插入新节点操作，那么直接执行
        if (OUTLINE_INSERT_ACTIONS.has(this.insertType)) {
          this[this.insertType]()
          this.insertType = ''
        }
        return
      }
      // 否则插入新节点操作需要等待当前修改事件渲染完成后再执行
      const richText = node.data.data.richText
      const text = richText ? nextHtml : e.target.innerText
      const targetNode = this.mindMap.renderer.findNodeByUid(node.data.uid)
      if (!targetNode) return
      this.notHandleDataChange = true
      if (richText) {
        targetNode.setText(textToNodeRichTextWithWrap(text), true)
      } else {
        targetNode.setText(text)
      }
    },

    // 拦截粘贴事件
    onPaste(e) {
      handleInputPasteText(e)
    },
    // 节点输入区域按键事件
    onNodeInputKeydown(e) {
      if (e.keyCode === 13 && !e.shiftKey) {
        // 插入兄弟节点
        e.preventDefault()
        this.insertType = 'insertNode'
        e.target.blur()
      }
      if (e.keyCode === 9) {
        e.preventDefault()
        if (e.shiftKey) {
          // 节点上升一级
          this.insertType = 'moveUp'
          e.target.blur()
        } else {
          // 插入子节点
          this.insertType = 'insertChildNode'
          e.target.blur()
        }
      }
    },

    // 节点上移一个层级
    moveUp() {
      this.mindMap.execCommand('MOVE_UP_ONE_LEVEL')
    },

    // 插入兄弟节点
    insertNode() {
      this.notHandleDataChange = true
      this.isHandleNodeTreeRenderEnd = true
      this.beInsertNodeUid = createUid()
      this.mindMap.execCommand('INSERT_NODE', false, [], {
        uid: this.beInsertNodeUid
      })
    },

    // 插入下级节点
    insertChildNode() {
      this.notHandleDataChange = true
      this.isHandleNodeTreeRenderEnd = true
      this.beInsertNodeUid = createUid()
      this.mindMap.execCommand('INSERT_CHILD_NODE', false, [], {
        uid: this.beInsertNodeUid
      })
    },

    // 激活当前节点且移动当前节点到画布中间
    onClick(data) {
      if (data?.uid) this.$bus.$emit('focusMarkerFilterMatch', data.uid)
      this.notHandleDataChange = true
      const targetNode = this.mindMap.renderer.findNodeByUid(data.uid)
      if (targetNode && targetNode.nodeData.data.isActive) return
      this.mindMap.execCommand('GO_TARGET_NODE', data.uid, () => {
        this.notHandleDataChange = false
      })
    },

    onNodeDragStart() {
      setIsDragOutlineTreeNode(true)
    },

    onNodeDragEnd() {
      setIsDragOutlineTreeNode(false)
    },

    // 拖拽结束事件
    onNodeDrop(data, target, postion) {
      this.notHandleDataChange = true
      const node = this.mindMap.renderer.findNodeByUid(data.data.uid)
      const targetNode = this.mindMap.renderer.findNodeByUid(target.data.uid)
      if (!node || !targetNode) {
        return
      }
      switch (postion) {
        case 'before':
          this.mindMap.execCommand('INSERT_BEFORE', node, targetNode)
          break
        case 'after':
          this.mindMap.execCommand('INSERT_AFTER', node, targetNode)
          break
        case 'inner':
          this.mindMap.execCommand('MOVE_NODE_TO', node, targetNode)
          break
        default:
          break
      }
    },

    // 当前选中的树节点变化事件
    onCurrentChange(data) {
      this.currentData = data
    },

    // 删除节点
    onKeyDown(e) {
      if (!this.isInTreArea) return
      if ([46, 8].includes(e.keyCode) && this.currentData) {
        e.stopPropagation()
        this.mindMap.renderer.textEdit.hideEditTextBox()
        const node = this.mindMap.renderer.findNodeByUid(this.currentData.uid)
        if (node && !node.isRoot) {
          this.notHandleDataChange = true
          this.$refs.tree.remove(this.currentData)
          this.mindMap.execCommand('REMOVE_NODE', [node])
        }
      }
    }
  }
}
</script>

<style lang="less" scoped>
.customNode {
  width: 100%;
  color: rgba(0, 0, 0, 0.85);
  font-weight: bold;
  display: inline-flex;
  align-items: flex-start;
  gap: 4px;

  .bookmarkStar {
    color: #f59e0b;
    flex-shrink: 0;
    line-height: 1.4;
    font-size: 12px;
  }

  .nodeEdit {
    outline: none;
    white-space: normal;
    padding-right: 20px;
    flex: 1;
    min-width: 0;
  }
}
</style>
<style lang="less" scoped>
@import url('../../../style/outlineTree.less');
</style>
