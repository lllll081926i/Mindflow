<template>
  <div
    v-if="visible"
    class="flowchartCommandPaletteOverlay"
    @mousedown.self="$emit('close')"
  >
    <section
      class="flowchartCommandPalettePanel"
      role="dialog"
      aria-modal="true"
      :aria-label="labels.title"
    >
      <div class="flowchartCommandPaletteHeader">
        <div class="flowchartCommandPaletteTitle">{{ labels.title }}</div>
        <button
          type="button"
          class="flowchartCommandPaletteClose"
          :aria-label="labels.close"
          @click="$emit('close')"
        >
          x
        </button>
      </div>
      <input
        ref="inputRef"
        v-model.trim="keywordProxy"
        class="flowchartCommandPaletteInput"
        type="search"
        :placeholder="labels.placeholder"
        @keydown="onInputKeydown"
      />
      <div class="flowchartCommandPaletteList" role="listbox">
        <button
          v-for="(item, index) in filteredItems"
          :key="item.key"
          type="button"
          class="flowchartCommandPaletteItem"
          :class="{
            isDisabled: item.disabled,
            isActive: index === activeIndex
          }"
          :disabled="item.disabled"
          :aria-disabled="item.disabled ? 'true' : 'false'"
          :aria-selected="index === activeIndex ? 'true' : 'false'"
          role="option"
          @mouseenter="activeIndex = index"
          @click="$emit('execute', item)"
        >
          <span class="flowchartCommandPaletteItemLabel">{{ item.label }}</span>
          <span v-if="item.shortcut" class="flowchartCommandPaletteItemShortcut">
            {{ item.shortcut }}
          </span>
        </button>
        <div
          v-if="filteredItems.length <= 0"
          class="flowchartCommandPaletteEmpty"
        >
          {{ labels.empty }}
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import {
  filterCommandPaletteItems,
  moveCommandPaletteIndex,
  resolveActiveCommandPaletteItem
} from './editorCommandPalette'

export default {
  name: 'FlowchartCommandPalette',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    items: {
      type: Array,
      default: () => []
    },
    labels: {
      type: Object,
      required: true
    }
  },
  emits: ['close', 'execute', 'update:keyword'],
  data() {
    return {
      keyword: '',
      activeIndex: 0
    }
  },
  computed: {
    keywordProxy: {
      get() {
        return this.keyword
      },
      set(value) {
        this.keyword = value
        this.activeIndex = 0
      }
    },
    filteredItems() {
      return filterCommandPaletteItems(this.items, this.keyword)
    },
    activeItem() {
      return resolveActiveCommandPaletteItem(this.filteredItems, this.activeIndex)
    }
  },
  watch: {
    visible(value) {
      if (value) {
        this.keyword = ''
        this.activeIndex = 0
        this.$nextTick(() => {
          this.$refs.inputRef?.focus?.()
        })
      }
    },
    filteredItems(items) {
      if (!Array.isArray(items) || items.length <= 0) {
        this.activeIndex = 0
        return
      }
      if (this.activeIndex >= items.length) {
        this.activeIndex = items.length - 1
      }
    }
  },
  methods: {
    onInputKeydown(event) {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        this.activeIndex = moveCommandPaletteIndex(
          this.filteredItems,
          this.activeIndex,
          1
        )
        return
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        this.activeIndex = moveCommandPaletteIndex(
          this.filteredItems,
          this.activeIndex,
          -1
        )
        return
      }
      if (event.key === 'Enter') {
        event.preventDefault()
        if (this.activeItem) {
          this.$emit('execute', this.activeItem)
        }
        return
      }
      if (event.key === 'Escape') {
        event.preventDefault()
        this.$emit('close')
      }
    }
  }
}
</script>
