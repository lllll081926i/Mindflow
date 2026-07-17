<template>
  <Sidebar
    ref="sidebar"
    :title="$t('outline.title')"
    :force-show="activeSidebar === 'outline'"
  >
    <div class="btnList">
      <el-tooltip
        class="item"
        effect="dark"
        :content="$t('outline.print')"
        placement="top"
      >
        <div class="btn" @click="onPrint">
          <span class="icon iconfont iconprinting"></span>
        </div>
      </el-tooltip>
      <el-tooltip
        class="item"
        effect="dark"
        :content="$t('outline.fullscreen')"
        placement="top"
      >
        <div
          class="btn"
          :class="{ isDark: isDark }"
          @click="onChangeToOutlineEdit"
        >
          <span class="icon iconfont iconquanping1"></span>
        </div>
      </el-tooltip>
      <el-tooltip
        class="item"
        effect="dark"
        :content="$t('outline.bookmarksOnly') || '仅显示书签'"
        placement="top"
      >
        <div
          class="btn"
          :class="{ isDark: isDark, active: bookmarksOnly }"
          @click="toggleBookmarksOnly"
        >
          <span class="starBtn">★</span>
        </div>
      </el-tooltip>
    </div>
    <input
      v-model.trim="outlineKeyword"
      class="outlineSearch"
      type="search"
      :placeholder="$t('outline.searchPlaceholder')"
    />
    <div v-if="markerFilterToken" class="filterChip">
      <span
        >{{ $t('outline.markerFilter') || '标记筛选' }}:
        {{ markerFilterToken }}</span
      >
      <button type="button" class="chipClear" @click="clearMarkerFilter">
        ×
      </button>
    </div>
    <div v-if="bookmarksOnly" class="filterChip">
      <span>{{ $t('outline.bookmarksOnly') || '仅显示书签' }}</span>
      <button type="button" class="chipClear" @click="toggleBookmarksOnly">
        ×
      </button>
    </div>
    <Outline
      :mindMap="mindMap"
      @scrollTo="onScrollTo"
      ref="outlineRef"
      :keyword="outlineKeyword"
      :bookmarks-only="bookmarksOnly"
    ></Outline>
  </Sidebar>
</template>

<script>
import Sidebar from './Sidebar.vue'
import { mapState } from 'pinia'
import Outline from './Outline.vue'
import { printOutline } from '@/utils'
import { useAppStore } from '@/stores/app'
import { useThemeStore } from '@/stores/theme'
import { setActiveSidebar, setIsOutlineEdit } from '@/stores/runtime'

// 大纲侧边栏
export default {
  created() {
    this.$bus.$on('printOutline', this.onPrint)
    this.$bus.$on('outlineSetKeyword', this.onOutlineSetKeyword)
    this.$bus.$on('applyMarkerFilter', this.onMarkerFilter)
    this.$bus.$on('outlineToggleBookmarksOnly', this.toggleBookmarksOnly)
  },
  beforeUnmount() {
    this.$bus.$off('printOutline', this.onPrint)
    this.$bus.$off('outlineSetKeyword', this.onOutlineSetKeyword)
    this.$bus.$off('applyMarkerFilter', this.onMarkerFilter)
    this.$bus.$off('outlineToggleBookmarksOnly', this.toggleBookmarksOnly)
  },
  data() {
    return {
      outlineKeyword: '',
      markerFilterToken: '',
      bookmarksOnly: false
    }
  },
  components: {
    Sidebar,
    Outline
  },
  props: {
    mindMap: {
      type: Object
    }
  },
  computed: {
    ...mapState(useThemeStore, {
      isDark: 'isDark'
    }),
    ...mapState(useAppStore, {
      activeSidebar: 'activeSidebar'
    })
  },
  methods: {
    onOutlineSetKeyword(keyword = '') {
      this.outlineKeyword = String(keyword || '')
    },
    onMarkerFilter(token = '') {
      this.markerFilterToken = String(token || '')
    },
    clearMarkerFilter() {
      this.markerFilterToken = ''
      this.$bus.$emit('applyMarkerFilter', '')
      this.$bus.$emit('outlineSetMarkerFilter', '')
      this.outlineKeyword = ''
    },

    toggleBookmarksOnly() {
      this.bookmarksOnly = !this.bookmarksOnly
    },

    onChangeToOutlineEdit() {
      setActiveSidebar('')
      setIsOutlineEdit(true)
    },

    onScrollTo(y) {
      let container = this.$refs.sidebar.getEl()
      let height = container.offsetHeight
      let top = container.scrollTop
      if (y > top + height) {
        container.scrollTo(0, y - height / 2)
      }
    },

    // 打印
    onPrint() {
      printOutline(this.$refs.outlineRef.$el)
    }
  }
}
</script>

<style lang="less" scoped>
.filterChip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin: 0 12px 8px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.1);
  color: inherit;
  font-size: 12px;
}
.chipClear {
  border: 0;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  color: inherit;
}
.outlineSearch {
  width: calc(100% - 24px);
  margin: 10px 12px 8px;
  height: 34px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid rgba(15,23,42,0.1);
  background: rgba(255,255,255,0.92);
  color: inherit;
  font: inherit;
}

.btnList {
  position: absolute;
  right: 50px;
  top: 12px;
  display: flex;
  align-items: center;

  .btn {
    cursor: pointer;
    margin-left: 12px;

    &.isDark {
      color: #fff;
    }

    &.active {
      color: #f59e0b;
    }

    .starBtn {
      font-size: 14px;
      line-height: 1;
    }
  }
}
</style>
