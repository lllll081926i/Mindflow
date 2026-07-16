<template>
  <Sidebar
    ref="sidebar"
    :title="$t('markerLegend.title') || '标记图例'"
    :force-show="activeSidebar === 'markerLegend'"
  >
    <div class="markerLegend" :class="{ isDark: isDark }">
      <div class="legendToolbar">
        <el-button size="small" @click="clearFilter">{{
          $t('markerLegend.clearFilter') || '清除筛选'
        }}</el-button>
        <el-button size="small" @click="openIconSidebar">{{
          $t('markerLegend.openIcons') || '打开图标库'
        }}</el-button>
      </div>
      <div class="quickFilters">
        <button type="button" class="chip" :class="{ isActive: activeFilter === 'has:comment' }" @click="toggleQuick('has:comment')">批注</button>
        <button type="button" class="chip" :class="{ isActive: activeFilter === 'has:note' }" @click="toggleQuick('has:note')">备注</button>
        <button type="button" class="chip" :class="{ isActive: activeFilter === 'has:link' }" @click="toggleQuick('has:link')">链接</button>
      </div>

      <div class="legendHint">
        {{
          $t('markerLegend.hint') ||
          '点击图例可筛选画布；再次点击同一图例可取消筛选。选中主题后点图例可直接打标。'
        }}
      </div>

      <div class="group" v-for="group in legendGroups" :key="group.type">
        <div class="groupTitle">
          <span>{{ group.name }}</span>
          <span class="groupCount">{{ countsByType[group.type] || 0 }}</span>
        </div>
        <div class="iconRow">
          <button
            v-for="icon in group.list"
            :key="group.type + '_' + icon.name"
            type="button"
            class="iconBtn"
            :class="{
              isActive: activeFilter === group.type + '_' + icon.name,
              hasUsage: (countsByKey[group.type + '_' + icon.name] || 0) > 0
            }"
            :title="legendTitle(group, icon)"
            @click="onLegendClick(group.type, icon.name)"
            v-html="getHtml(icon.icon)"
          ></button>
        </div>
      </div>

      <div class="statsBox" v-if="totalMarked > 0">
        <div class="statsTitle">{{ $t('markerLegend.usage') || '画布使用统计' }}</div>
        <div class="statsList">
          <div
            v-for="item in usedMarkers"
            :key="item.key"
            class="statsItem"
            @click="applyFilter(item.key)"
          >
            <span class="statsIcon" v-html="item.html"></span>
            <span class="statsName">{{ item.label }}</span>
            <span class="statsCount">{{ item.count }}</span>
          </div>
        </div>
      </div>
      <div class="empty" v-else>
        {{ $t('markerLegend.empty') || '当前画布还没有标记' }}
      </div>
    </div>
  </Sidebar>
</template>

<script>
import Sidebar from './Sidebar.vue'
import { mapState } from 'pinia'
import { nodeIconList } from 'simple-mind-map/src/svg/icons'
import { useAppStore } from '@/stores/app'
import { useThemeStore } from '@/stores/theme'
import { setActiveSidebar } from '@/stores/runtime'

const LEGEND_TYPES = ['priority', 'progress', 'expression', 'sign']

export default {
  name: 'MarkerLegendSidebar',
  components: { Sidebar },
  props: {
    mindMap: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      activeFilter: '',
      countsByKey: {},
      activeNodes: []
    }
  },
  computed: {
    ...mapState(useAppStore, {
      activeSidebar: 'activeSidebar'
    }),
    ...mapState(useThemeStore, {
      isDark: 'isDark'
    }),
    legendGroups() {
      return (nodeIconList || []).filter(group =>
        LEGEND_TYPES.includes(group.type)
      )
    },
    countsByType() {
      const map = {}
      Object.keys(this.countsByKey).forEach(key => {
        const type = key.split('_')[0]
        map[type] = (map[type] || 0) + (this.countsByKey[key] || 0)
      })
      return map
    },
    totalMarked() {
      return Object.values(this.countsByKey).reduce(
        (sum, n) => sum + Number(n || 0),
        0
      )
    },
    usedMarkers() {
      const iconMap = new Map()
      this.legendGroups.forEach(group => {
        group.list.forEach(icon => {
          iconMap.set(group.type + '_' + icon.name, {
            group,
            icon,
            html: this.getHtml(icon.icon)
          })
        })
      })
      return Object.keys(this.countsByKey)
        .filter(key => this.countsByKey[key] > 0)
        .map(key => {
          const meta = iconMap.get(key)
          return {
            key,
            count: this.countsByKey[key],
            html: meta?.html || '',
            label: meta
              ? `${meta.group.name} ${meta.icon.name}`
              : key
          }
        })
        .sort((a, b) => b.count - a.count)
    }
  },
  watch: {
    activeSidebar(value) {
      if (value === 'markerLegend') {
        this.refreshCounts()
      }
    },
    mindMap: {
      immediate: true,
      handler(value, oldValue) {
        if (oldValue) {
          oldValue.off?.('data_change', this.refreshCounts)
          oldValue.off?.('node_active', this.onNodeActive)
        }
        if (value) {
          value.on?.('data_change', this.refreshCounts)
          value.on?.('node_active', this.onNodeActive)
          this.refreshCounts()
        }
      }
    }
  },
  created() {
    this.$bus.$on('applyMarkerFilter', this.syncFilterFromBus)
  },
  beforeUnmount() {
    this.$bus.$off('applyMarkerFilter', this.syncFilterFromBus)
    if (this.mindMap) {
      this.mindMap.off?.('data_change', this.refreshCounts)
      this.mindMap.off?.('node_active', this.onNodeActive)
    }
  },
  methods: {
    getHtml(icon) {
      return /^<svg/.test(icon) ? icon : `<img src="${icon}" />`
    },
    legendTitle(group, icon) {
      const key = group.type + '_' + icon.name
      const count = this.countsByKey[key] || 0
      return `${group.name} ${icon.name} · ${count}`
    },
    onNodeActive(node, nodeList) {
      this.activeNodes = [...(nodeList || [])]
    },
    syncFilterFromBus(marker = '') {
      this.activeFilter = String(marker || '')
    },
    refreshCounts() {
      const counts = {}
      const walk = node => {
        if (!node) return
        const icons = node.getData?.('icon') || node.data?.icon || []
        if (Array.isArray(icons)) {
          icons.forEach(key => {
            if (!key) return
            counts[key] = (counts[key] || 0) + 1
          })
        }
        const children = node.children || node.nodeData?.children || []
        children.forEach(child => walk(child))
      }
      // prefer live renderer tree; fallback to data root
      const root =
        this.mindMap?.renderer?.root ||
        this.mindMap?.getData?.()?.root ||
        null
      if (root) walk(root)
      this.countsByKey = counts
    },
    applyFilter(key) {
      this.activeFilter = key
      this.$bus.$emit('applyMarkerFilter', key)
    },
    clearFilter() {
      this.activeFilter = ''
      this.$bus.$emit('applyMarkerFilter', '')
      this.$message?.success?.(
        this.$t('toolbar.markerFilterCleared') || '已清除标记筛选'
      )
    },
    openIconSidebar() {
      setActiveSidebar('nodeIconSidebar')
    },
    toggleQuick(token) {
      if (this.activeFilter === token) this.clearFilter()
      else this.applyFilter(token)
    },
    onLegendClick(type, name) {
      const key = type + '_' + name
      // If nodes selected, stamp marker first.
      if (this.activeNodes.length > 0) {
        this.activeNodes.forEach(node => {
          if (!node || typeof node.getData !== 'function') return
          const iconList = [...(node.getData('icon') || [])]
          const nextList = iconList.filter(
            item => !String(item).startsWith(type + '_')
          )
          nextList.push(key)
          if (typeof node.setIcon === 'function') node.setIcon(nextList)
          else if (node.mindMap?.execCommand) {
            node.mindMap.execCommand('SET_NODE_ICON', node, nextList)
          }
        })
        this.$nextTick(() => this.refreshCounts())
        this.$message?.success?.(
          this.$t('markerLegend.marked') || '已为所选主题打标'
        )
        return
      }
      // No selection: toggle filter
      if (this.activeFilter === key) {
        this.clearFilter()
      } else {
        this.applyFilter(key)
        this.$message?.success?.(
          (this.$t('toolbar.markerFilterApplied') || '已应用筛选') +
            ' ' +
            key
        )
      }
    }
  }
}
</script>

<style lang="less" scoped>
.markerLegend {
  padding: 12px;
  color: rgba(15, 23, 42, 0.9);
  &.isDark {
    color: rgba(255, 255, 255, 0.9);
  }
}
.legendToolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}
.quickFilters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}
.chip {
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: rgba(15, 23, 42, 0.04);
  color: inherit;
  border-radius: 999px;
  padding: 4px 10px;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}
.chip.isActive {
  border-color: #2563eb;
  background: rgba(37, 99, 235, 0.12);
}
.isDark .chip {
  border-color: rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
}
.legendHint {
  font-size: 12px;
  line-height: 1.5;
  opacity: 0.72;
  margin-bottom: 12px;
}
.group {
  margin-bottom: 14px;
}
.groupTitle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
}
.groupCount {
  font-weight: 500;
  opacity: 0.65;
}
.iconRow {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.iconBtn {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  background: rgba(15, 23, 42, 0.03);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 4px;
  opacity: 0.55;
  transition: all 0.15s ease;
  :deep(svg),
  :deep(img) {
    width: 22px;
    height: 22px;
  }
  &.hasUsage {
    opacity: 1;
  }
  &.isActive {
    border-color: #2563eb;
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.18);
    opacity: 1;
  }
}
.isDark .iconBtn {
  border-color: rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
}
.statsBox {
  margin-top: 8px;
  padding-top: 10px;
  border-top: 1px solid rgba(15, 23, 42, 0.08);
}
.isDark .statsBox {
  border-top-color: rgba(255, 255, 255, 0.08);
}
.statsTitle {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
}
.statsItem {
  display: grid;
  grid-template-columns: 28px 1fr auto;
  gap: 8px;
  align-items: center;
  padding: 6px 4px;
  border-radius: 8px;
  cursor: pointer;
  &:hover {
    background: rgba(37, 99, 235, 0.08);
  }
}
.statsIcon {
  width: 24px;
  height: 24px;
  display: inline-flex;
  :deep(svg),
  :deep(img) {
    width: 22px;
    height: 22px;
  }
}
.statsName {
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.statsCount {
  font-size: 12px;
  opacity: 0.7;
}
.empty {
  font-size: 12px;
  opacity: 0.65;
}
</style>
