<template>
  <Teleport to="body">
    <div
      v-if="isSourceCodeEdit"
      class="sourceCodeEditContainer"
      :class="{ isDark: isDark }"
    >
      <div class="sourceCodePanel">
        <div class="title">{{ $t('toolbar.sourceCodeEdit') || '源码编辑' }}</div>
        <div class="actions">
          <el-button size="small" @click="formatJson">格式化</el-button>
          <el-button size="small" type="primary" :disabled="isReadonly" @click="applyJson">
            {{ $t('dialog.confirm') || '应用' }}
          </el-button>
          <el-button size="small" @click="close">{{ $t('dialog.cancel') || '关闭' }}</el-button>
        </div>
      </div>
      <textarea
        ref="sourceTextarea"
        class="sourceCodeTextarea"
        v-model="sourceText"
        :readonly="isReadonly"
        spellcheck="false"
      ></textarea>
      <div v-if="errorMessage" class="sourceCodeError">{{ errorMessage }}</div>
    </div>
  </Teleport>
</template>

<script>
import { mapState } from 'pinia'
import { getData, storeData } from '@/api'
import { useAppStore } from '@/stores/app'
import { useThemeStore } from '@/stores/theme'
import { setIsSourceCodeEdit } from '@/stores/runtime'
import { ensureMindmapWorkbook } from '@/services/mindmapWorkbook'

export default {
  name: 'SourceCodeEdit',
  props: {
    mindMap: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      sourceText: '',
      errorMessage: ''
    }
  },
  computed: {
    ...mapState(useAppStore, {
      isSourceCodeEdit: 'isSourceCodeEdit',
      isReadonly: 'isReadonly'
    }),
    ...mapState(useThemeStore, {
      isDark: 'isDark'
    })
  },
  watch: {
    isSourceCodeEdit(value) {
      if (value) {
        this.loadSource()
        this.$nextTick(() => this.$refs.sourceTextarea?.focus?.())
      }
    }
  },
  created() {
    this.$bus.$on('openSourceCodeEdit', this.open)
  },
  beforeUnmount() {
    this.$bus.$off('openSourceCodeEdit', this.open)
  },
  methods: {
    open() {
      setIsSourceCodeEdit(true)
    },
    close() {
      this.errorMessage = ''
      setIsSourceCodeEdit(false)
    },
    loadSource() {
      try {
        let data = null
        if (this.mindMap?.getData) {
          const live = this.mindMap.getData(true)
          data = ensureMindmapWorkbook({
            ...(getData() || {}),
            ...(live || {})
          })
        } else {
          data = ensureMindmapWorkbook(getData() || {})
        }
        this.sourceText = JSON.stringify(data, null, 2)
        this.errorMessage = ''
      } catch (error) {
        this.errorMessage = error?.message || '读取失败'
      }
    },
    formatJson() {
      try {
        const parsed = JSON.parse(this.sourceText)
        this.sourceText = JSON.stringify(parsed, null, 2)
        this.errorMessage = ''
      } catch (error) {
        this.errorMessage = error?.message || 'JSON 无效'
      }
    },
    applyJson() {
      if (this.isReadonly) return
      try {
        const parsed = JSON.parse(this.sourceText)
        if (!parsed || typeof parsed !== 'object' || !parsed.root) {
          throw new Error('缺少 root 节点')
        }
        const workbook = ensureMindmapWorkbook(parsed)
        storeData(workbook)
        this.$bus.$emit('setData', workbook)
        this.$message.success(this.$t('toolbar.sourceCodeApplied') || '源码已应用')
        this.close()
      } catch (error) {
        this.errorMessage = error?.message || 'JSON 无效'
        this.$message.error(this.errorMessage)
      }
    }
  }
}
</script>

<style lang="less" scoped>
.sourceCodeEditContainer {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  flex-direction: column;
  background: rgba(248, 250, 252, 0.98);
  color: #0f172a;
}
.sourceCodeEditContainer.isDark {
  background: rgba(15, 18, 24, 0.98);
  color: rgba(255, 255, 255, 0.92);
}
.sourceCodeHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
}
.sourceCodeTextarea {
  flex: 1;
  width: 100%;
  border: none;
  outline: none;
  resize: none;
  padding: 16px;
  font: 13px/1.55 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  background: transparent;
  color: inherit;
}
.sourceCodeError {
  padding: 8px 16px 12px;
  color: #dc2626;
  font-size: 12px;
}
</style>
