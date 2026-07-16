<template>
  <div
    class="flowchartEditor"
    :class="{ isDark, isDragOver: isFlowchartDragOver }"
    :style="flowchartThemeStyleVars"
    @dragenter.prevent="onFlowchartDragEnter"
    @dragover.prevent="onFlowchartDragOver"
    @dragleave.prevent="onFlowchartDragLeave"
    @drop.prevent="onFlowchartDrop"
  >
    <div v-if="isFlowchartDragOver" class="flowchartDragMask">
      <div class="flowchartDragTip">{{ $t('flowchart.dragImportTip') }} · {{ $t('flowchart.dragImportFormatsTip') }}</div>
    </div>
    <FlowchartToolbar
      :labels="flowchartToolbarText"
      :is-dark="isDark"
      :is-generating="isGenerating"
      :save-status-type="flowchartSaveStatusType"
      :save-status-text="flowchartSaveStatusText"
      :save-status-detail="flowchartSaveStatusDetail"
      @go-home="goHome"
      @save="saveCurrentFile()"
      @save-as="saveAsFile()"
      @import-mind-map-file="importMindMapFile"
      @open-export="openExportCenter"
      @convert-mind-map="convertCurrentMindMap"
      @toggle-dark="toggleAppearance"
      @generate-ai="generateWithAi"
      @tidy-layout="tidyFlowchartLayout"
      @validate-structure="validateCurrentFlowchart({ openPanel: true })"
      @open-command-palette="openCommandPalette"
      @open-search="openFlowchartSearch"
    />

    <FlowchartCommandPalette
      :visible="commandPaletteVisible"
      :items="flowchartCommandPaletteItems"
      :labels="flowchartCommandPaletteLabels"
      @close="closeCommandPalette"
      @execute="executeCommandPaletteItem"
    />

    <div
      v-if="flowchartSearchVisible"
      class="flowchartSearchPanel"
      role="dialog"
      aria-modal="false"
      :aria-label="$t('flowchart.searchNodesTitle')"
    >
      <div class="flowchartSearchHeader">
        <strong>{{ $t('flowchart.searchNodesTitle') }}</strong>
        <button type="button" class="flowchartSearchClose" @click="closeFlowchartSearch">x</button>
      </div>
      <input
        ref="flowchartSearchInputRef"
        v-model.trim="flowchartSearchKeyword"
        class="flowchartSearchInput"
        type="search"
        :placeholder="$t('flowchart.searchNodesPlaceholder')"
        @keydown.enter.prevent="jumpToNextFlowchartSearchResult"
        @keydown.down.prevent="jumpToNextFlowchartSearchResult"
        @keydown.up.prevent="jumpToPrevFlowchartSearchResult"
        @keydown.esc.prevent="closeFlowchartSearch"
      />
      <div class="flowchartSearchMeta" v-if="flowchartSearchResults.length">
        {{
          $t('flowchart.searchNodesCount', {
            current: flowchartSearchActiveIndex + 1,
            total: flowchartSearchResults.length
          })
        }}
      </div>
      <div class="flowchartSearchEmpty" v-else-if="flowchartSearchKeyword">
        {{ $t('flowchart.searchNodesEmpty') }}
      </div>
      <div class="flowchartSearchList" v-if="flowchartSearchResults.length">
        <button
          v-for="(item, index) in flowchartSearchResults"
          :key="item.id"
          type="button"
          class="flowchartSearchItem"
          :class="{ isActive: index === flowchartSearchActiveIndex }"
          @click="jumpToFlowchartSearchResult(index)"
        >
          <span class="flowchartSearchItemType">{{ item.typeLabel }}</span>
          <span class="flowchartSearchItemText">{{ item.text }}</span>
        </button>
      </div>
    </div>

    <div
      v-if="flowchartValidationVisible"
      class="flowchartValidationPanel"
      role="dialog"
      :aria-label="$t('flowchart.validateStructure')"
    >
      <div class="flowchartValidationHeader">
        <strong>{{ $t('flowchart.validateStructure') }}</strong>
        <button type="button" class="flowchartValidationClose" @click="closeFlowchartValidationPanel">x</button>
      </div>
      <div class="flowchartValidationSummary" v-if="flowchartValidationResult">
        {{
          $t('flowchart.validateSummary', {
            nodes: flowchartValidationResult.summary.nodes,
            edges: flowchartValidationResult.summary.edges,
            issues: flowchartValidationResult.issues.length,
            score: flowchartValidationResult.summary.score || 0
          })
        }}
      </div>
      <div v-if="lastAutofixActions.length" class="flowchartAutofixResult">
        <div class="flowchartAutofixResultTitle">
          {{ $t('flowchart.autofixResultTitle') }}
          <span v-if="lastAutofixScoreDelta">
            {{
              $t('flowchart.autofixScoreDelta', {
                delta:
                  lastAutofixScoreDelta > 0
                    ? '+' + lastAutofixScoreDelta
                    : String(lastAutofixScoreDelta)
              })
            }}
          </span>
        </div>
        <button
          v-for="(action, index) in lastAutofixActions.slice(0, 6)"
          :key="action.code + '-' + index"
          type="button"
          class="flowchartAutofixResultItem"
          @click="focusAutofixAction(action)"
        >
          {{ $t('flowchart.autofixAction.' + action.code, { count: action.count || 1 }) }}
        </button>
      </div>
      <div class="validationFilterChips" v-if="flowchartValidationResult">
        <button type="button" class="validationFilterChip" :class="{ isActive: validationIssueFilter === 'all' }" @click="validationIssueFilter = 'all'">
          {{ $t('flowchart.validateFilterAll') }}
        </button>
        <button type="button" class="validationFilterChip" :class="{ isActive: validationIssueFilter === 'error' }" @click="validationIssueFilter = 'error'">
          {{ $t('flowchart.validateFilterError') }}
        </button>
        <button type="button" class="validationFilterChip" :class="{ isActive: validationIssueFilter === 'warn' }" @click="validationIssueFilter = 'warn'">
          {{ $t('flowchart.validateFilterWarn') }}
        </button>
      </div>
      <div class="flowchartValidationList" v-if="filteredValidationIssues.length">
        <button
          v-for="(issue, index) in filteredValidationIssues"
          :key="issue.code + '-' + index"
          type="button"
          class="flowchartValidationItem"
          tabindex="0"
          :class="[
            'is-' + issue.severity,
            { isActive: selectedValidationIssueKey === issue.code + '-' + index }
          ]"
          @click="focusFlowchartValidationIssue(issue, index, $event)"
        >
          <span class="flowchartValidationSeverity">{{
            issue.severity === 'error'
              ? $t('flowchart.validateSeverityError')
              : $t('flowchart.validateSeverityWarn')
          }}</span>
          <span class="flowchartValidationText">{{ $t(issue.messageKey, { count: issue.count || 0 }) }}</span>
        </button>
      </div>
      <div class="flowchartValidationEmpty" v-else>
        {{
          flowchartValidationResult?.issues?.length
            ? $t('flowchart.validateFilterEmpty')
            : $t('flowchart.validateNoIssues')
        }}
      </div>
      <div class="flowchartValidationActions">
        <button type="button" class="flowchartValidationAction" @click="validateCurrentFlowchart({ openPanel: true })">
          {{ $t('flowchart.validateRefresh') }}
        </button>
        <button type="button" class="flowchartValidationAction" @click="highlightAllValidationNodes">
          {{ $t('flowchart.validateSelectAllIssues') }}
        </button>
        <button type="button" class="flowchartValidationAction" @click="highlightValidationErrors">
          {{ $t('flowchart.validateSelectErrors') }}
        </button>
        <button type="button" class="flowchartValidationAction isPrimary" @click="autofixCurrentFlowchart">
          {{ $t('flowchart.autofixStructure') }}
        </button>
        <button
          type="button"
          class="flowchartValidationAction"
          :disabled="!lastAutofixSnapshot"
          @click="undoLastFlowchartAutofix"
        >
          {{ $t('flowchart.autofixUndo') }}
        </button>
      </div>
    </div>

v-if="flowchartShortcutVisible"
      class="flowchartShortcutOverlay"
      @mousedown.self="closeFlowchartShortcuts"
    >
      <section class="flowchartShortcutPanel" role="dialog" aria-modal="true">
        <div class="flowchartShortcutHeader">
          <strong>{{ $t('shortcutKey.title') }}</strong>
          <button type="button" class="flowchartShortcutClose" @click="closeFlowchartShortcuts">x</button>
        </div>
        <div class="flowchartShortcutBody">
          <div v-for="group in flowchartShortcutGroups" :key="group.type" class="flowchartShortcutGroup">
            <div class="flowchartShortcutGroupTitle">{{ group.type }}</div>
            <div
              v-for="item in group.list"
              :key="item.name + item.value"
              class="flowchartShortcutItem"
            >
              <span class="flowchartShortcutName">{{ item.name }}</span>
              <code class="flowchartShortcutValue">{{ item.value }}</code>
            </div>
          </div>
        </div>
      </section>
    </div>

    <div
      v-if="flowchartAiPreviewVisible"
      class="flowchartAiPreviewOverlay"
      @mousedown.self="discardFlowchartAiPreview"
    >
      <section
        class="flowchartAiPreviewPanel"
        role="dialog"
        aria-modal="true"
        :aria-label="$t('flowchart.aiPreviewTitle')"
      >
        <div class="flowchartAiPreviewHeader">
          <div class="flowchartAiPreviewTitle">
            {{ $t('flowchart.aiPreviewTitle') }}
          </div>
          <button
            type="button"
            class="flowchartAiPreviewClose"
            :aria-label="$t('dialog.close')"
            @click="discardFlowchartAiPreview"
          >
            x
          </button>
        </div>
        <div class="flowchartAiPreviewBody">
          <div class="flowchartAiPreviewMeta">
            <span>{{ flowchartAiPreviewSummaryText }}</span>
            <span v-if="flowchartAiPreviewTitle">{{ flowchartAiPreviewTitle }}</span>
          </div>
          <div class="flowchartAiPreviewCanvas" aria-hidden="true">
            <svg :viewBox="flowchartAiPreviewViewBox">
              <path
                v-for="edge in flowchartAiPreviewEdges"
                :key="edge.id"
                class="flowchartAiPreviewEdge"
                :d="getAiPreviewPath(edge)"
                :style="getAiPreviewEdgeStyle(edge)"
              ></path>
              <template v-for="node in flowchartAiPreviewNodes" :key="node.id">
                <polygon
                  v-if="node.type === 'decision'"
                  class="flowchartAiPreviewNode"
                  :points="getAiPreviewDecisionPolygon(node)"
                  :style="getAiPreviewNodeStyle()"
                ></polygon>
                <polygon
                  v-else-if="node.type === 'input'"
                  class="flowchartAiPreviewNode"
                  :points="getAiPreviewInputPolygon(node)"
                  :style="getAiPreviewNodeStyle()"
                ></polygon>
                <rect
                  v-else
                  class="flowchartAiPreviewNode"
                  :x="node.x"
                  :y="node.y"
                  :width="node.width"
                  :height="node.height"
                  :rx="node.type === 'start' || node.type === 'end' ? 22 : 10"
                  :style="getAiPreviewNodeStyle()"
                ></rect>
              </template>
            </svg>
          </div>
        </div>
        <div class="flowchartAiPreviewFooter">
          <button
            type="button"
            class="flowchartAiPreviewButton"
            @click="discardFlowchartAiPreview"
          >
            {{ $t('flowchart.aiPreviewCancel') }}
          </button>
          <button
            type="button"
            class="flowchartAiPreviewButton isPrimary"
            @click="applyFlowchartAiPreview"
          >
            {{ $t('flowchart.aiPreviewConfirm') }}
          </button>
        </div>
      </section>
    </div>

    <div class="flowchartStage">
      <FlowchartCanvas
        ref="flowchartCanvas"
        :is-panning="!!canvasPanState"
        :background-style="flowchartConfig.backgroundStyle"
        :canvas-world-style="canvasWorldStyle()"
        :viewport-zoom-label="viewportZoomLabel"
        :has-nodes="!!flowchartData.nodes.length"
        :labels="flowchartUiText"
        @canvas-pointer-down="handleCanvasPointerDown"
        @canvas-double-click="addNodeAtCanvasPoint"
        @canvas-wheel="handleCanvasWheel"
        @zoom-out="zoomOut"
        @reset-viewport="resetViewport"
        @fit-canvas="fitCanvasToView"
        @zoom-in="zoomIn"
        @add-node="addNodeByType"
        @apply-template="requestApplyTemplate"
        @generate-ai="generateWithAi"
      >
        <template #world>
          <FlowchartEdgeLayer
            :edges-with-layout="edgesWithLayout"
            :selected-edge-id="selectedEdgeId"
            :alignment-guides="alignmentGuides"
            :canvas-world-bounds="canvasWorldBounds"
            :connector-preview="connectorPreview"
            :labels="flowchartUiText"
            @select-edge="selectEdge"
            @edit-edge-label="editEdgeLabel"
            @start-edge-label-drag="startEdgeLabelDrag"
            @start-edge-reconnect="startEdgeReconnect"
            @start-edge-bend-drag="startEdgeBendDrag"
            @start-edge-segment-drag="startEdgeSegmentDrag"
          />

          <FlowchartNodeLayer
            :nodes="flowchartData.nodes"
            :selected-node-ids="selectedNodeIds"
            :get-node-style="getNodeStyle"
            :get-connector-handle-style="getConnectorHandleStyle"
            :get-connector-directions-for-node="getConnectorDirectionsForNode"
            :show-connector-handles-for-node="showConnectorHandlesForNode"
            :show-resize-handles-for-node="showResizeHandlesForNode"
            :connector-target-node-id="connectorDragState?.targetNodeId || edgeReconnectState?.targetNodeId || ''"
            :connector-target-direction="connectorTargetDirection"
            :new-node-ids="newNodeIds"
            @start-node-drag="startNodeDrag"
            @select-node="selectNode"
            @edit-node-text="editNodeText"
            @start-connector-drag="startConnectorDrag"
            @start-node-resize="startNodeResize"
            @open-node-link="openNodeLinkFromBadge"
          />

          <div
            v-if="selectionState"
            class="flowchartSelectionBox"
            :style="getSelectionBoxStyle()"
          ></div>

          <div
            v-if="inlineTextEditorState"
            class="flowchartInlineEditor"
            :class="`is-${inlineTextEditorState.kind}`"
            :style="inlineTextEditorState.style"
          >
            <textarea
              v-if="inlineTextEditorState.kind === 'node'"
              ref="inlineTextEditorRef"
              v-model="inlineTextEditorState.value"
              class="flowchartInlineTextarea"
              @keydown.stop="handleInlineTextEditorKeydown"
              @blur="commitInlineTextEditor"
            ></textarea>
            <input
              v-else
              ref="inlineTextEditorRef"
              v-model="inlineTextEditorState.value"
              class="flowchartInlineInput"
              @keydown.stop="handleInlineTextEditorKeydown"
              @blur="commitInlineTextEditor"
            />
          </div>
        </template>
      </FlowchartCanvas>

      <FlowchartMinimap
        :nodes="flowchartData.nodes"
        :edges="minimapEdges"
        :lanes="flowchartLanes"
        :viewport="getViewport()"
        :canvas-viewport-size="canvasViewportSize"
        :labels="flowchartUiText"
        @jump-to-point="centerViewportAt"
      />

      <FlowchartQuickAddBar
        :node-types="flowchartNodeTypes"
        :labels="flowchartUiText"
        @add-node="addNodeByType"
      />

      <FlowchartSelectionToolbar
        :selected-node-count="selectedNodeIds.length"
        :labels="flowchartUiText"
        @align-left="alignSelectedNodesLeft"
        @align-center-x="alignSelectedNodesCenterX"
        @align-right="alignSelectedNodesRight"
        @align-top="alignSelectedNodesTop"
        @align-center-y="alignSelectedNodesCenterY"
        @align-bottom="alignSelectedNodesBottom"
        @distribute-horizontal="distributeSelectedNodesHorizontally"
        @distribute-vertical="distributeSelectedNodesVertically"
        @bring-front="bringSelectedNodesToFront"
        @send-back="sendSelectedNodesToBack"
        @duplicate="duplicateSelectedNodes"
        @delete="removeSelection"
      />

      <FlowchartInspector
        :is-open="isInspectorOpen"
        :panel-section="inspectorPanelSection"
        :labels="flowchartUiText"
        :templates="flowchartTemplates"
        :flowchart-theme-presets="flowchartThemePresets"
        :flowchart-theme-id="flowchartConfig.themeId"
        :resolved-theme="resolvedFlowchartTheme"
        :strict-alignment="flowchartConfig.strictAlignment"
        :background-style="flowchartConfig.backgroundStyle"
        :selected-node="selectedNode"
        :selected-edge="selectedEdge"
        :flowchart-node-types="flowchartNodeTypes"
        :node-style-presets="flowchartNodeStylePresets"
        :edge-path-types="flowchartEdgePathTypes"
        @toggle-inspector="toggleInspector"
        @toggle-section="toggleInspectorSection"
        @close-inspector="closeInspector"
        @request-template-apply="requestApplyTemplate"
        @update-flowchart-config="updateFlowchartConfig"
        @update-selected-node-type="updateSelectedNodeType"
        @update-selected-node-text="updateSelectedNodeText"
        @update-selected-node-note="updateSelectedNodeNote"
        @update-selected-node-link="updateSelectedNodeLink"
        @update-selected-edge-label="updateSelectedEdgeLabel"
        @update-selected-edge-label-position="updateSelectedEdgeLabelPosition"
        @apply-selected-node-preset="applySelectedNodePreset"
        @update-flowchart-theme="updateFlowchartTheme"
        @update-selected-node-style="updateSelectedNodeStyle"
        @update-selected-edge-style="updateSelectedEdgeStyle"
      />
    </div>
    <div
      v-if="xmindCanvasDialogVisible"
      class="xmindCanvasDialogOverlay"
      @keydown.enter.prevent="confirmXmindCanvasSelect"
      @keydown.esc.prevent="cancelXmindCanvasSelect"
      @mousedown.self="cancelXmindCanvasSelect"
    >
      <section
        class="xmindCanvasDialog"
        role="dialog"
        aria-modal="true"
        :aria-label="$t('flowchart.xmindCanvasSelectTitle')"
      >
        <div class="xmindCanvasDialogHeader">
          <strong>{{ $t('flowchart.xmindCanvasSelectTitle') }}</strong>
          <button type="button" class="xmindCanvasDialogClose" @click="cancelXmindCanvasSelect">x</button>
        </div>
        <div class="xmindCanvasDialogBody">
          <button
            v-for="(item, index) in xmindCanvasOptions"
            :key="item.id || index"
            type="button"
            class="xmindCanvasOption"
            :class="{ isActive: xmindCanvasSelectedIndex === index }"
            :aria-selected="xmindCanvasSelectedIndex === index ? 'true' : 'false'"
            @click="xmindCanvasSelectedIndex = index"
            @dblclick="confirmXmindCanvasSelect"
          >
            <span class="xmindCanvasOptionIndex">{{ index + 1 }}</span>
            <span class="xmindCanvasOptionTitle">{{ item.title }}</span>
          </button>
        </div>
        <div class="xmindCanvasDialogFooter">
          <button type="button" class="xmindCanvasDialogBtn" @click="cancelXmindCanvasSelect">
            {{ $t('flowchart.autofixCancel') }}
          </button>
          <button type="button" ref="xmindConfirmBtn"
            class="xmindCanvasDialogBtn isPrimary"
            @click="confirmXmindCanvasSelect">
            {{ $t('flowchart.xmindCanvasConfirm') }}
          </button>
        </div>
      </section>
    </div>
    <AiConfigDialog v-model:visible="flowchartAiConfigDialogVisible" />
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { flowchartShortcutKeyList } from '@/config'
import {
  getBootstrapState,
  ensureBootstrapDocumentState
} from '@/platform'
import { useAiStore } from '@/stores/ai'
import { useEditorStore } from '@/stores/editor'
import { useThemeStore } from '@/stores/theme'
import { toggleThemeMode } from '@/stores/runtime'
import {
  FLOWCHART_NODE_STYLE_PRESETS,
  FLOWCHART_TEMPLATE_PRESETS,
  FLOWCHART_THEME_PRESETS,
  FLOWCHART_NODE_TYPES,
  createDefaultFlowchartData,
  createFlowchartTemplatePreviewData,
  getFlowchartAnchorHandleKey,
  getFlowchartEdgeLayout,
  getFlowchartNodeVisualStyle,
  getFlowchartThemeDefinition
} from '@/services/flowchartDocument'
import FlowchartCanvas from './FlowchartCanvas.vue'
import FlowchartEdgeLayer from './FlowchartEdgeLayer.vue'
import FlowchartInspector from './FlowchartInspector.vue'
import FlowchartMinimap from './FlowchartMinimap.vue'
import FlowchartNodeLayer from './FlowchartNodeLayer.vue'
import FlowchartQuickAddBar from './FlowchartQuickAddBar.vue'
import FlowchartToolbar from './FlowchartToolbar.vue'
import FlowchartSelectionToolbar from './FlowchartSelectionToolbar.vue'
import FlowchartCommandPalette from './FlowchartCommandPalette.vue'
import AiConfigDialog from './AiConfigDialog.vue'
import './FlowchartEditor.less'
import { flowchartHistoryMethods } from './flowchartEditorHistory'
import { flowchartViewportMethods } from './flowchartEditorViewport'
import { flowchartConnectorMethods } from './flowchartEditorConnector'
import { flowchartReconnectMethods } from './flowchartEditorReconnect'
import { flowchartNodeMethods } from './flowchartEditorNode'
import { flowchartSelectionMethods } from './flowchartEditorSelection'
import { flowchartInlineEditMethods } from './flowchartEditorInlineEdit'
import { flowchartResizeMethods } from './flowchartEditorResize'
import { flowchartAutoScrollMethods } from './flowchartEditorAutoScroll'
import { flowchartStyleMethods } from './flowchartEditorStyle'
import { flowchartDocumentMethods } from './flowchartEditorDocument'
import { flowchartAiMethods } from './flowchartEditorAi'
import {
  getFlowchartStructurePreviewViewBox,
  getFlowchartStructurePreviewPath,
  getFlowchartStructureEdgeStyle,
  getFlowchartStructureNodeStyle,
  getFlowchartDecisionPolygon,
  getFlowchartInputPolygon,
  summarizeFlowchartStructure
} from './flowchartStructurePreview'
import {
  validateFlowchartStructure,
  formatFlowchartValidationMessage,
  buildFlowchartAutofixPlan
} from './flowchartValidation'
import {
  FLOWCHART_ALIGNMENT_THRESHOLD,
  FLOWCHART_STRAIGHT_EDGE_SNAP_THRESHOLD,
  cloneJson
} from './flowchartEditorShared'

export default {
  name: 'FlowchartEditor',
  components: {
    FlowchartCanvas,
    FlowchartEdgeLayer,
    FlowchartInspector,
    FlowchartMinimap,
    FlowchartNodeLayer,
    FlowchartQuickAddBar,
    FlowchartToolbar,
    FlowchartSelectionToolbar,
    FlowchartCommandPalette,
    AiConfigDialog
  },
  data() {
    return {
      flowchartData: createDefaultFlowchartData(),
      flowchartConfig: {
        snapToGrid: false,
        gridSize: 24,
        themeId: 'blueprint',
        strictAlignment: false,
        backgroundStyle: 'grid'
      },
      flowchartNodeTypes: FLOWCHART_NODE_TYPES,
      selectedNodeIds: [],
      selectedEdgeId: '',
      isInspectorOpen: false,
      dragState: null,
      dragFrameId: 0,
      pendingDragPoint: null,
      selectionState: null,
      connectorPreview: null,
      connectorDragState: null,
      connectorDragFrameId: 0,
      pendingConnectorPoint: null,
      edgeReconnectState: null,
      edgeReconnectFrameId: 0,
      pendingEdgeReconnectPoint: null,
      edgeBendDragState: null,
      edgeBendDragFrameId: 0,
      pendingEdgeBendPoint: null,
      edgeLabelDragState: null,
      edgeLabelDragFrameId: 0,
      pendingEdgeLabelDragPoint: null,
      edgeDirectionLockMap: null,
      edgeToolbarState: null,
      inspectorPanelSection: 'templates',
      inlineTextEditorState: null,
      flowchartClipboard: null,
      flowchartHistory: {
        undoStack: [],
        redoStack: [],
        baseline: null,
        restoring: false
      },
      interactionClickGuardUntil: 0,
      interactivePersistTimer: 0,
      interactivePersistOptions: null,
      alignmentGuides: [],
      canvasPanState: null,
      canvasPanFrameId: 0,
      pendingCanvasPanPoint: null,
      autoScrollState: null,
      autoScrollFrameId: 0,
      newNodeIds: null,
      canvasViewportSize: {
        width: 0,
        height: 0
      },
      resizeState: null,
      persistTimer: 0,
      recoveryTimer: 0,
      isFlowchartUnmounted: false,
      aiBuffer: '',
      isGenerating: false,
      pendingFlowchartAiResult: null,
      flowchartAiPreviewVisible: false,
      commandPaletteVisible: false,
      flowchartSearchVisible: false,
      flowchartSearchKeyword: '',
      flowchartSearchActiveIndex: 0,
      flowchartShortcutVisible: false,
      flowchartValidationVisible: false,
      flowchartValidationResult: null,
      selectedValidationIssueKey: '',
      validationIssueFilter: 'all',
      validationHighlightNodeIds: [],
      lastAutofixSnapshot: null,
      lastAutofixActions: [],
      lastAutofixScoreDelta: 0,
      isFlowchartDragOver: false,
      isValidatingFlowchart: false,
      isAutofixingFlowchart: false,
      xmindCanvasDialogVisible: false,
      xmindCanvasOptions: [],
      xmindCanvasSelectedIndex: 0,
      xmindCanvasResolve: null,
      flowchartAiConfigDialogVisible: false,
      flowchartAiClient: null,
      flowchartAiRequestToken: 0
    }
  },
  computed: {
    ...mapState(useThemeStore, {
      isDark: 'isDark'
    }),
    ...mapState(useEditorStore, {
      currentDocument: 'currentDocument',
      currentFileName: 'currentFileName'
    }),
    ...mapState(useAiStore, {
      aiConfig: 'config'
    }),
    flowchartNodeLookup() {
      return new Map(this.flowchartData.nodes.map(node => [node.id, node]))
    },
    documentTitle() {
      return (
        this.currentFileName ||
        this.currentDocument?.name ||
        `${this.flowchartData.title || this.$t('flowchart.fileNameFallback')}.smm`
      )
    },
    selectedNode() {
      if (!this.selectedNodeIds.length) return null
      return this.flowchartNodeLookup.get(this.selectedNodeIds[0]) || null
    },
    selectedEdge() {
      if (!this.selectedEdgeId) return null
      return this.flowchartData.edges.find(edge => edge.id === this.selectedEdgeId) || null
    },
    connectorTargetDirection() {
      const previewAnchor =
        this.edgeReconnectState?.targetAnchor ||
        this.connectorDragState?.targetAnchor ||
        null
      return getFlowchartAnchorHandleKey(previewAnchor, '')
    },
    isInteractiveEdgeRouting() {
      return !!(
        this.dragState ||
        this.connectorDragState ||
        this.edgeReconnectState ||
        this.edgeBendDragState ||
        this.edgeLabelDragState ||
        this.resizeState
      )
    },
    edgesWithLayout() {
      const interactiveEdgeIds = this.getInteractiveEdgeLayoutEdgeIds()
      const nextEdgeLayoutCache = new Map()
      const edgesWithLayout = this.flowchartData.edges
        .map(edge => {
          const sourceNode = this.flowchartNodeLookup.get(edge.source)
          const targetNode = this.flowchartNodeLookup.get(edge.target)
          if (!sourceNode || !targetNode) return null
          const cacheKey = this.createEdgeLayoutCacheKey(edge, sourceNode, targetNode)
          const cachedLayoutEntry = this._edgeLayoutCache?.get(edge.id) || null
          const layout =
            this.isInteractiveEdgeRouting && !interactiveEdgeIds.has(edge.id)
              ? cachedLayoutEntry?.cacheKey === cacheKey
                ? cachedLayoutEntry.layout
                : this.resolveEdgeLayoutForRender(edge, sourceNode, targetNode)
              : this.resolveEdgeLayoutForRender(edge, sourceNode, targetNode)
          nextEdgeLayoutCache.set(edge.id, {
            cacheKey,
            layout
          })
          return {
            ...edge,
            ...layout
          }
        })
        .filter(Boolean)
      this._edgeLayoutCache = nextEdgeLayoutCache
      return edgesWithLayout
    },
    minimapEdges() {
      return this.edgesWithLayout
    },
    flowchartLanes() {
      return Array.isArray(this.flowchartData.lanes) ? this.flowchartData.lanes : []
    },
    flowchartNodeStylePresets() {
      return FLOWCHART_NODE_STYLE_PRESETS
    },
    resolvedFlowchartTheme() {
      return getFlowchartThemeDefinition(this.flowchartConfig.themeId, {
        isDark: this.isDark
      })
    },
    flowchartThemeStyleVars() {
      const theme = this.resolvedFlowchartTheme
      return {
        '--flowchart-canvas-bg': theme.canvasBg,
        '--flowchart-grid-color': theme.gridColor,
        '--flowchart-floating-bg': theme.floatingBg,
        '--flowchart-floating-border': theme.floatingBorder,
        '--flowchart-floating-shadow': theme.floatingShadow,
        '--flowchart-dock-bg': theme.dockBg,
        '--flowchart-dock-border': theme.dockBorder,
        '--flowchart-dock-shadow': theme.dockShadow,
        '--flowchart-dock-active-bg': theme.dockActiveBg,
        '--flowchart-dock-active-text': theme.dockActiveText,
        '--flowchart-text': theme.text,
        '--flowchart-subtle-text': theme.subtleText,
        '--flowchart-toolbar-bg': theme.toolbarBg,
        '--flowchart-toolbar-border': theme.toolbarBorder,
        '--flowchart-toolbar-btn-hover': theme.toolbarBtnHover,
        '--flowchart-node-bg': theme.nodeBg,
        '--flowchart-node-border': theme.nodeBorder,
        '--flowchart-node-shadow': theme.nodeShadow,
        '--flowchart-accent': theme.accent,
        '--flowchart-accent-ring': theme.accentRing,
        '--flowchart-connector': theme.connector,
        '--flowchart-connector-preview': theme.connectorPreview,
        '--flowchart-overlay': theme.overlay,
        '--flowchart-template-preview-bg': theme.templatePreviewBg,
        '--flowchart-template-edge': theme.templateEdgeStroke,
        '--flowchart-template-node-fill': theme.templateNodeFill,
        '--flowchart-template-node-stroke': theme.templateNodeStroke,
        '--flowchart-icon-stroke': theme.iconStroke
      }
    },
    flowchartThemePresets() {
      return FLOWCHART_THEME_PRESETS.map(item => {
        const preview = getFlowchartThemeDefinition(item.id, {
          isDark: this.isDark
        })
        return {
          id: item.id,
          label: this.$t(item.labelKey),
          ...preview
        }
      })
    },
    canvasWorldBounds() {
      const boundsItems = [
        ...this.flowchartLanes,
        ...this.flowchartData.nodes
      ]
      const nodeBounds = boundsItems.reduce(
        (bounds, node) => {
          return {
            minX: Math.min(bounds.minX, Number(node.x || 0)),
            minY: Math.min(bounds.minY, Number(node.y || 0)),
            maxX: Math.max(
              bounds.maxX,
              Number(node.x || 0) + Number(node.width || 0)
            ),
            maxY: Math.max(
              bounds.maxY,
              Number(node.y || 0) + Number(node.height || 0)
            )
          }
        },
        {
          minX: 0,
          minY: 0,
          maxX: 1280,
          maxY: 720
        }
      )
      return {
        minX: nodeBounds.minX,
        minY: nodeBounds.minY,
        width: Math.max(1600, nodeBounds.maxX + 480),
        height: Math.max(1000, nodeBounds.maxY + 420)
      }
    },
    viewportZoomLabel() {
      const viewport = this.getViewport()
      return `${Math.round(viewport.zoom * 100)}%`
    },
    flowchartEdgePathTypes() {
      if (this.flowchartConfig.strictAlignment) {
        return [
          {
            value: 'orthogonal',
            label: this.$t('flowchart.edgeTypeOrthogonal')
          }
        ]
      }
      return [
        {
          value: 'orthogonal',
          label: this.$t('flowchart.edgeTypeOrthogonal')
        },
        {
          value: 'curved',
          label: this.$t('flowchart.edgeTypeCurved')
        },
        {
          value: 'straight',
          label: this.$t('flowchart.edgeTypeStraight')
        }
      ]
    },
    flowchartUiText() {
      return {
        save: this.$t('flowchart.save'),
        saveAs: this.$t('flowchart.saveAs'),
        returnHome: this.$t('flowchart.returnHome'),
        template: this.$t('flowchart.template'),
        theme: this.$t('flowchart.theme'),
        templatePanelTitle: this.$t('flowchart.templatePanelTitle'),
        convertMindMap: this.$t('flowchart.convertMindMap'),
        importMindMapFile: this.$t('flowchart.importMindMapFile'),
        aiGenerate: this.$t('flowchart.aiGenerate'),
        exportCenter: this.$t('toolbar.exportCenter'),
        addStart: this.$t('flowchart.addStart'),
        addProcess: this.$t('flowchart.addProcess'),
        addDecision: this.$t('flowchart.addDecision'),
        addInput: this.$t('flowchart.addInput'),
        addEnd: this.$t('flowchart.addEnd'),
        shapeSearchPlaceholder: this.$t('flowchart.shapeSearchPlaceholder'),
        duplicate: this.$t('flowchart.duplicate'),
        alignLeft: this.$t('flowchart.alignLeft'),
        alignRight: this.$t('flowchart.alignRight'),
        alignTop: this.$t('flowchart.alignTop'),
        alignBottom: this.$t('flowchart.alignBottom'),
        alignCenterX: this.$t('flowchart.alignCenterX'),
        alignCenterY: this.$t('flowchart.alignCenterY'),
        distributeHorizontal: this.$t('flowchart.distributeHorizontal'),
        distributeVertical: this.$t('flowchart.distributeVertical'),
        arrangeFront: this.$t('flowchart.arrangeFront'),
        arrangeBack: this.$t('flowchart.arrangeBack'),
        emptyTitle: this.$t('flowchart.emptyTitle'),
        emptyDesc: this.$t('flowchart.emptyDesc'),
        emptyAddStart: this.$t('flowchart.emptyAddStart'),
        emptyUseTemplate: this.$t('flowchart.emptyUseTemplate'),
        emptyUseReleaseTemplate: this.$t('flowchart.emptyUseReleaseTemplate'),
        emptyUseEnterpriseTemplate: this.$t('flowchart.emptyUseEnterpriseTemplate'),
        inspectorTitle: this.$t('flowchart.inspectorTitle'),
        nodeType: this.$t('flowchart.nodeType'),
        nodeText: this.$t('flowchart.nodeText'),
        nodeNote: this.$t('flowchart.nodeNote'),
        nodeNotePlaceholder: this.$t('flowchart.nodeNotePlaceholder'),
        nodeLink: this.$t('flowchart.nodeLink'),
        nodeLinkPlaceholder: this.$t('flowchart.nodeLinkPlaceholder'),
        nodePreset: this.$t('flowchart.nodePreset'),
        nodeFill: this.$t('flowchart.nodeFill'),
        nodeStroke: this.$t('flowchart.nodeStroke'),
        nodeTextColor: this.$t('flowchart.nodeTextColor'),
        edgeLabel: this.$t('flowchart.edgeLabel'),
        edgeLabelPosition: this.$t('flowchart.edgeLabelPosition'),
        edgeLabelOffsetX: this.$t('flowchart.edgeLabelOffsetX'),
        edgeLabelOffsetY: this.$t('flowchart.edgeLabelOffsetY'),
        edgeColor: this.$t('flowchart.edgeColor'),
        edgeType: this.$t('flowchart.edgeType'),
        edgeLineStyle: this.$t('flowchart.edgeLineStyle'),
        edgeLineStyleSolid: this.$t('flowchart.edgeLineStyleSolid'),
        edgeLineStyleDashed: this.$t('flowchart.edgeLineStyleDashed'),
        edgeTypeStraight: this.$t('flowchart.edgeTypeStraight'),
        edgeTypeCurved: this.$t('flowchart.edgeTypeCurved'),
        edgeTypeOrthogonal: this.$t('flowchart.edgeTypeOrthogonal'),
        strictAlignment: this.$t('flowchart.strictAlignment'),
        backgroundStyle: this.$t('flowchart.backgroundStyle'),
        backgroundStyleNone: this.$t('flowchart.backgroundStyleNone'),
        backgroundStyleDots: this.$t('flowchart.backgroundStyleDots'),
        backgroundStyleGrid: this.$t('flowchart.backgroundStyleGrid'),
        settingsPanelTitle: this.$t('flowchart.settingsPanelTitle'),
        minimap: this.$t('flowchart.minimap'),
        delete: this.$t('flowchart.delete'),
        selectionEmpty: this.$t('flowchart.selectionEmpty'),
        fitView: this.$t('flowchart.fitView'),
        tidyLayout: this.$t('flowchart.tidyLayout'),
        validateStructure: this.$t('flowchart.validateStructure'),
        templateApproval: this.$t('flowchart.templateApproval'),
        templateRelease: this.$t('flowchart.templateRelease'),
        templateTicket: this.$t('flowchart.templateTicket'),
        templateOnboarding: this.$t('flowchart.templateOnboarding'),
        templateTroubleshooting: this.$t('flowchart.templateTroubleshooting'),
        templateCustomerJourney: this.$t('flowchart.templateCustomerJourney'),
        templateIncident: this.$t('flowchart.templateIncident'),
        templateDataPipeline: this.$t('flowchart.templateDataPipeline'),
        templateProjectPlan: this.$t('flowchart.templateProjectPlan'),
        templateCrossFunctionalApproval: this.$t('flowchart.templateCrossFunctionalApproval'),
        templateSupportEscalation: this.$t('flowchart.templateSupportEscalation'),
        templateContentReview: this.$t('flowchart.templateContentReview'),
        templateProcurement: this.$t('flowchart.templateProcurement'),
        templateSalesPipeline: this.$t('flowchart.templateSalesPipeline'),
        templateEnterpriseDelivery: this.$t('flowchart.templateEnterpriseDelivery'),
        close: this.$t('ai.close')
      }
    },
    flowchartToolbarText() {
      return {
        save: this.$t('flowchart.save'),
        saveAs: this.$t('flowchart.saveAsShort'),
        returnHome: this.$t('flowchart.returnHomeShort'),
        importMindMapFile: this.$t('flowchart.importMindMapFileShort'),
        aiGenerate: this.$t('flowchart.aiGenerateShort'),
        commandPalette: this.$t('toolbar.commandPaletteAction'),
        search: this.$t('toolbar.searchAction'),
        shortcuts: this.$t('shortcutKey.title'),
        exportCenter: this.$t('toolbar.exportCenter'),
        convertMindMap: this.$t('flowchart.convertMindMapShort'),
        tidyLayout: this.$t('flowchart.tidyLayout'),
        validateStructure: this.$t('flowchart.validateStructure'),
        darkMode: this.$t('navigatorToolbar.darkMode'),
        lightMode: this.$t('navigatorToolbar.lightMode')
      }
    },
    flowchartTemplates() {
      const groupedTemplates = FLOWCHART_TEMPLATE_PRESETS.reduce((result, item) => {
        const categoryId = String(item.categoryKey || 'flowchart.templateCategoryOps')
        if (!result.has(categoryId)) {
          result.set(categoryId, {
            id: categoryId,
            label: this.$t(categoryId),
            items: []
          })
        }
        result.get(categoryId).items.push({
          id: item.id,
          label: this.$t(item.labelKey),
          category: this.$t(item.categoryKey),
          preview: createFlowchartTemplatePreviewData(this.$t('flowchart.title'), item.id)
        })
        return result
      }, new Map())
      return Array.from(groupedTemplates.values())
    },
    hasPotentialUnsavedFlowchart() {
      return (
        !!this.currentDocument?.dirty ||
        !!this.persistTimer ||
        !!this.recoveryTimer ||
        !!this.isGenerating
      )
    },
    flowchartSaveStatusType() {
      if (this.isGenerating) return 'generating'
      if (this.persistTimer || this.recoveryTimer) return 'autosaving'
      if (this.currentDocument?.dirty) return 'dirty'
      if (this.currentDocument?.path || this.currentFileName) return 'saved'
      return 'dirty'
    },
    flowchartSaveStatusText() {
      if (this.isGenerating) return this.$t('flowchart.aiGenerating')
      if (this.persistTimer || this.recoveryTimer) {
        return this.$t('toolbar.statusAutosaving')
      }
      if (this.currentDocument?.dirty) {
        return this.$t('toolbar.statusUnsynced')
      }
      if (this.currentDocument?.path || this.currentFileName) {
        return this.$t('toolbar.statusSaved')
      }
      return this.$t('toolbar.statusNoFile')
    },
    filteredValidationIssues() {
      const issues = this.flowchartValidationResult?.issues || []
      if (this.validationIssueFilter === 'error') {
        return issues.filter(issue => issue.severity === 'error')
      }
      if (this.validationIssueFilter === 'warn') {
        return issues.filter(issue => issue.severity === 'warn')
      }
      return issues
    },
    flowchartShortcutGroups() {
      return flowchartShortcutKeyList[this.$i18n.locale] || flowchartShortcutKeyList.zh || []
    },
    flowchartSearchResults() {
      const keyword = String(this.flowchartSearchKeyword || '')
        .trim()
        .toLowerCase()
      if (!keyword) return []
      return (this.flowchartData.nodes || [])
        .map(node => {
          const text = String(node.text || '').trim()
          const typeDef = this.flowchartNodeTypes.find(item => item.type === node.type)
          return {
            id: node.id,
            text: text || typeDef?.label || node.type,
            type: node.type,
            typeLabel: typeDef?.label || node.type,
            haystack: (text + ' ' + (typeDef?.label || '') + ' ' + node.type).toLowerCase()
          }
        })
        .filter(item => item.haystack.includes(keyword))
    },
    flowchartCommandPaletteLabels() {
      return {
        title: this.$t('toolbar.commandPaletteTitle'),
        placeholder: this.$t('toolbar.commandPalettePlaceholder'),
        empty: this.$t('toolbar.commandPaletteEmpty'),
        close: this.$t('dialog.close')
      }
    },
    flowchartCommandPaletteItems() {
      const hasSelection = this.selectedNodeIds.length > 0 || !!this.selectedEdgeId
      const hasNodeSelection = this.selectedNodeIds.length > 0
      return [
        { key: 'save', label: this.$t('flowchart.save'), shortcut: 'Ctrl S', action: () => this.saveCurrentFile() },
        { key: 'saveAs', label: this.$t('flowchart.saveAsShort'), action: () => this.saveAsFile() },
        { key: 'search', label: this.$t('toolbar.searchAction'), shortcut: 'Ctrl F', action: () => this.openFlowchartSearch() },
        { key: 'shortcuts', label: this.$t('shortcutKey.title'), action: () => this.openFlowchartShortcuts() },
        { key: 'fitCanvas', label: this.$t('toolbar.fitCanvasAction'), shortcut: 'Ctrl 0', action: () => this.fitCanvasToView() },
        { key: 'resetViewport', label: this.$t('flowchart.fitView'), shortcut: 'Ctrl 1', action: () => this.resetViewport() },
        { key: 'tidyLayout', label: this.$t('flowchart.tidyLayout'), action: () => this.tidyFlowchartLayout() },
        { key: 'validate', label: this.$t('flowchart.validateStructure'), action: () => this.validateCurrentFlowchart({ openPanel: true }) },
        { key: 'autofix', label: this.$t('flowchart.autofixStructure'), action: () => this.autofixCurrentFlowchart() },
        { key: 'undoAutofix', label: this.$t('flowchart.autofixUndo'), disabled: !this.lastAutofixSnapshot, action: () => this.undoLastFlowchartAutofix() },
        { key: 'undo', label: this.$t('toolbar.undo'), shortcut: 'Ctrl Z', action: () => this.undoFlowchartChange() },
        { key: 'redo', label: this.$t('toolbar.redo'), shortcut: 'Ctrl Y', action: () => this.redoFlowchartChange() },
        { key: 'addStart', label: this.$t('flowchart.addStart'), action: () => this.addNodeByType({ type: 'start', autoConnect: true }) },
        { key: 'addProcess', label: this.$t('flowchart.addProcess'), action: () => this.addNodeByType({ type: 'process', autoConnect: true }) },
        { key: 'addDecision', label: this.$t('flowchart.addDecision'), action: () => this.addNodeByType({ type: 'decision', autoConnect: true }) },
        { key: 'addInput', label: this.$t('flowchart.addInput'), action: () => this.addNodeByType({ type: 'input', autoConnect: true }) },
        { key: 'addEnd', label: this.$t('flowchart.addEnd'), action: () => this.addNodeByType({ type: 'end', autoConnect: true }) },
        { key: 'selectAll', label: this.$t('flowchart.selectAllNodes'), shortcut: 'Ctrl A', action: () => this.selectAllNodes() },
        { key: 'duplicate', label: this.$t('flowchart.duplicateSelection'), shortcut: 'Ctrl D', disabled: !hasNodeSelection, action: () => this.duplicateSelectedNodes() },
        { key: 'copy', label: this.$t('flowchart.copySelection'), shortcut: 'Ctrl C', disabled: !hasNodeSelection, action: () => this.copySelectedNodes() },
        { key: 'paste', label: this.$t('flowchart.pasteSelection'), shortcut: 'Ctrl V', action: () => this.pasteCopiedNodes() },
        { key: 'delete', label: this.$t('flowchart.delete'), shortcut: 'Delete', disabled: !hasSelection, action: () => this.removeSelection() },
        { key: 'openLink', label: this.$t('flowchart.openNodeLink'), disabled: !this.selectedNode?.link, action: () => this.openSelectedNodeLink() },
        { key: 'alignLeft', label: this.$t('flowchart.alignLeft'), disabled: this.selectedNodeIds.length < 2, action: () => this.alignSelectedNodesLeft() },
        { key: 'alignCenterX', label: this.$t('flowchart.alignCenterX'), disabled: this.selectedNodeIds.length < 2, action: () => this.alignSelectedNodesCenterX() },
        { key: 'alignRight', label: this.$t('flowchart.alignRight'), disabled: this.selectedNodeIds.length < 2, action: () => this.alignSelectedNodesRight() },
        { key: 'alignTop', label: this.$t('flowchart.alignTop'), disabled: this.selectedNodeIds.length < 2, action: () => this.alignSelectedNodesTop() },
        { key: 'alignCenterY', label: this.$t('flowchart.alignCenterY'), disabled: this.selectedNodeIds.length < 2, action: () => this.alignSelectedNodesCenterY() },
        { key: 'alignBottom', label: this.$t('flowchart.alignBottom'), disabled: this.selectedNodeIds.length < 2, action: () => this.alignSelectedNodesBottom() },
        { key: 'distributeH', label: this.$t('flowchart.distributeHorizontal'), disabled: this.selectedNodeIds.length < 3, action: () => this.distributeSelectedNodesHorizontally() },
        { key: 'distributeV', label: this.$t('flowchart.distributeVertical'), disabled: this.selectedNodeIds.length < 3, action: () => this.distributeSelectedNodesVertically() },
        { key: 'bringFront', label: this.$t('flowchart.arrangeFront'), disabled: this.selectedNodeIds.length < 1, action: () => this.bringSelectedNodesToFront() },
        { key: 'sendBack', label: this.$t('flowchart.arrangeBack'), disabled: this.selectedNodeIds.length < 1, action: () => this.sendSelectedNodesToBack() },
        { key: 'importMindMap', label: this.$t('flowchart.importMindMapFileShort'), action: () => this.importMindMapFile() },
        { key: 'export', label: this.$t('toolbar.exportCenter'), action: () => this.openExportCenter() },
        { key: 'convertMindMap', label: this.$t('flowchart.convertMindMapShort'), action: () => this.convertCurrentMindMap() },
        { key: 'aiGenerate', label: this.$t('flowchart.aiGenerateShort'), disabled: this.isGenerating, action: () => this.generateWithAi() },
        { key: 'templates', label: this.$t('flowchart.templatePanelTitle'), action: () => { this.isInspectorOpen = true; this.inspectorPanelSection = 'templates' } },
        { key: 'toggleInspector', label: this.$t('flowchart.settingsPanelTitle'), action: () => this.toggleInspector() },
        { key: 'returnHome', label: this.$t('flowchart.returnHomeShort'), action: () => this.goHome() }
      ]
    },
    flowchartAiPreviewSummary() {
      return summarizeFlowchartStructure(this.pendingFlowchartAiResult?.flowchartData || null)
    },
    flowchartAiPreviewTitle() {
      return this.flowchartAiPreviewSummary.title
    },
    flowchartAiPreviewNodes() {
      return this.flowchartAiPreviewSummary.preview.nodes
    },
    flowchartAiPreviewEdges() {
      return this.flowchartAiPreviewSummary.preview.edges
    },
    flowchartAiPreviewViewBox() {
      return getFlowchartStructurePreviewViewBox(this.flowchartAiPreviewSummary.preview)
    },
    flowchartAiPreviewSummaryText() {
      return this.$t('flowchart.aiPreviewMessage', {
        nodes: this.flowchartAiPreviewSummary.nodes,
        edges: this.flowchartAiPreviewSummary.edges
      })
    },
    flowchartSaveStatusDetail() {
      const target =
        this.currentFileName ||
        this.currentDocument?.name ||
        this.$t('flowchart.fileNameFallback')
      if (this.isGenerating) {
        return this.$t('flowchart.aiGenerating')
      }
      if (this.persistTimer || this.recoveryTimer) {
        return this.$t('toolbar.statusAutosavingDetail', { target })
      }
      if (this.currentDocument?.dirty) {
        return this.$t('toolbar.statusUnsyncedDetail')
      }
      if (this.currentDocument?.path || this.currentFileName) {
        return this.$t('toolbar.statusSavedDetail')
      }
      return this.$t('toolbar.statusNoFileDetail')
    }
  },
  watch: {
    flowchartSearchKeyword() {
      this.flowchartSearchActiveIndex = 0
    }
  },
  created() {
    this._edgeLayoutCache = new Map()
    this.autoScrollTick = this.autoScrollTick.bind(this)
  },
  async mounted() {
    await ensureBootstrapDocumentState()
    this.loadFlowchartState()
    window.addEventListener('keydown', this.handleGlobalKeydown)
    window.addEventListener('beforeunload', this.onBeforeUnload)
    this.$nextTick(() => {
      this.syncCanvasViewportSize()
      if (this.isDefaultViewport(this.flowchartData.viewport)) {
        this.fitCanvasToView({
          persist: false
        })
      }
    })
    window.addEventListener('resize', this.syncCanvasViewportSize)
  },
  beforeUnmount() {
    this.isFlowchartUnmounted = true
    this.stopAutoScroll()
    this.cancelFlowchartAiRequest({
      resetGenerating: true
    })
    this.removeDragListeners()
    this.removeNodeResizeListeners()
    this.cancelConnectorDrag()
    this.cancelEdgeReconnect()
    this.cancelEdgeBendDrag()
    this.cancelEdgeLabelDrag()
    this.removeCanvasPanListeners()
    this.removeAreaSelectionListeners()
    window.removeEventListener('keydown', this.handleGlobalKeydown)
    window.removeEventListener('beforeunload', this.onBeforeUnload)
    window.removeEventListener('resize', this.syncCanvasViewportSize)
    if (this.persistTimer) {
      clearTimeout(this.persistTimer)
      this.persistTimer = 0
    }
    if (this.recoveryTimer) {
      clearTimeout(this.recoveryTimer)
      this.recoveryTimer = 0
    }
    if (this.interactivePersistTimer) {
      clearTimeout(this.interactivePersistTimer)
      this.interactivePersistTimer = 0
    }
    this.interactivePersistOptions = null
    if (this.dragFrameId) {
      cancelAnimationFrame(this.dragFrameId)
      this.dragFrameId = 0
    }
    this.pendingDragPoint = null
    if (this.canvasPanFrameId) {
      cancelAnimationFrame(this.canvasPanFrameId)
      this.canvasPanFrameId = 0
    }
    this.pendingCanvasPanPoint = null
  },
  methods: {
    onFlowchartDragEnter(event) {
      if (!event?.dataTransfer?.types?.includes?.('Files') && !Array.from(event?.dataTransfer?.types || []).includes('Files')) {
        // still allow
      }
      this.isFlowchartDragOver = true
    },
    onFlowchartDragOver() {
      this.isFlowchartDragOver = true
    },
    onFlowchartDragLeave(event) {
      // only clear when leaving editor root
      if (event?.currentTarget === event?.target) {
        this.isFlowchartDragOver = false
      }
    },
    selectXmindCanvas(content = []) {
      const options = (Array.isArray(content) ? content : []).map((item, index) => ({
        id: item?.id || index,
        title:
          item?.title ||
          item?.rootTopic?.title ||
          this.$t('flowchart.xmindCanvasFallback', { index: index + 1 }),
        raw: item
      }))
      this.xmindCanvasOptions = options
      this.xmindCanvasSelectedIndex = 0
      this.xmindCanvasDialogVisible = true
      this.$nextTick(() => {
        this.$refs.xmindConfirmBtn?.focus?.()
      })
      return new Promise(resolve => {
        this.xmindCanvasResolve = resolve
      })
    },
    confirmXmindCanvasSelect() {
      const selected =
        this.xmindCanvasOptions[this.xmindCanvasSelectedIndex]?.raw ||
        this.xmindCanvasOptions[0]?.raw ||
        null
      const resolve = this.xmindCanvasResolve
      this.xmindCanvasDialogVisible = false
      this.xmindCanvasResolve = null
      this.xmindCanvasOptions = []
      if (typeof resolve === 'function') resolve(selected)
    },
    cancelXmindCanvasSelect() {
      const resolve = this.xmindCanvasResolve
      this.xmindCanvasDialogVisible = false
      this.xmindCanvasResolve = null
      this.xmindCanvasOptions = []
      if (typeof resolve === 'function') resolve(null)
    },
    async onFlowchartDrop(event) {
      this.isFlowchartDragOver = false
      const file = event?.dataTransfer?.files?.[0]
      if (!file) return
      try {
        await this.importDroppedFile(file)
      } catch (error) {
        this.$message.error(error?.message || this.$t('flowchart.importMindMapFileFailed'))
      }
    },
    async importDroppedFile(file) {
      // Reuse mindmap import conversion path when possible
      if (typeof this.importMindMapFileFromBlob === 'function') {
        return this.importMindMapFileFromBlob(file)
      }
      // Fallback: open import mind map dialog flow
      return this.importMindMapFile()
    },
    validateCurrentFlowchart({ openPanel = true } = {}) {
      const nodeCount = this.flowchartData?.nodes?.length || 0
      if (nodeCount >= 80) {
        this.isValidatingFlowchart = true
        this.$message.info(this.$t('flowchart.validateProgress'))
      }
      const result = validateFlowchartStructure(this.flowchartData)
      this.isValidatingFlowchart = false
      this.flowchartValidationResult = result
      if (openPanel) this.flowchartValidationVisible = true
      const message = formatFlowchartValidationMessage(result, this.$t.bind(this))
      if (!result.issues.length) {
        this.$message.success(message)
        return result
      }
      if (result.ok) this.$message.warning(message)
      else this.$message.error(message)
      return result
    },
    closeFlowchartValidationPanel() {
      this.flowchartValidationVisible = false
    },
    focusFlowchartValidationIssue(issue, index = 0, event = null) {
      if (!issue) return
      this.selectedValidationIssueKey = issue.code + '-' + index
      const append = !!(event?.shiftKey || event?.ctrlKey || event?.metaKey)
      let nodeIds = Array.isArray(issue.nodeIds) ? [...issue.nodeIds] : []
      if (!nodeIds.length) {
        if (issue.code === 'missing-start') {
          const start = (this.flowchartData.nodes || []).find(n => n.type === 'start')
          if (start) nodeIds = [start.id]
        } else if (issue.code === 'missing-end') {
          const end = (this.flowchartData.nodes || []).find(n => n.type === 'end')
          if (end) nodeIds = [end.id]
        }
      }
      if (!nodeIds.length) return
      this.selectedNodeIds = append
        ? Array.from(new Set([...(this.selectedNodeIds || []), ...nodeIds]))
        : nodeIds
      this.selectedEdgeId = ''
      this.validationHighlightNodeIds = [...this.selectedNodeIds]
      const node = this.flowchartNodeLookup.get(nodeIds[0])
      if (node && typeof this.centerViewportAt === 'function') {
        this.centerViewportAt({
          x: Number(node.x || 0) + Number(node.width || 0) / 2,
          y: Number(node.y || 0) + Number(node.height || 0) / 2
        })
      }
    },
    highlightValidationErrors() {
      const issues = (this.flowchartValidationResult?.issues || []).filter(
        issue => issue.severity === 'error'
      )
      if (!issues.length) {
        this.$message.info(this.$t('flowchart.validateNoErrors'))
        return
      }
      // temporarily swap issues list for reuse
      const original = this.flowchartValidationResult
      this.flowchartValidationResult = { ...original, issues }
      this.highlightAllValidationNodes()
      this.flowchartValidationResult = original
    },
    highlightAllValidationNodes() {
      const issues = this.flowchartValidationResult?.issues || []
      const nodeIds = []
      issues.forEach(issue => {
        if (Array.isArray(issue.nodeIds)) nodeIds.push(...issue.nodeIds)
      })
      // include missing start/end if exist after previous autofix attempts
      const start = (this.flowchartData.nodes || []).find(n => n.type === 'start')
      const end = (this.flowchartData.nodes || []).find(n => n.type === 'end')
      if (issues.some(i => i.code === 'missing-start') && start) nodeIds.push(start.id)
      if (issues.some(i => i.code === 'missing-end') && end) nodeIds.push(end.id)
      const unique = Array.from(new Set(nodeIds.filter(Boolean)))
      if (!unique.length) {
        this.$message.info(this.$t('flowchart.validateNoSelectableNodes'))
        return
      }
      this.selectedNodeIds = unique
      this.selectedEdgeId = ''
      this.validationHighlightNodeIds = unique
      const node = this.flowchartNodeLookup.get(unique[0])
      if (node && typeof this.centerViewportAt === 'function') {
        this.centerViewportAt({
          x: Number(node.x || 0) + Number(node.width || 0) / 2,
          y: Number(node.y || 0) + Number(node.height || 0) / 2
        })
      }
    },

    async autofixCurrentFlowchart() {
      const plan = buildFlowchartAutofixPlan(this.flowchartData)
      if (!plan.actions.length) {
        this.$message.success(this.$t('flowchart.autofixNoop'))
        this.validateCurrentFlowchart({ openPanel: true })
        return plan
      }
      const beforeNodes = plan.before?.summary?.nodes || 0
      const afterNodes = plan.after?.summary?.nodes || 0
      const beforeEdges = plan.before?.summary?.edges || 0
      const afterEdges = plan.after?.summary?.edges || 0
      const beforeScore = plan.before?.summary?.score || 0
      const afterScore = plan.after?.summary?.score || 0
      const formatDelta = value => (value > 0 ? '+' + value : String(value))
      const concrete = []
      const diff = plan.diff || {}
      ;(diff.addedNodes || []).slice(0, 3).forEach(node => {
        concrete.push(
          this.$t('flowchart.autofixDiffAddNode', {
            text: node.text || node.type || node.id
          })
        )
      })
      ;(diff.removedEdges || []).slice(0, 2).forEach(edge => {
        concrete.push(
          this.$t('flowchart.autofixDiffRemoveEdge', {
            source: edge.source,
            target: edge.target
          })
        )
      })
      ;(diff.addedEdges || []).slice(0, 3).forEach(edge => {
        concrete.push(
          this.$t('flowchart.autofixDiffAddEdge', {
            source: edge.source,
            target: edge.target
          })
        )
      })
      ;(diff.labeledEdges || []).slice(0, 2).forEach(edge => {
        concrete.push(
          this.$t('flowchart.autofixDiffLabelEdge', {
            label: edge.label,
            source: edge.source,
            target: edge.target
          })
        )
      })
      const detail = [
        this.$t('flowchart.autofixDiffSummary', {
          nodes: formatDelta(afterNodes - beforeNodes),
          edges: formatDelta(afterEdges - beforeEdges),
          score: formatDelta(afterScore - beforeScore)
        }),
        ...concrete,
        ...plan.actions
          .map(action =>
            this.$t('flowchart.autofixAction.' + action.code, {
              count: action.count || 1
            })
          )
          .filter(Boolean)
          .slice(0, 4)
      ].join('\n')
      try {
        await this.$confirm(
          this.$t('flowchart.autofixPreviewMessage', {
            count: plan.actions.length,
            detail: detail || this.$t('flowchart.autofixStructure')
          }),
          this.$t('flowchart.autofixPreviewTitle'),
          {
            type: 'warning',
            confirmButtonText: this.$t('flowchart.autofixConfirm'),
            cancelButtonText: this.$t('flowchart.autofixCancel')
          }
        )
      } catch (_error) {
        this.$message.info(this.$t('flowchart.autofixCancel'))
        return null
      }

      this.lastAutofixSnapshot = {
        nodes: cloneJson(this.flowchartData.nodes || []),
        edges: cloneJson(this.flowchartData.edges || [])
      }
      this.lastAutofixActions = plan.actions
      this.lastAutofixScoreDelta =
        Number(plan.after?.summary?.score || 0) -
        Number(plan.before?.summary?.score || 0)
      this.flowchartData = {
        ...this.flowchartData,
        nodes: plan.flowchartData.nodes,
        edges: plan.flowchartData.edges
      }
      this.flowchartValidationResult = plan.after
      this.flowchartValidationVisible = true
      void this.persistFlowchartState()
      this.$nextTick(() => {
        if (typeof this.fitCanvasToView === 'function') {
          this.fitCanvasToView({ persist: false })
        }
      })
      this.$message.success(
        this.$t('flowchart.autofixDoneDetail', {
          count: plan.actions.length,
          detail: detail.replace(/\n/g, '；')
        })
      )
      return plan
    },


    focusAutofixAction(action) {
      if (!action) return
      const nodeIds = []
      if (action.nodeId) nodeIds.push(action.nodeId)
      if (Array.isArray(action.nodeIds)) nodeIds.push(...action.nodeIds)
      if (action.sourceId) nodeIds.push(action.sourceId)
      if (action.targetId) nodeIds.push(action.targetId)
      const unique = Array.from(new Set(nodeIds.filter(Boolean)))
      if (unique.length) {
        this.selectedNodeIds = unique
        this.selectedEdgeId = ''
        this.validationHighlightNodeIds = unique
        const node = this.flowchartNodeLookup.get(unique[0])
        if (node && typeof this.centerViewportAt === 'function') {
          this.centerViewportAt({
            x: Number(node.x || 0) + Number(node.width || 0) / 2,
            y: Number(node.y || 0) + Number(node.height || 0) / 2
          })
        }
        return
      }
      if (action.code === 'add-start' || action.code === 'connect-start') {
        const start = (this.flowchartData.nodes || []).find(n => n.type === 'start')
        if (start) {
          this.selectedNodeIds = [start.id]
          this.validationHighlightNodeIds = [start.id]
          if (typeof this.centerViewportAt === 'function') {
            this.centerViewportAt({
              x: Number(start.x || 0) + Number(start.width || 0) / 2,
              y: Number(start.y || 0) + Number(start.height || 0) / 2
            })
          }
        }
        return
      }
      if (action.code === 'add-end' || action.code === 'connect-end') {
        const end = (this.flowchartData.nodes || []).find(n => n.type === 'end')
        if (end) {
          this.selectedNodeIds = [end.id]
          this.validationHighlightNodeIds = [end.id]
          if (typeof this.centerViewportAt === 'function') {
            this.centerViewportAt({
              x: Number(end.x || 0) + Number(end.width || 0) / 2,
              y: Number(end.y || 0) + Number(end.height || 0) / 2
            })
          }
        }
      }
    },

    undoLastFlowchartAutofix() {
      if (!this.lastAutofixSnapshot) {
        this.$message.info(this.$t('flowchart.autofixUndoEmpty'))
        return
      }
      this.flowchartData = {
        ...this.flowchartData,
        nodes: cloneJson(this.lastAutofixSnapshot.nodes || []),
        edges: cloneJson(this.lastAutofixSnapshot.edges || [])
      }
      this.lastAutofixSnapshot = null
      this.lastAutofixActions = []
      this.lastAutofixScoreDelta = 0
      void this.persistFlowchartState()
      this.validateCurrentFlowchart({ openPanel: true })
      this.$message.success(this.$t('flowchart.autofixUndoDone'))
    },


    openCommandPalette() {
      this.commandPaletteVisible = true
      this.flowchartSearchVisible = false
      this.flowchartShortcutVisible = false
    },
    closeCommandPalette() {
      this.commandPaletteVisible = false
    },
    executeCommandPaletteItem(item) {
      if (!item || item.disabled || typeof item.action !== 'function') return
      this.closeCommandPalette()
      item.action.call(this)
    },
    openFlowchartAiPreview(result) {
      this.pendingFlowchartAiResult = result || null
      this.flowchartAiPreviewVisible = !!result
    },
    discardFlowchartAiPreview() {
      this.flowchartAiPreviewVisible = false
      this.pendingFlowchartAiResult = null
    },
    applyFlowchartAiPreview() {
      if (!this.pendingFlowchartAiResult) {
        this.discardFlowchartAiPreview()
        return
      }
      this.applyGeneratedFlowchart(this.pendingFlowchartAiResult)
      this.discardFlowchartAiPreview()
      this.$message.success(this.$t('flowchart.aiGenerated'))
    },
    getAiPreviewPath(edge) {
      return getFlowchartStructurePreviewPath(this.flowchartAiPreviewSummary.preview, edge)
    },
    getAiPreviewEdgeStyle(edge) {
      return getFlowchartStructureEdgeStyle(edge)
    },
    getAiPreviewNodeStyle() {
      return getFlowchartStructureNodeStyle()
    },
    getAiPreviewDecisionPolygon(node) {
      return getFlowchartDecisionPolygon(node)
    },
    getAiPreviewInputPolygon(node) {
      return getFlowchartInputPolygon(node)
    },

    markNodesAsNew(nodeIds) {
      if (!nodeIds?.length) return
      this.newNodeIds = new Set(nodeIds)
      setTimeout(() => {
        if (this.newNodeIds) {
          this.newNodeIds = null
        }
      }, 250)
    },
    toggleInspectorSection(section = 'templates') {
      const nextSection = ['templates', 'settings', 'inspector'].includes(section)
        ? section
        : 'templates'
      if (this.isInspectorOpen && this.inspectorPanelSection === nextSection) {
        this.closeInspector()
        return
      }
      this.inspectorPanelSection = nextSection
      this.isInspectorOpen = true
    },
    showInspectorSection(section = 'templates') {
      this.inspectorPanelSection = ['templates', 'settings', 'inspector'].includes(section)
        ? section
        : 'templates'
      this.isInspectorOpen = true
    },
    async toggleAppearance() {
      try {
        await toggleThemeMode()
      } catch (error) {
        console.error('toggleAppearance failed', error)
        this.$message.error(error?.message || this.$t('flowchart.saveFailed'))
      }
    },
    loadFlowchartState() {
      const bootstrapState = getBootstrapState()
      this._edgeLayoutCache = new Map()
      this.flowchartData = cloneJson(
        bootstrapState.flowchartData || createDefaultFlowchartData()
      )
      const nextFlowchartConfig = {
        snapToGrid: false,
        gridSize: 24,
        themeId: 'blueprint',
        strictAlignment: false,
        backgroundStyle: 'grid',
        ...cloneJson(bootstrapState.flowchartConfig || {})
      }
      nextFlowchartConfig.snapToGrid = false
      nextFlowchartConfig.backgroundStyle =
        ['grid', 'dots'].includes(nextFlowchartConfig.backgroundStyle)
          ? nextFlowchartConfig.backgroundStyle
          : 'none'
      this.flowchartConfig = nextFlowchartConfig
      this.ensureFlowchartViewport()
      this.initializeFlowchartHistory()
    },
    ...flowchartHistoryMethods,

    createEdgeLayoutCacheKey(edge, sourceNode, targetNode) {
      const sa = edge.sourceAnchor
      const ta = edge.targetAnchor
      const r = edge.route
      const lp = edge.labelPosition
      const s = edge.style
      const ld = this.edgeDirectionLockMap?.[edge.id]
      const routeStr = r
        ? Array.isArray(r.manualPoints) && r.manualPoints.length
          ? r.manualPoints
              .map(point => `${Number(point?.x || 0)},${Number(point?.y || 0)}`)
              .join(';')
          : `${r.orthogonalLane?.axis || ''}:${r.orthogonalLane?.value ?? ''}`
        : ''
      const ldStr = ld
        ? `${ld.sourceDirection || ''}:${ld.targetDirection || ''}`
        : ''
      return [
        edge.id,
        sourceNode.id, Number(sourceNode.x || 0), Number(sourceNode.y || 0),
        Number(sourceNode.width || 0), Number(sourceNode.height || 0),
        targetNode.id, Number(targetNode.x || 0), Number(targetNode.y || 0),
        Number(targetNode.width || 0), Number(targetNode.height || 0),
        sa ? `${sa.handleKey || ''}${sa.xRatio ?? ''}${sa.yRatio ?? ''}` : '',
        ta ? `${ta.handleKey || ''}${ta.xRatio ?? ''}${ta.yRatio ?? ''}` : '',
        routeStr,
        edge.label || '',
        lp ? `${lp.ratio ?? ''}${lp.offsetX ?? ''}${lp.offsetY ?? ''}` : '',
        s ? `${s.pathType || ''}${s.strokeColor || ''}${s.strokeWidth ?? ''}` : '',
        this.flowchartConfig.themeId || '',
        this.isDark ? 1 : 0,
        this.flowchartConfig.strictAlignment ? 1 : 0,
        ldStr
      ].join('|')
    },

    resolveEdgeLayoutForRender(edge, sourceNode, targetNode) {
      return getFlowchartEdgeLayout(edge, sourceNode, targetNode, {
        theme: this.resolvedFlowchartTheme,
        strictAlignment: !!this.flowchartConfig.strictAlignment,
        lockedDirections: this.edgeDirectionLockMap?.[edge.id] || null,
        nodes: this.flowchartData.nodes,
        interactive: this.isInteractiveEdgeRouting
      })
    },

    getInteractiveEdgeLayoutEdgeIds() {
      const interactiveEdgeIds = new Set()
      const addNodeEdges = nodeIds => {
        if (!nodeIds?.size) {
          return
        }
        this.flowchartData.edges.forEach(edge => {
          if (nodeIds.has(edge.source) || nodeIds.has(edge.target)) {
            interactiveEdgeIds.add(edge.id)
          }
        })
      }
      if (this.dragState?.nodes?.length) {
        addNodeEdges(new Set(this.dragState.nodes.map(item => item.id)))
      }
      if (this.resizeState?.nodeId) {
        addNodeEdges(new Set([this.resizeState.nodeId]))
      }
      if (this.edgeReconnectState?.edgeId) {
        interactiveEdgeIds.add(this.edgeReconnectState.edgeId)
      }
      if (this.edgeBendDragState?.edgeId) {
        interactiveEdgeIds.add(this.edgeBendDragState.edgeId)
      }
      if (this.edgeLabelDragState?.edgeId) {
        interactiveEdgeIds.add(this.edgeLabelDragState.edgeId)
      }
      return interactiveEdgeIds
    },

    getNodeStyle(node) {
      const visualStyle = getFlowchartNodeVisualStyle(node, {
        isDark: this.isDark,
        theme: this.resolvedFlowchartTheme
      })
      const usesPolygonShape =
        node?.type === 'decision' || node?.type === 'input'
      return {
        left: `${node.x}px`,
        top: `${node.y}px`,
        width: `${node.width}px`,
        height: `${node.height}px`,
        backgroundColor: usesPolygonShape ? 'transparent' : visualStyle.fill,
        borderColor: visualStyle.stroke,
        color: visualStyle.textColor,
        '--flowchart-node-fill-current': visualStyle.fill,
        '--flowchart-node-stroke-current': visualStyle.stroke,
        '--flowchart-node-text-current': visualStyle.textColor
      }
    },
    ...flowchartConnectorMethods,
    ...flowchartReconnectMethods,
    ...flowchartViewportMethods,
    ...flowchartSelectionMethods,
    ...flowchartInlineEditMethods,
    ...flowchartNodeMethods,
    ...flowchartResizeMethods,
    ...flowchartAutoScrollMethods,
    ...flowchartStyleMethods,
    ...flowchartDocumentMethods,
    ...flowchartAiMethods,

    relaxConnectedOrthogonalEdgeRoutes(nodeIds = []) {
      const movedNodeIds = new Set(nodeIds.filter(Boolean))
      if (!movedNodeIds.size) {
        return
      }
      this.flowchartData.edges.forEach(edge => {
        if (
          !edge?.route ||
          !movedNodeIds.has(edge.source) &&
            !movedNodeIds.has(edge.target)
        ) {
          return
        }
        const sourceNode = this.flowchartNodeLookup.get(edge.source)
        const targetNode = this.flowchartNodeLookup.get(edge.target)
        if (!sourceNode || !targetNode) {
          return
        }
        const relaxedLayout = getFlowchartEdgeLayout(
          {
            ...edge,
            route: null
          },
          sourceNode,
          targetNode,
          {
            theme: this.resolvedFlowchartTheme,
            strictAlignment: !!this.flowchartConfig.strictAlignment,
            nodes: this.flowchartData.nodes
          }
        )
        if (Array.isArray(relaxedLayout?.pathPoints) && relaxedLayout.pathPoints.length <= 3) {
          edge.route = null
        }
      })
    },

    snapPositionToGrid(position) {
      return position
    },

    clearAlignmentGuides() {
      this.alignmentGuides = []
    },

    createNodeAlignmentMetrics(node, x = Number(node?.x || 0), y = Number(node?.y || 0)) {
      const width = Number(node?.width || 0)
      const height = Number(node?.height || 0)
      return {
        left: x,
        centerX: x + width / 2,
        right: x + width,
        top: y,
        centerY: y + height / 2,
        bottom: y + height
      }
    },

    getAlignmentSnapThreshold() {
      const viewport = this.getViewport()
      const zoom = Math.max(0.25, Number(viewport.zoom || 1) || 1)
      const baseThreshold = FLOWCHART_ALIGNMENT_THRESHOLD / zoom
      if (this.flowchartConfig.strictAlignment) {
        return Math.max(8, Math.min(20, baseThreshold * 1.45))
      }
      return Math.max(4, Math.min(14, baseThreshold))
    },

    getStraightEdgeSnapThreshold() {
      const viewport = this.getViewport()
      const zoom = Math.max(0.25, Number(viewport.zoom || 1) || 1)
      const baseThreshold = FLOWCHART_STRAIGHT_EDGE_SNAP_THRESHOLD / zoom
      return Math.max(8, Math.min(24, baseThreshold))
    },

    resolveAlignmentCandidate(candidates, axis, threshold, releaseThreshold) {
      const lock = this.dragState?.snapLock?.[axis] || null
      if (!candidates.length) {
        return null
      }
      if (lock) {
        const lockedCandidate = candidates.find(candidate => {
          return candidate.lockKey === lock.lockKey
        })
        if (
          lockedCandidate &&
          Math.abs(lockedCandidate.diff) <= releaseThreshold
        ) {
          return lockedCandidate
        }
      }
      const activeCandidates = candidates.filter(candidate => {
        return Math.abs(candidate.diff) <= (candidate.snapThreshold || threshold)
      })
      if (!activeCandidates.length) {
        return null
      }
      return activeCandidates.sort((a, b) => {
        if ((b.priority || 0) !== (a.priority || 0)) {
          return (b.priority || 0) - (a.priority || 0)
        }
        return Math.abs(a.diff) - Math.abs(b.diff)
      })[0]
    },

    getConnectedNodeIds(nodeId) {
      if (!nodeId) {
        return new Set()
      }
      return this.flowchartData.edges.reduce((result, edge) => {
        if (edge.source === nodeId && edge.target) {
          result.add(edge.target)
        }
        if (edge.target === nodeId && edge.source) {
          result.add(edge.source)
        }
        return result
      }, new Set())
    },

    createAlignmentGuideSpan(axis, guideValue, movingMetrics, candidateMetrics) {
      const padding = 40
      if (axis === 'x') {
        return {
          x1: guideValue,
          y1: Math.max(
            0,
            Math.min(movingMetrics.top, candidateMetrics.top) - padding
          ),
          x2: guideValue,
          y2: Math.min(
            this.canvasWorldBounds.height,
            Math.max(movingMetrics.bottom, candidateMetrics.bottom) + padding
          )
        }
      }
      return {
        x1: Math.max(
          0,
          Math.min(movingMetrics.left, candidateMetrics.left) - padding
        ),
        y1: guideValue,
        x2: Math.min(
          this.canvasWorldBounds.width,
          Math.max(movingMetrics.right, candidateMetrics.right) + padding
        ),
        y2: guideValue
      }
    },

    computeStraightEdgeSnap({
      node,
      movingMetrics,
      selectedSet,
      threshold,
      releaseThreshold
    }) {
      const connectedNodeIds = this.getConnectedNodeIds(node.id)
      const xCandidates = []
      const yCandidates = []
      if (!connectedNodeIds.size) {
        return { xCandidates, yCandidates }
      }
      const axisDistanceFloor = 24
      this.flowchartData.nodes.forEach(candidate => {
        if (!connectedNodeIds.has(candidate.id) || selectedSet.has(candidate.id)) {
          return
        }
        const candidateMetrics = this.createNodeAlignmentMetrics(candidate)
        const centerXDiff = candidateMetrics.centerX - movingMetrics.centerX
        const centerYDiff = candidateMetrics.centerY - movingMetrics.centerY
        const centerXDistance = Math.abs(centerXDiff)
        const centerYDistance = Math.abs(centerYDiff)
        if (
          centerXDistance <= releaseThreshold &&
          centerYDistance >= Math.max(axisDistanceFloor, centerXDistance * 2)
        ) {
          xCandidates.push({
            diff: centerXDiff,
            guideX: candidateMetrics.centerX,
            candidateMetrics,
            priority: 8,
            snapThreshold: threshold,
            lockKey: `straight:${candidate.id}:centerX`
          })
        }
        if (
          centerYDistance <= releaseThreshold &&
          centerXDistance >= Math.max(axisDistanceFloor, centerYDistance * 2)
        ) {
          yCandidates.push({
            diff: centerYDiff,
            guideY: candidateMetrics.centerY,
            candidateMetrics,
            priority: 8,
            snapThreshold: threshold,
            lockKey: `straight:${candidate.id}:centerY`
          })
        }
      })
      return { xCandidates, yCandidates }
    },

    computeAlignmentSnap({ node, x, y, selectedIds = [] } = {}) {
      if (!node) {
        return {
          offsetX: 0,
          offsetY: 0,
          guides: []
        }
      }
      const selectedSet = new Set(selectedIds)
      const movingMetrics = this.createNodeAlignmentMetrics(node, x, y)
      const threshold = this.getAlignmentSnapThreshold()
      const straightThreshold = this.getStraightEdgeSnapThreshold()
      const releaseThreshold = threshold * 1.75
      const straightReleaseThreshold = straightThreshold * 1.75
      const strictAlignment = !!this.flowchartConfig.strictAlignment
      const connectedNodeIds = this.getConnectedNodeIds(node.id)
      const xCandidates = []
      const yCandidates = []
      const straightSnap = this.computeStraightEdgeSnap({
        node,
        movingMetrics,
        selectedSet,
        threshold: straightThreshold,
        releaseThreshold: straightReleaseThreshold
      })
      xCandidates.push(...straightSnap.xCandidates)
      yCandidates.push(...straightSnap.yCandidates)
      this.flowchartData.nodes.forEach(candidate => {
        if (selectedSet.has(candidate.id)) return
        const candidateMetrics = this.createNodeAlignmentMetrics(candidate)
        ;[
          ['left', 'left'],
          ['centerX', 'centerX'],
          ['right', 'right']
        ].forEach(([movingKey, candidateKey]) => {
          const diff = candidateMetrics[candidateKey] - movingMetrics[movingKey]
          if (Math.abs(diff) <= releaseThreshold) {
            const isConnected = connectedNodeIds.has(candidate.id)
            const isCenterAlignment = movingKey === 'centerX'
            xCandidates.push({
              diff,
              guideX: candidateMetrics[candidateKey],
              candidateMetrics,
              priority:
                strictAlignment && isConnected && isCenterAlignment
                  ? 4
                  : strictAlignment && isCenterAlignment
                    ? 2
                    : isConnected
                      ? 1
                      : 0,
              lockKey: `${candidate.id}:${candidateKey}:${movingKey}`
            })
          }
        })
        ;[
          ['top', 'top'],
          ['centerY', 'centerY'],
          ['bottom', 'bottom']
        ].forEach(([movingKey, candidateKey]) => {
          const diff = candidateMetrics[candidateKey] - movingMetrics[movingKey]
          if (Math.abs(diff) <= releaseThreshold) {
            const isConnected = connectedNodeIds.has(candidate.id)
            const isCenterAlignment = movingKey === 'centerY'
            yCandidates.push({
              diff,
              guideY: candidateMetrics[candidateKey],
              candidateMetrics,
              priority:
                strictAlignment && isConnected && isCenterAlignment
                  ? 4
                  : strictAlignment && isCenterAlignment
                    ? 2
                    : isConnected
                      ? 1
                      : 0,
              lockKey: `${candidate.id}:${candidateKey}:${movingKey}`
            })
          }
        })
      })
      const bestX = this.resolveAlignmentCandidate(
        xCandidates,
        'x',
        threshold,
        Math.max(releaseThreshold, straightReleaseThreshold)
      )
      const bestY = this.resolveAlignmentCandidate(
        yCandidates,
        'y',
        threshold,
        Math.max(releaseThreshold, straightReleaseThreshold)
      )
      const guides = []
      if (bestX) {
        guides.push({
          id: `vertical-${bestX.guideX}`,
          ...this.createAlignmentGuideSpan(
            'x',
            bestX.guideX,
            movingMetrics,
            bestX.candidateMetrics
          )
        })
      }
      if (bestY) {
        guides.push({
          id: `horizontal-${bestY.guideY}`,
          ...this.createAlignmentGuideSpan(
            'y',
            bestY.guideY,
            movingMetrics,
            bestY.candidateMetrics
          )
        })
      }
      if (this.dragState?.snapLock) {
        this.dragState.snapLock = {
          x: bestX ? { lockKey: bestX.lockKey } : null,
          y: bestY ? { lockKey: bestY.lockKey } : null
        }
      }
      return {
        offsetX: bestX?.diff || 0,
        offsetY: bestY?.diff || 0,
        guides
      }
    },

  }
}
</script>
