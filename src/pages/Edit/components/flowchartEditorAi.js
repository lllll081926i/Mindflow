import { isDesktopApp } from '@/platform'
import { normalizeFlowchartAiResult } from '@/services/flowchartDocument'
import {
  buildAiCreateFlowchartMessages,
  checkAiAvailability,
  requestAiStream
} from '@/services/aiService'

export const flowchartAiMethods = {
  isCurrentFlowchartAiRequest(requestToken) {
    return (
      !this.isFlowchartUnmounted &&
      this.flowchartAiRequestToken === requestToken
    )
  },

  cancelFlowchartAiRequest({ resetGenerating = false } = {}) {
    this.flowchartAiRequestToken += 1
    const aiClient = this.flowchartAiClient
    this.flowchartAiClient = null
    if (aiClient && typeof aiClient.stop === 'function') {
      aiClient.stop()
    }
    if (resetGenerating) {
      this.aiBuffer = ''
      this.isGenerating = false
      this.pendingFlowchartAiResult = null
      this.flowchartAiPreviewVisible = false
    }
  },

  async confirmFlowchartAiPreview(result) {
    const nodes = Array.isArray(result?.flowchartData?.nodes)
      ? result.flowchartData.nodes.length
      : 0
    const edges = Array.isArray(result?.flowchartData?.edges)
      ? result.flowchartData.edges.length
      : 0
    if (nodes <= 0) {
      this.$message.warning(this.$t('flowchart.aiPreviewEmpty'))
      return false
    }
    try {
      await this.$confirm(
        this.$t('flowchart.aiPreviewMessage', {
          nodes,
          edges
        }),
        this.$t('flowchart.aiPreviewTitle'),
        {
          type: 'info',
          confirmButtonText: this.$t('flowchart.aiPreviewConfirm'),
          cancelButtonText: this.$t('flowchart.aiPreviewCancel')
        }
      )
      return true
    } catch (_error) {
      return false
    }
  },

  async generateWithAi() {
    if (this.isGenerating || this.isFlowchartUnmounted) return
    let prompt
    try {
      const result = await this.$prompt(
        this.$t('flowchart.aiPromptMessage'),
        this.$t('flowchart.aiPromptTitle'),
        {
          inputPlaceholder: this.$t('flowchart.aiPromptPlaceholder')
        }
      )
      prompt = String(result.value || '').trim()
    } catch (_error) {
      return
    }
    if (this.isFlowchartUnmounted) return
    if (!prompt) return
    try {
      await checkAiAvailability({
        aiConfig: this.aiConfig,
        t: this.$t,
        desktop: isDesktopApp()
      })
    } catch (error) {
      if (this.isFlowchartUnmounted) return
      if (error.code === 'AI_CONFIG_INVALID') {
        this.flowchartAiConfigDialogVisible = true
      }
      this.$message.error(error?.message || this.$t('ai.connectFailed'))
      return
    }
    if (this.isFlowchartUnmounted) return
    const requestToken = this.flowchartAiRequestToken + 1
    this.flowchartAiRequestToken = requestToken
    this.aiBuffer = ''
    this.pendingFlowchartAiResult = null
    this.isGenerating = true
    this.$message.info(this.$t('flowchart.aiGenerating'))
    const streamRequest = requestAiStream({
      aiConfig: this.aiConfig,
      messages: buildAiCreateFlowchartMessages({
        input: prompt,
        t: this.$t
      }),
      progress: content => {
        if (!this.isCurrentFlowchartAiRequest(requestToken)) {
          return
        }
        this.aiBuffer = String(content || '')
      },
      end: async content => {
        if (!this.isCurrentFlowchartAiRequest(requestToken)) {
          return
        }
        try {
          this.aiBuffer = String(content || this.aiBuffer || '')
          const result = normalizeFlowchartAiResult(this.aiBuffer)
          if (!this.isCurrentFlowchartAiRequest(requestToken)) {
            return
          }
          this.openFlowchartAiPreview(result)
        } catch (error) {
          this.pendingFlowchartAiResult = null
          this.$message.error(error?.message || this.$t('ai.generationFailed'))
        } finally {
          if (this.isCurrentFlowchartAiRequest(requestToken)) {
            this.flowchartAiClient = null
            this.isGenerating = false
          }
        }
      },
      error: error => {
        if (!this.isCurrentFlowchartAiRequest(requestToken)) {
          return
        }
        this.flowchartAiClient = null
        this.isGenerating = false
        this.pendingFlowchartAiResult = null
        this.$message.error(error?.message || this.$t('ai.generationFailed'))
      }
    })
    if (this.isCurrentFlowchartAiRequest(requestToken)) {
      this.flowchartAiClient = streamRequest.ai
    } else {
      streamRequest.ai?.stop?.()
    }
  }
}
