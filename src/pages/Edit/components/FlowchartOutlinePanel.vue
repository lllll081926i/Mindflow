<template>
  <div
    v-if="visible"
    class="flowchartOutlinePanel"
    role="dialog"
    aria-modal="false"
    :aria-label="labels.title"
  >
    <div class="flowchartOutlineHeader">
      <strong>{{ labels.title }}</strong>
      <button
        type="button"
        class="flowchartOutlineClose"
        :aria-label="labels.close"
        @click="$emit('close')"
      >
        x
      </button>
    </div>
    <input
      ref="outlineSearchRef"
      v-model.trim="keywordProxy"
      class="flowchartOutlineSearch"
      type="search"
      :placeholder="labels.searchPlaceholder"
    />
    <div v-if="!filteredTree.length" class="flowchartOutlineEmpty">
      {{ labels.empty }}
    </div>
    <div v-else class="flowchartOutlineTree" role="tree">
      <button
        v-for="item in filteredTree"
        :key="item.key"
        type="button"
        class="flowchartOutlineItem"
        :style="{ paddingLeft: 10 + item.depth * 14 + 'px' }"
        role="treeitem"
        @click="$emit('select', item)"
      >
        <span class="flowchartOutlineType">{{ item.typeLabel }}</span>
        <span class="flowchartOutlineText">{{ item.text }}</span>
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FlowchartOutlinePanel',
  props: {
    visible: { type: Boolean, default: false },
    items: { type: Array, default: () => [] },
    labels: { type: Object, default: () => ({}) },
    keyword: { type: String, default: '' }
  },
  emits: ['close', 'select', 'update:keyword'],
  watch: {
    visible(value) {
      if (!value) return
      this.$nextTick(() => {
        this.$refs.outlineSearchRef?.focus?.()
      })
    }
  },
  computed: {
    keywordProxy: {
      get() {
        return this.keyword
      },
      set(value) {
        this.$emit('update:keyword', value)
      }
    },
    filteredTree() {
      const keyword = String(this.keyword || '')
        .trim()
        .toLowerCase()
      if (!keyword) return this.items
      return this.items.filter(item => {
        const text = String(item.text || '').toLowerCase()
        const type = String(item.typeLabel || '').toLowerCase()
        return text.includes(keyword) || type.includes(keyword)
      })
    }
  }
}
</script>

<style lang="less" scoped>
.flowchartOutlinePanel {
  position: absolute;
  top: 72px;
  left: 16px;
  z-index: 30;
  width: min(320px, calc(100vw - 32px));
  max-height: min(70vh, 560px);
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12);
  color: inherit;
}
.flowchartEditor.isDark .flowchartOutlinePanel {
  background: rgba(24, 28, 34, 0.96);
  border-color: rgba(255, 255, 255, 0.1);
}
.flowchartOutlineHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.flowchartOutlineClose,
.flowchartOutlineSearch,
.flowchartOutlineItem {
  font: inherit;
  color: inherit;
}
.flowchartOutlineClose {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
}
.flowchartOutlineSearch {
  height: 34px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: rgba(255, 255, 255, 0.9);
}
.flowchartEditor.isDark .flowchartOutlineSearch {
  border-color: rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
}
.flowchartOutlineTree {
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 0;
}
.flowchartOutlineItem {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 32px;
  padding: 4px 8px;
  border-radius: 8px;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
}
.flowchartOutlineItem:hover {
  background: rgba(37, 99, 235, 0.08);
}
.flowchartOutlineType {
  flex: 0 0 auto;
  font-size: 11px;
  opacity: 0.6;
}
.flowchartOutlineText {
  flex: 1 1 auto;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.flowchartOutlineEmpty {
  font-size: 12px;
  opacity: 0.7;
  padding: 8px 2px;
}
</style>
