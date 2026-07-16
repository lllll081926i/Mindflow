<template>
  <el-dialog
    class="nodeCommentsDialog"
    :class="{ isDark: isDark }"
    v-model="visible"
    width="480px"
    :title="$t('toolbar.nodeComments') || '主题批注'"
    @close="close"
  >
    <div class="filters" v-if="comments.length">
      <button
        type="button"
        class="chip"
        :class="{ active: filter === 'all' }"
        @click="filter = 'all'"
      >
        全部 {{ comments.length }}
      </button>
      <button
        type="button"
        class="chip"
        :class="{ active: filter === 'open' }"
        @click="filter = 'open'"
      >
        未解决 {{ openCount }}
      </button>
      <button
        type="button"
        class="chip"
        :class="{ active: filter === 'resolved' }"
        @click="filter = 'resolved'"
      >
        已解决 {{ resolvedCount }}
      </button>
    </div>

    <div class="commentsList" v-if="visibleComments.length">
      <div
        class="commentItem"
        v-for="item in visibleComments"
        :key="item.id"
        :class="{ resolved: item.resolved }"
      >
        <div class="commentMeta">
          <span class="author">{{ item.author || '我' }}</span>
          <span class="time">{{ formatTime(item.updatedAt || item.createdAt) }}</span>
          <span class="status" v-if="item.resolved">已解决</span>
        </div>
        <div class="commentText">{{ item.text }}</div>

        <div class="replies" v-if="item.replies && item.replies.length">
          <div class="reply" v-for="reply in item.replies" :key="reply.id">
            <div class="commentMeta">
              <span class="author">{{ reply.author || '我' }}</span>
              <span class="time">{{ formatTime(reply.createdAt) }}</span>
            </div>
            <div class="commentText">{{ reply.text }}</div>
          </div>
        </div>

        <div class="commentActions" v-if="!isReadonly">
          <el-button link type="primary" size="small" @click="startReply(item)"
            >回复</el-button
          >
          <el-button link type="primary" size="small" @click="editComment(item)"
            >编辑</el-button
          >
          <el-button link type="primary" size="small" @click="toggleResolved(item)">
            {{ item.resolved ? '重开' : '标记已解决' }}
          </el-button>
          <el-button link type="danger" size="small" @click="removeComment(item)"
            >删除</el-button
          >
        </div>

        <div class="inlineComposer" v-if="replyToId === item.id && !isReadonly">
          <el-input
            v-model.trim="replyDraft"
            type="textarea"
            :rows="2"
            :placeholder="$t('toolbar.replyPlaceholder') || '回复这条批注…'"
          />
          <div class="composerActions">
            <el-button size="small" @click="cancelReply">取消</el-button>
            <el-button
              size="small"
              type="primary"
              :disabled="!replyDraft"
              @click="saveReply(item)"
              >发送回复</el-button
            >
          </div>
        </div>
      </div>
    </div>
    <div class="empty" v-else>
      {{ emptyText }}
    </div>

    <div class="composer" v-if="!isReadonly">
      <el-input
        v-model.trim="draft"
        type="textarea"
        :rows="3"
        :placeholder="
          editingId
            ? $t('toolbar.commentEditPlaceholder') || '编辑批注…'
            : $t('toolbar.commentPlaceholder') || '写下批注…'
        "
      />
      <div class="composerActions">
        <el-button v-if="editingId" @click="cancelEdit">取消编辑</el-button>
        <el-button type="primary" :disabled="!draft" @click="saveComment">
          {{ editingId ? '保存' : '添加批注' }}
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

const normalizeComment = item => {
  if (!item || typeof item !== 'object') {
    return {
      id: createId(),
      text: String(item || ''),
      author: '我',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      resolved: false,
      replies: []
    }
  }
  return {
    id: item.id || createId(),
    text: String(item.text || ''),
    author: item.author || '我',
    createdAt: item.createdAt || Date.now(),
    updatedAt: item.updatedAt || item.createdAt || Date.now(),
    resolved: !!item.resolved,
    replies: Array.isArray(item.replies)
      ? item.replies.map(reply => ({
          id: reply?.id || createId(),
          text: String(reply?.text || ''),
          author: reply?.author || '我',
          createdAt: reply?.createdAt || Date.now()
        }))
      : []
  }
}

export default {
  name: 'NodeCommentsDialog',
  data() {
    return {
      visible: false,
      nodes: [],
      comments: [],
      draft: '',
      editingId: '',
      replyToId: '',
      replyDraft: '',
      filter: 'all'
    }
  },
  computed: {
    ...mapState(useAppStore, {
      isReadonly: 'isReadonly'
    }),
    ...mapState(useThemeStore, {
      isDark: 'isDark'
    }),
    openCount() {
      return this.comments.filter(item => !item.resolved).length
    },
    resolvedCount() {
      return this.comments.filter(item => item.resolved).length
    },
    visibleComments() {
      if (this.filter === 'open') {
        return this.comments.filter(item => !item.resolved)
      }
      if (this.filter === 'resolved') {
        return this.comments.filter(item => item.resolved)
      }
      return this.comments
    },
    emptyText() {
      if (this.filter === 'open') {
        return this.$t('toolbar.noOpenComments') || '没有未解决批注'
      }
      if (this.filter === 'resolved') {
        return this.$t('toolbar.noResolvedComments') || '没有已解决批注'
      }
      return this.$t('toolbar.noNodeComments') || '暂无批注'
    }
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
        this.$message?.warning?.(
          this.$t('toolbar.commentNeedSelection') || '请先选择主题'
        )
        return
      }
      const first = this.nodes[0]
      const list = first?.getData?.('comments')
      this.comments = Array.isArray(list)
        ? list.map(normalizeComment)
        : []
      this.draft = ''
      this.editingId = ''
      this.replyToId = ''
      this.replyDraft = ''
      this.filter = 'all'
      this.visible = true
    },
    close() {
      this.visible = false
      this.nodes = []
      this.comments = []
      this.draft = ''
      this.editingId = ''
      this.replyToId = ''
      this.replyDraft = ''
      this.filter = 'all'
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
    editComment(item) {
      if (!item) return
      this.editingId = item.id
      this.draft = item.text || ''
      this.cancelReply()
    },
    cancelEdit() {
      this.editingId = ''
      this.draft = ''
    },
    startReply(item) {
      this.replyToId = item.id
      this.replyDraft = ''
      this.cancelEdit()
    },
    cancelReply() {
      this.replyToId = ''
      this.replyDraft = ''
    },
    removeComment(item) {
      const index = this.comments.findIndex(row => row.id === item.id)
      if (index < 0) return
      this.comments.splice(index, 1)
      this.persist()
      if (this.editingId === item.id) this.cancelEdit()
      if (this.replyToId === item.id) this.cancelReply()
    },
    toggleResolved(item) {
      item.resolved = !item.resolved
      item.updatedAt = Date.now()
      this.persist()
    },
    saveReply(item) {
      const text = String(this.replyDraft || '').trim()
      if (!text || !item) return
      if (!Array.isArray(item.replies)) item.replies = []
      item.replies.push({
        id: createId(),
        text,
        author: '我',
        createdAt: Date.now()
      })
      item.updatedAt = Date.now()
      // replying reopens by default for review workflows
      item.resolved = false
      this.persist()
      this.cancelReply()
    },
    saveComment() {
      const text = String(this.draft || '').trim()
      if (!text) return
      const now = Date.now()
      if (this.editingId) {
        const target = this.comments.find(item => item.id === this.editingId)
        if (target) {
          target.text = text
          target.updatedAt = now
        }
      } else {
        this.comments.unshift({
          id: createId(),
          text,
          author: '我',
          createdAt: now,
          updatedAt: now,
          resolved: false,
          replies: []
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
  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
  }
  .chip {
    border: 1px solid rgba(15, 23, 42, 0.12);
    background: rgba(15, 23, 42, 0.04);
    border-radius: 999px;
    padding: 4px 10px;
    font: inherit;
    font-size: 12px;
    cursor: pointer;
    color: inherit;
  }
  .chip.active {
    border-color: #2563eb;
    background: rgba(37, 99, 235, 0.12);
  }
  .commentsList {
    max-height: 320px;
    overflow: auto;
    margin-bottom: 12px;
  }
  .commentItem {
    padding: 10px 0;
    border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  }
  .commentItem.resolved {
    opacity: 0.72;
  }
  .commentMeta {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    opacity: 0.75;
    margin-bottom: 4px;
  }
  .status {
    margin-left: auto;
    color: #16a34a;
  }
  .commentText {
    white-space: pre-wrap;
    line-height: 1.5;
  }
  .replies {
    margin-top: 8px;
    margin-left: 12px;
    padding-left: 10px;
    border-left: 2px solid rgba(37, 99, 235, 0.25);
  }
  .reply {
    margin-bottom: 8px;
  }
  .commentActions {
    margin-top: 6px;
  }
  .inlineComposer,
  .composer {
    margin-top: 8px;
  }
  .composerActions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 8px;
  }
  .empty {
    opacity: 0.6;
    margin-bottom: 12px;
  }
}
.isDark {
  .chip {
    border-color: rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.06);
  }
  .commentItem {
    border-bottom-color: rgba(255, 255, 255, 0.08);
  }
}
</style>
