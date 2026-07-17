<template>
  <Sidebar
    ref="sidebar"
    :title="$t('bookmark.title') || '书签'"
    :force-show="activeSidebar === 'bookmark'"
  >
    <div class="bookmarkSidebar" :class="{ isDark: isDark }">
      <div class="toolbarRow">
        <el-button size="small" :disabled="!canToggle" @click="toggleSelected">
          {{
            selectedBookmarked
              ? $t('bookmark.removeSelected') || '取消所选书签'
              : $t('bookmark.addSelected') || '收藏所选'
          }}
        </el-button>
        <el-button size="small" @click="refresh">
          {{ $t('bookmark.refresh') || '刷新' }}
        </el-button>
      </div>
      <div class="hint">
        {{
          $t('bookmark.hint') ||
          '收藏主题后可在此快速跳转。快捷键 Alt+Shift+B 切换收藏。'
        }}
      </div>
      <div class="stats">
        {{
          $t('bookmark.count', { count: bookmarks.length }) ||
          `共 ${bookmarks.length} 个书签`
        }}
      </div>
      <div class="list customScrollbar" v-if="bookmarks.length">
        <button
          v-for="item in bookmarks"
          :key="item.uid + '@' + item.sheetId"
          type="button"
          class="bookmarkItem"
          :class="{ active: item.uid && item.uid === activeUid }"
          @click="jumpTo(item)"
        >
          <span class="star">★</span>
          <span class="meta">
            <span class="title">{{ item.text }}</span>
            <span class="path" v-if="item.sheetName || item.path">
              <template v-if="item.sheetName">[{{ item.sheetName }}] </template>
              {{ item.path }}
            </span>
          </span>
        </button>
      </div>
      <div class="empty" v-else>
        {{ $t('bookmark.empty') || '还没有收藏的主题' }}
      </div>
    </div>
  </Sidebar>
</template>

<script>
import Sidebar from './Sidebar.vue'
import { mapState } from 'pinia'
import { useAppStore } from '@/stores/app'
import { useThemeStore } from '@/stores/theme'
import { getData } from '@/api'
import { ensureMindmapWorkbook } from '@/services/mindmapWorkbook'
import {
  collectBookmarksFromWorkbook,
  isNodeBookmarked,
  toggleNodesBookmark
} from '@/services/nodeBookmarks'

export default {
  name: 'BookmarkSidebar',
  components: { Sidebar },
  props: {
    mindMap: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      bookmarks: [],
      activeNodes: [],
      activeUid: ''
    }
  },
  computed: {
    ...mapState(useAppStore, {
      activeSidebar: 'activeSidebar'
    }),
    ...mapState(useThemeStore, {
      isDark: 'isDark'
    }),
    canToggle() {
      return this.activeNodes.length > 0
    },
    selectedBookmarked() {
      return (
        this.activeNodes.length > 0 &&
        this.activeNodes.every(node => isNodeBookmarked(node))
      )
    }
  },
  watch: {
    activeSidebar(value) {
      if (value === 'bookmark') {
        this.refresh()
      }
    },
    mindMap: {
      immediate: true,
      handler(value, oldValue) {
        if (oldValue) {
          oldValue.off?.('data_change', this.refresh)
          oldValue.off?.('node_active', this.onNodeActive)
        }
        if (value) {
          value.on?.('data_change', this.refresh)
          value.on?.('node_active', this.onNodeActive)
          this.refresh()
        }
      }
    }
  },
  created() {
    this.$bus.$on('bookmarkRefresh', this.refresh)
    this.$bus.$on('toggleBookmarkSelected', this.toggleSelected)
  },
  beforeUnmount() {
    this.$bus.$off('bookmarkRefresh', this.refresh)
    this.$bus.$off('toggleBookmarkSelected', this.toggleSelected)
    if (this.mindMap) {
      this.mindMap.off?.('data_change', this.refresh)
      this.mindMap.off?.('node_active', this.onNodeActive)
    }
  },
  methods: {
    onNodeActive(...args) {
      this.activeNodes = [...(args[1] || [])]
      const first = this.activeNodes[0]
      this.activeUid = first?.getData?.('uid') || first?.uid || ''
    },

    refresh() {
      try {
        const workbook = ensureMindmapWorkbook(getData() || {})
        this.bookmarks = collectBookmarksFromWorkbook(workbook)
      } catch (error) {
        console.error('bookmark refresh failed', error)
        this.bookmarks = []
      }
    },

    toggleSelected() {
      if (!this.canToggle) {
        this.$message.warning(
          this.$t('bookmark.needSelection') || '请先选择主题'
        )
        return
      }
      const wasBookmarked = this.selectedBookmarked
      const count = toggleNodesBookmark(this.activeNodes)
      if (count > 0) {
        this.refresh()
        this.$message.success(
          wasBookmarked
            ? this.$t('bookmark.removed') || '已取消收藏'
            : this.$t('bookmark.added') || '已收藏主题'
        )
      }
    },

    jumpTo(item) {
      if (!item?.uid || !this.mindMap) return
      const workbook = ensureMindmapWorkbook(getData() || {})
      if (item.sheetId && item.sheetId !== workbook.activeSheetId) {
        this.$bus.$emit('mindmapSwitchSheet', item.sheetId)
        setTimeout(() => {
          this.mindMap.renderer?.expandToNodeUid?.(item.uid, () => {
            this.mindMap.renderer?.moveNodeToCenter?.(
              this.mindMap.renderer.findNodeByUid?.(item.uid)
            )
          })
        }, 100)
        return
      }
      if (typeof this.mindMap.renderer?.expandToNodeUid === 'function') {
        this.mindMap.renderer.expandToNodeUid(item.uid, () => {
          const node = this.mindMap.renderer.findNodeByUid?.(item.uid)
          if (node && this.mindMap.renderer.moveNodeToCenter) {
            this.mindMap.renderer.moveNodeToCenter(node)
          }
          if (node && this.mindMap.renderer.clearActiveNode) {
            this.mindMap.renderer.clearActiveNode()
            this.mindMap.renderer.addActiveNode?.(node)
          }
        })
      }
    }
  }
}
</script>

<style lang="less" scoped>
.bookmarkSidebar {
  padding: 12px;
  color: rgba(15, 23, 42, 0.9);

  &.isDark {
    color: rgba(255, 255, 255, 0.92);

    .bookmarkItem {
      background: rgba(255, 255, 255, 0.04);
      border-color: rgba(255, 255, 255, 0.08);

      &:hover,
      &.active {
        background: rgba(255, 255, 255, 0.1);
      }

      .path {
        color: rgba(255, 255, 255, 0.55);
      }
    }

    .empty,
    .hint,
    .stats {
      color: rgba(255, 255, 255, 0.62);
    }
  }

  .toolbarRow {
    display: flex;
    gap: 8px;
    margin-bottom: 10px;
  }

  .hint,
  .stats {
    font-size: 12px;
    line-height: 1.5;
    margin-bottom: 8px;
    color: rgba(15, 23, 42, 0.55);
  }

  .list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: calc(100vh - 280px);
    overflow: auto;
  }

  .bookmarkItem {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    width: 100%;
    text-align: left;
    border: 1px solid rgba(15, 23, 42, 0.08);
    background: rgba(15, 23, 42, 0.02);
    border-radius: 10px;
    padding: 10px;
    cursor: pointer;
    color: inherit;

    &:hover,
    &.active {
      background: rgba(37, 99, 235, 0.08);
      border-color: rgba(37, 99, 235, 0.22);
    }

    .star {
      color: #f59e0b;
      line-height: 1.2;
    }

    .meta {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .title {
      font-size: 13px;
      font-weight: 600;
      word-break: break-word;
    }

    .path {
      font-size: 11px;
      color: rgba(15, 23, 42, 0.5);
      word-break: break-word;
    }
  }

  .empty {
    padding: 28px 8px;
    text-align: center;
    font-size: 13px;
    color: rgba(15, 23, 42, 0.45);
  }
}
</style>
