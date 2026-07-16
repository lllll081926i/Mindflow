<template>
  <el-dialog
    class="documentConvertPreviewDialog"
    :class="{ isDark: isDark }"
    v-model="visible"
    width="560px"
    :title="dialogTitle"
    @close="close"
  >
    <div class="hint">
      {{
        $t('documentConvert.previewHint') ||
        '默认转换全部页面。可取消部分页面后仅转换勾选项。'
      }}
    </div>
    <div class="list" v-if="items.length">
      <el-checkbox
        v-model="checkAll"
        :indeterminate="isIndeterminate"
        @change="onCheckAll"
      >
        {{ $t('documentConvert.selectAll') || '全选' }}
        ({{ selectedIds.length }}/{{ items.length }})
      </el-checkbox>
      <el-checkbox-group v-model="selectedIds" class="itemGroup">
        <div class="item" v-for="item in items" :key="item.id">
          <el-checkbox :label="item.id">
            <span class="itemName">{{ item.name }}</span>
            <span class="itemMeta">{{ item.meta }}</span>
          </el-checkbox>
        </div>
      </el-checkbox-group>
    </div>
    <div class="empty" v-else>
      {{ $t('documentConvert.noPages') || '没有可转换的页面' }}
    </div>
    <template #footer>
      <el-button @click="close">{{ $t('dialog.cancel') || '取消' }}</el-button>
      <el-button
        type="primary"
        :disabled="!selectedIds.length"
        @click="confirm"
      >
        {{ confirmLabel }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script>
import { mapState } from 'pinia'
import { useThemeStore } from '@/stores/theme'

export default {
  name: 'DocumentConvertPreviewDialog',
  data() {
    return {
      visible: false,
      mode: 'mindmap-to-flowchart',
      items: [],
      selectedIds: [],
      resolveFn: null,
      rejectFn: null
    }
  },
  computed: {
    ...mapState(useThemeStore, {
      isDark: 'isDark'
    }),
    dialogTitle() {
      if (this.mode === 'flowchart-to-mindmap') {
        return (
          this.$t('documentConvert.flowToMindTitle') || '选择要转换的流程页面'
        )
      }
      return (
        this.$t('documentConvert.mindToFlowTitle') || '选择要转换的导图画布'
      )
    },
    confirmLabel() {
      return (
        this.$t('documentConvert.confirmConvert', {
          count: this.selectedIds.length
        }) || `转换 ${this.selectedIds.length} 项`
      )
    },
    checkAll: {
      get() {
        return (
          this.items.length > 0 &&
          this.selectedIds.length === this.items.length
        )
      },
      set() {}
    },
    isIndeterminate() {
      return (
        this.selectedIds.length > 0 &&
        this.selectedIds.length < this.items.length
      )
    }
  },
  created() {
    this.$bus.$on('openDocumentConvertPreview', this.open)
  },
  beforeUnmount() {
    this.$bus.$off('openDocumentConvertPreview', this.open)
  },
  methods: {
    open(payload = {}) {
      this.mode = payload.mode || 'mindmap-to-flowchart'
      this.items = Array.isArray(payload.items) ? payload.items : []
      this.selectedIds = this.items.map(item => item.id)
      this.resolveFn = typeof payload.resolve === 'function' ? payload.resolve : null
      this.rejectFn = typeof payload.reject === 'function' ? payload.reject : null
      this.visible = true
    },
    onCheckAll(value) {
      this.selectedIds = value ? this.items.map(item => item.id) : []
    },
    close() {
      this.visible = false
      if (this.rejectFn) {
        const reject = this.rejectFn
        this.resolveFn = null
        this.rejectFn = null
        reject(new Error('cancelled'))
      }
    },
    confirm() {
      const selected = this.items.filter(item =>
        this.selectedIds.includes(item.id)
      )
      this.visible = false
      const resolve = this.resolveFn
      this.resolveFn = null
      this.rejectFn = null
      if (resolve) resolve({ mode: this.mode, selected })
    }
  }
}
</script>

<style lang="less" scoped>
.documentConvertPreviewDialog {
  .hint {
    font-size: 12px;
    opacity: 0.72;
    margin-bottom: 12px;
    line-height: 1.5;
  }
  .list {
    max-height: 360px;
    overflow: auto;
  }
  .itemGroup {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 10px;
  }
  .item {
    padding: 8px 10px;
    border-radius: 10px;
    border: 1px solid rgba(15, 23, 42, 0.08);
  }
  .itemName {
    font-weight: 600;
    margin-right: 8px;
  }
  .itemMeta {
    font-size: 12px;
    opacity: 0.65;
  }
  .empty {
    opacity: 0.65;
  }
}
.isDark {
  .item {
    border-color: rgba(255, 255, 255, 0.08);
  }
}
</style>
