<template>
  <el-dialog
    class="nodeCommentsDialog"
    :class="{ isDark: isDark }"
    v-model="visible"
    width="420px"
    :title="$t('toolbar.nodeComments') || '主题批注'"
    @close="close"
  >
    <div class="commentsList" v-if="comments.length">
      <div class="commentItem" v-for="(item, index) in comments" :key="item.id || index">
        <div class="commentMeta">
          <span>{{ item.author || '我' }}</span>
          <span>{{ formatTime(item.updatedAt || item.createdAt) }}</span>
        </div>
        <div class="commentText">{{ item.text }}</div>
        <div class="commentActions" v-if="!isReadonly">
          <el-button link type="primary" size="small" @click="editComment(index)">编辑</el-button>
          <el-button link type="danger" size="small" @click="removeComment(index)">删除</el-button>
        </div>
      </div>
    </div>
    <div class="empty" v-else>{{ $t('toolbar.noNodeComments') || '暂无批注' }}</div>
    <div class="composer" v-if="!isReadonly">
      <el-input
        v-model.trim="draft"
        type="textarea"
        :rows="3"
        :placeholder="$t('toolbar.commentPlaceholder') || '写下批注…'"
      />
      <div class="composerActions">
        <el-button v-if="editingIndex >= 0" @click="cancelEdit">取消编辑</el-button>
        <el-button type="primary" :disabled="!draft" @click="saveComment">
          {{ editingIndex >= 0 ? '保存' : '添加批注' }}
        </el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script>
import { mapState } from 'pinia'
import { useAppStore } from '@/stores/app'
import { useThemeStore } from '@/stores/theme'

const createId = () =>
  'c_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7)

export default {
  name: 'NodeCommentsDialog',
  data() {
    return {
      visible: false,
      nodes: [],
      comments: [],
      draft: '',
      editingIndex: -1
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
    this.$bus.$on('showNodeComments', this.open)
  },
  beforeUnmount() {
    this.$bus.$off('showNodeComments', this.open)
  },
  methods: {
    open(payload = {}) {
      const nodes = payload.activeNodes || payload.nodes || []
      this.nodes = Array.isArray(nodes) ? nodes : []
      if (!this.nodes.length) {
        this.$message?.warning?.(this.$t('toolbar.commentNeedSelection') || '请先选择主题')
        return
      }
      const first = this.nodes[0]
      const list = first?.getData?.('comments')
      this.comments = Array.isArray(list) ? JSON.parse(JSON.stringify(list)) : []
      this.draft = ''
      this.editingIndex = -1
      this.visible = true
    },
    close() {
      this.visible = false
      this.nodes = []
      this.comments = []
      this.draft = ''
      this.editingIndex = -1
    },
    formatTime(value) {
      if (!value) return ''
      try {
        return new Date(value).toLocaleString()
      } catch (_error) {
        return String(value)
      }
    },
    persist() {
      this.nodes.forEach(node => {
        if (!node?.mindMap?.execCommand) return
        node.mindMap.execCommand('SET_NODE_DATA', node, {
          comments: JSON.parse(JSON.stringify(this.comments))
        })
      })
    },
    editComment(index) {
      const item = this.comments[index]
      if (!item) return
      this.editingIndex = index
      this.draft = item.text || ''
    },
    cancelEdit() {
      this.editingIndex = -1
      this.draft = ''
    },
    removeComment(index) {
      this.comments.splice(index, 1)
      this.persist()
      if (this.editingIndex === index) this.cancelEdit()
    },
    saveComment() {
      const text = String(this.draft || '').trim()
      if (!text) return
      const now = Date.now()
      if (this.editingIndex >= 0 && this.comments[this.editingIndex]) {
        this.comments[this.editingIndex] = {
          ...this.comments[this.editingIndex],
          text,
          updatedAt: now
        }
      } else {
        this.comments.push({
          id: createId(),
          text,
          author: '我',
          createdAt: now,
          updatedAt: now
        })
      }
      this.persist()
      this.cancelEdit()
    }
  }
}
</script>

<style lang="less" scoped>
.nodeCommentsDialog {
  .commentsList {
    max-height: 280px;
    overflow: auto;
    margin-bottom: 12px;
  }
  .commentItem {
    padding: 10px 0;
    border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  }
  .commentMeta {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    font-size: 12px;
    opacity: 0.7;
    margin-bottom: 4px;
  }
  .commentText {
    white-space: pre-wrap;
    line-height: 1.5;
  }
  .commentActions {
    margin-top: 4px;
  }
  .empty {
    opacity: 0.6;
    margin-bottom: 12px;
  }
  .composerActions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 8px;
  }
}
.isDark {
  .commentItem {
    border-bottom-color: rgba(255, 255, 255, 0.08);
  }
}
</style>
