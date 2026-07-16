<template>
  <main class="flowchartCanvasShell">
    <div
      ref="canvasRef"
      class="flowchartCanvasViewport"
      :class="{
        isPanning,
        hasDotsBackground: backgroundStyle === 'dots',
        hasGridBackground: backgroundStyle === 'grid'
      }"
      @mousedown="$emit('canvas-pointer-down', $event)"
      @dblclick="$emit('canvas-double-click', $event)"
      @wheel.prevent="$emit('canvas-wheel', $event)"
    >
      <div class="flowchartCanvasWorld" :style="canvasWorldStyle">
        <slot name="world"></slot>
        <div v-if="!hasNodes" class="canvasEmpty">
          <div class="canvasEmptyCopy">
            <div class="canvasEmptyTitle">{{ labels.emptyTitle }}</div>
            <div class="canvasEmptyDesc">{{ labels.emptyDesc }}</div>
          </div>
          <div class="canvasEmptyActions">
            <button type="button" class="flowchartPanelBtn" @click="$emit('add-node', 'start')">
              {{ labels.emptyAddStart }}
            </button>
            <button type="button" class="flowchartPanelBtn" @click="$emit('apply-template', 'approval')">
              {{ labels.emptyUseTemplate }}
            </button>
            <button type="button" class="flowchartPanelBtn" @click="$emit('apply-template', 'release')">
              {{ labels.emptyUseReleaseTemplate }}
            </button>
            <button type="button" class="flowchartPanelBtn" @click="$emit('apply-template', 'enterpriseDelivery')">
              {{ labels.emptyUseEnterpriseTemplate }}
            </button>
            <button type="button" class="flowchartPanelBtn" @click="$emit('generate-ai')">
              {{ labels.aiGenerate }}
            </button>
            <button type="button" class="flowchartPanelBtn" @click="$emit('import-mind-map-file')">
              {{ labels.importMindMapFile }}
            </button>
            <button type="button" class="flowchartPanelBtn" @click="$emit('validate-structure')">
              {{ labels.validateStructure }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </main>

  <div class="flowchartViewportToolbar">
    <button type="button" class="flowchartViewportBtn" @click="$emit('zoom-out')">
      -
    </button>
    <button type="button" class="flowchartViewportBtn isLabel" @click="$emit('reset-viewport')">
      {{ viewportZoomLabel }}
    </button>
    <button type="button" class="flowchartViewportBtn" @click="$emit('fit-canvas')">
      {{ labels.fitView }}
    </button>
    <button type="button" class="flowchartViewportBtn" @click="$emit('zoom-in')">
      +
    </button>
  </div>
</template>

<script>
export default {
  name: 'FlowchartCanvas',
  emits: ['canvas-pointer-down',
    'canvas-double-click',
    'canvas-wheel',
    'zoom-out',
    'reset-viewport',
    'fit-canvas',
    'zoom-in',
    'add-node',
    'apply-template',
    'generate-ai',
    'import-mind-map-file',
    'validate-structure'
  ],
  props: {
    isPanning: {
      type: Boolean,
      default: false
    },
    backgroundStyle: {
      type: String,
      default: 'grid'
    },
    canvasWorldStyle: {
      type: Object,
      required: true
    },
    viewportZoomLabel: {
      type: String,
      required: true
    },
    hasNodes: {
      type: Boolean,
      default: false
    },
    labels: {
      type: Object,
      required: true
    }
  },
  methods: {
    getCanvasElement() {
      return this.$refs.canvasRef || null
    }
  }
}
</script>
