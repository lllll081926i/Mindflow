<template>
  <div class="toolbarContainer" :class="{ isDark: isDark }">
    <div
      class="toolbar"
      ref="toolbarRef"
      :class="{ hideLabels: !showToolbarLabels }"
    >
      <!-- 节点操作 -->
      <div class="toolbarBlock fileActionsBlock">
        <ToolbarNodeBtnList
          :list="horizontalList"
          :show-text="showToolbarLabels"
          @show-node-image="openNodeImageDialog"
          @show-node-link="openNodeLinkDialog"
          @show-node-note="openNodeNoteDialog"
          @show-node-tag="openNodeTagDialog"
        ></ToolbarNodeBtnList>
        <!-- 更多 -->
        <el-popover
          v-model:visible="popoverShow"
          placement="bottom-end"
          width="120"
          trigger="hover"
          v-if="showMoreBtn"
          :style="{ marginLeft: horizontalList.length > 0 ? '20px' : 0 }"
        >
          <ToolbarNodeBtnList
            dir="v"
            :list="verticalList"
            :show-text="true"
            @click="popoverShow = false"
            @show-node-image="openNodeImageDialog"
            @show-node-link="openNodeLinkDialog"
            @show-node-note="openNodeNoteDialog"
            @show-node-tag="openNodeTagDialog"
          ></ToolbarNodeBtnList>
          <template #reference>
            <div
              class="toolbarBtn"
              role="button"
              tabindex="0"
              :aria-label="$t('toolbar.more')"
              @keydown.enter.prevent="popoverShow = !popoverShow"
              @keydown.space.prevent="popoverShow = !popoverShow"
            >
              <span class="icon iconfont edit-icon-more"></span>
              <span class="text">{{ $t('toolbar.more') }}</span>
            </div>
          </template>
        </el-popover>
      </div>
      <!-- 导出 -->
      <div class="toolbarBlock">
        <div
          class="toolbarBtn fileActionBtn"
          role="button"
          tabindex="0"
          :aria-label="$t('toolbar.directory')"
          @click="openDirectory"
          @keydown.enter.prevent="openDirectory"
          @keydown.space.prevent="openDirectory"
          v-if="!isMobile"
        >
          <span class="icon iconfont icondakai"></span>
          <span class="text">{{ $t('toolbar.directory') }}</span>
        </div>
        <el-tooltip
          effect="dark"
          :content="$t('toolbar.newFileTip')"
          placement="bottom"
          v-if="!isMobile"
        >
          <div
            class="toolbarBtn fileActionBtn"
            role="button"
            tabindex="0"
            :aria-label="$t('toolbar.newFile')"
            @click="createNewLocalFile"
            @keydown.enter.prevent="createNewLocalFile"
            @keydown.space.prevent="createNewLocalFile"
          >
            <span class="icon iconfont iconxinjian"></span>
            <span class="text">{{ $t('toolbar.newFile') }}</span>
          </div>
        </el-tooltip>
        <el-tooltip
          effect="dark"
          :content="$t('toolbar.openFileTip')"
          placement="bottom"
          v-if="!isMobile"
        >
          <div
            class="toolbarBtn fileActionBtn"
            role="button"
            tabindex="0"
            :aria-label="$t('toolbar.openFile')"
            @click="openLocalFile"
            @keydown.enter.prevent="openLocalFile"
            @keydown.space.prevent="openLocalFile"
          >
            <span class="icon iconfont iconwenjian1"></span>
            <span class="text">{{ $t('toolbar.openFile') }}</span>
          </div>
        </el-tooltip>
        <el-dropdown
          v-if="!isMobile && isDesktopRuntime"
          trigger="click"
          @command="openRecentFile"
        >
          <div
            class="toolbarBtn fileActionBtn"
            role="button"
            tabindex="0"
            :aria-label="$t('toolbar.recentFiles')"
          >
            <span class="icon iconfont iconwenjian"></span>
            <span class="text">{{ $t('toolbar.recentFiles') }}</span>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-for="item in recentFiles"
                :key="item.path"
                :command="item"
              >
                {{ item.name }}
              </el-dropdown-item>
              <el-dropdown-item v-if="recentFiles.length <= 0" disabled>
                {{ $t('toolbar.noRecentFiles') }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-tooltip
          effect="dark"
          :content="$t('toolbar.saveTip')"
          placement="bottom"
          v-if="!isMobile && canDirectSave"
        >
          <div
            class="toolbarBtn fileActionBtn"
            role="button"
            tabindex="0"
            :aria-label="$t('toolbar.save')"
            @click="saveCurrentLocalFile"
            @keydown.enter.prevent="saveCurrentLocalFile"
            @keydown.space.prevent="saveCurrentLocalFile"
          >
            <span class="icon iconfont iconwenjian"></span>
            <span class="text">{{ $t('toolbar.save') }}</span>
          </div>
        </el-tooltip>
        <div
          class="toolbarBtn fileActionBtn"
          role="button"
          tabindex="0"
          :aria-label="$t('toolbar.saveAs')"
          @click="saveLocalFile"
          @keydown.enter.prevent="saveLocalFile"
          @keydown.space.prevent="saveLocalFile"
          v-if="!isMobile"
        >
          <span class="icon iconfont iconlingcunwei"></span>
          <span class="text">{{ $t('toolbar.saveAs') }}</span>
        </div>
        <div
          class="toolbarBtn fileActionBtn"
          role="button"
          tabindex="0"
          :aria-label="$t('toolbar.import')"
          @click="openImportDialog"
          @keydown.enter.prevent="openImportDialog"
          @keydown.space.prevent="openImportDialog"
        >
          <span class="icon iconfont icondaoru"></span>
          <span class="text">{{ $t('toolbar.import') }}</span>
        </div>
        <div
          class="toolbarBtn fileActionBtn"
          role="button"
          tabindex="0"
          :aria-label="$t('toolbar.exportCenter')"
          @click="openExportDialog"
          @keydown.enter.prevent="openExportDialog"
          @keydown.space.prevent="openExportDialog"
        >
          <span class="icon iconfont iconexport"></span>
          <span class="text">{{ $t('toolbar.exportCenter') }}</span>
        </div>
        <div
          class="toolbarBtn fileActionBtn"
          role="button"
          tabindex="0"
          :aria-label="$t('toolbar.convertToFlowchart')"
          @click="convertCurrentToFlowchart"
          @keydown.enter.prevent="convertCurrentToFlowchart"
          @keydown.space.prevent="convertCurrentToFlowchart"
        >
          <span class="icon iconfont icontianjiazijiedian"></span>
          <span class="text">{{ $t('toolbar.convertToFlowchart') }}</span>
        </div>
        <div
          class="toolbarBtn fileActionBtn"
          role="button"
          tabindex="0"
          :aria-label="$t('toolbar.returnHome')"
          @click="goHome"
          @keydown.enter.prevent="goHome"
          @keydown.space.prevent="goHome"
        >
          <span class="icon iconfont iconzhuye"></span>
          <span class="text">{{ $t('toolbar.returnHome') }}</span>
        </div>
        <!-- 本地文件树 -->
        <div
          class="fileTreeBox"
          v-if="fileTreeVisible"
          :class="{ expand: fileTreeExpand }"
        >
          <div class="fileTreeToolbar">
            <div class="fileTreeName">
              {{ rootDirName ? '/' + rootDirName : '' }}
            </div>
            <div class="fileTreeActionList">
              <div
                class="btn"
                :class="{ expanded: fileTreeExpand }"
                role="button"
                tabindex="0"
                :aria-label="
                  fileTreeExpand
                    ? $t('toolbar.collapseDirectory')
                    : $t('toolbar.expandDirectory')
                "
                @click="fileTreeExpand = !fileTreeExpand"
                @keydown.enter.prevent="fileTreeExpand = !fileTreeExpand"
                @keydown.space.prevent="fileTreeExpand = !fileTreeExpand"
              >
                v
              </div>
              <div
                class="btn closeBtn"
                role="button"
                tabindex="0"
                :aria-label="$t('toolbar.closeDirectory')"
                @click="fileTreeVisible = false"
                @keydown.enter.prevent="fileTreeVisible = false"
                @keydown.space.prevent="fileTreeVisible = false"
              >
                x
              </div>
            </div>
          </div>
          <div class="fileTreeWrap">
            <el-tree
              :props="fileTreeProps"
              :load="loadFileTreeNode"
              :expand-on-click-node="false"
              node-key="id"
              lazy
            >
              <template #default="{ node, data }">
                <span class="customTreeNode">
                  <div class="treeNodeInfo">
                    <span
                      class="treeNodeIcon iconfont"
                      :class="[
                        data.type === 'file' ? 'iconwenjian' : 'icondakai'
                      ]"
                    ></span>
                    <span class="treeNodeName">{{ node.label }}</span>
                  </div>
                  <div class="treeNodeBtnList" v-if="data.type === 'file'">
                    <el-button
                      type="text"
                      size="small"
                      v-if="data.enableEdit"
                      @click="editLocalFile(data)"
                      >{{ $t('toolbar.edit') }}</el-button
                    >
                    <el-button
                      type="text"
                      size="small"
                      v-else
                      @click="importLocalFile(data)"
                      >{{ $t('toolbar.importAction') }}</el-button
                    >
                  </div>
                </span>
              </template>
            </el-tree>
          </div>
        </div>
      </div>
      <div class="toolbarBlock toolbarMetaBlock" v-if="!isMobile">
        <div
          class="toolbarSaveStatus"
          :class="`is-${toolbarStatusType}`"
          :title="toolbarStatusTitle"
          role="status"
          :aria-label="toolbarStatusText"
        >
          <span class="toolbarSaveStatusDot" aria-hidden="true"></span>
          <span class="toolbarSaveStatusText">{{ toolbarStatusText }}</span>
        </div>
        <div class="toolbarQuickActions">
          <EditorToolbarAction
            tag="div"
            action-class="toolbarBtn quickActionBtn"
            icon-class="icon iconfont edit-icon-more"
            text-class="text"
            :label="$t('toolbar.commandPaletteAction')"
            @action="openCommandPalette"
          ></EditorToolbarAction>
          <EditorToolbarAction
            tag="div"
            action-class="toolbarBtn quickActionBtn"
            icon-class="icon iconfont iconsousuo"
            text-class="text"
            :label="$t('toolbar.searchAction')"
            @action="showSearch"
          ></EditorToolbarAction>
          <EditorToolbarAction
            tag="div"
            action-class="toolbarBtn quickActionBtn"
            icon-class="icon iconfont iconquanping1"
            text-class="text"
            :label="$t('toolbar.focusModeAction')"
            @action="toggleZenMode"
          ></EditorToolbarAction>
          <EditorToolbarAction
            tag="div"
            action-class="toolbarBtn quickActionBtn"
            icon-class="icon iconfont iconfuhao-dagangshu"
            text-class="text"
            :label="$t('toolbar.outlineAction')"
            @action="openOutlinePanel"
          ></EditorToolbarAction>
          <EditorToolbarAction
            tag="div"
            action-class="toolbarBtn quickActionBtn"
            icon-class="icon iconfont icontianjiazijiedian"
            text-class="text"
            :label="$t('toolbar.pasteOutlineAction')"
            @action="pasteOutlineFromClipboard"
          ></EditorToolbarAction>
        </div>
      </div>
      <div class="toolbarMeasure">
        <div class="toolbarBlock isMeasure" ref="toolbarMeasureBlockRef">
          <div ref="toolbarMeasureListRef">
            <ToolbarNodeBtnList
              :list="btnLit"
              :show-text="showToolbarLabels"
            ></ToolbarNodeBtnList>
          </div>
          <div class="toolbarBtn" ref="toolbarMeasureMoreRef">
            <span class="icon iconfont edit-icon-more"></span>
            <span class="text">{{ $t('toolbar.more') }}</span>
          </div>
        </div>
      </div>
    </div>
    <div
      v-if="commandPaletteVisible"
      class="commandPaletteOverlay"
      @mousedown.self="closeCommandPalette"
    >
      <section
        class="commandPalettePanel"
        role="dialog"
        aria-modal="true"
        :aria-label="$t('toolbar.commandPaletteTitle')"
      >
        <div class="commandPaletteHeader">
          <div class="commandPaletteTitle">
            {{ $t('toolbar.commandPaletteTitle') }}
          </div>
          <button
            type="button"
            class="commandPaletteClose"
            :aria-label="$t('dialog.close')"
            @click="closeCommandPalette"
          >
            x
          </button>
        </div>
        <input
          ref="commandPaletteInputRef"
          v-model.trim="commandPaletteKeyword"
          class="commandPaletteInput"
          type="search"
          :placeholder="$t('toolbar.commandPalettePlaceholder')"
          @keydown="onCommandPaletteInputKeydown"
        />
        <div class="commandPaletteList" role="listbox">
          <button
            v-for="(item, index) in filteredCommandPaletteItems"
            :key="item.key"
            type="button"
            class="commandPaletteItem"
            :class="{
              isDisabled: item.disabled,
              isActive: index === commandPaletteActiveIndex
            }"
            :disabled="item.disabled"
            :aria-disabled="item.disabled ? 'true' : 'false'"
            :aria-selected="index === commandPaletteActiveIndex ? 'true' : 'false'"
            role="option"
            @mouseenter="commandPaletteActiveIndex = index"
            @click="executeCommandPaletteItem(item)"
          >
            <span class="commandPaletteItemLabel">{{ item.label }}</span>
            <span v-if="item.shortcut" class="commandPaletteItemShortcut">
              {{ item.shortcut }}
            </span>
          </button>
          <div
            v-if="filteredCommandPaletteItems.length <= 0"
            class="commandPaletteEmpty"
          >
            {{ $t('toolbar.commandPaletteEmpty') }}
          </div>
        </div>
      </section>
    </div>
    <NodeImage v-if="mountedPanels.nodeImage" ref="NodeImageRef"></NodeImage>
    <NodeHyperlink
      v-if="mountedPanels.nodeHyperlink"
      ref="NodeHyperlinkRef"
    ></NodeHyperlink>
    <NodeNote v-if="mountedPanels.nodeNote" ref="NodeNoteRef"></NodeNote>
    <NodeTag v-if="mountedPanels.nodeTag" ref="NodeTagRef"></NodeTag>
    <NodeCommentsDialog />
    <DocumentConvertPreviewDialog />
    <Import v-if="mountedPanels.import" ref="ImportRef"></Import>
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue'
import { mapState } from 'pinia'
import { getConfig, getData } from '@/api'
import EditorToolbarAction from './EditorToolbarAction.vue'
import {
  filterCommandPaletteItems,
  resolveActiveCommandPaletteItem,
  moveCommandPaletteIndex,
  isCommandPaletteTypingTarget
} from './editorCommandPalette'
import {
  LOCAL_FILE_WRITE_DEBOUNCE_MS,
  RECOVERY_WRITE_DEBOUNCE_MS,
  snapshotLocalFileRef,
  isSameLocalFileRef,
  formatTimeLabel,
  parseToolbarLocalFileContent,
  createLocalWriteTaskData,
  hasPendingLocalWriteState,
  serializeMindMapWriteContent
} from './editorLocalFileSession'
import ToolbarNodeBtnList from './ToolbarNodeBtnList.vue'
import { throttle, isMobile } from 'simple-mind-map/src/utils/index'
import platform, {
  getRecentFiles,
  isDesktopApp,
  recordRecentFile,
  saveBootstrapStatePatch
} from '@/platform'
import { createDefaultMindMapData } from '@/platform/shared/configSchema'
import { convertMindMapToFlowchart } from '@/services/flowchartDocument'
import { convertMindmapWorkbookToFlowchartWorkbook } from '@/services/documentConvert'
import { transformToMarkdown } from 'simple-mind-map/src/parse/toMarkdown'
import { transformToTxt } from 'simple-mind-map/src/parse/toTxt'
import {
  createDesktopFsError,
  getCurrentFileRef,
  getLastDirectory,
  markDocumentDirty,
  setCurrentFileRef,
  setLastDirectory
} from '@/services/documentSession'
import {
  onBootstrapStateReady,
  emitShowSearch,
  emitShowImport,
  emitShowNodeImage,
  emitShowNodeLink,
  emitShowNodeNote,
  emitShowNodeTag,
  onWriteLocalFile
} from '@/services/appEvents'
import {
  applyLocalConfigPatch,
  setActiveSidebar,
  setIsHandleLocalFile,
  syncRuntimeFromWorkspaceMeta
} from '@/stores/runtime'
import { getWorkspaceMetaState } from '@/services/workspaceState'
import { useAppStore } from '@/stores/app'
import { useEditorStore } from '@/stores/editor'
import { useSettingsStore } from '@/stores/settings'
import { useThemeStore } from '@/stores/theme'
import {
  clearRecoveryDraftForFile,
  resolveFileContentWithRecovery,
  writeRecoveryDraftForFile
} from '@/services/recoveryStorage'
import {
  applyAttachmentToNodes,
  clearAttachmentFromNodes,
  getAttachmentFromNode
} from '@/services/nodeAttachment'
import {
  isNodeBookmarked,
  toggleNodesBookmark
} from '@/services/nodeBookmarks'

const NodeImage = defineAsyncComponent(() => import('./NodeImage.vue'))
const NodeHyperlink = defineAsyncComponent(() => import('./NodeHyperlink.vue'))
const NodeNote = defineAsyncComponent(() => import('./NodeNote.vue'))
const NodeTag = defineAsyncComponent(() => import('./NodeTag.vue'))
const NodeCommentsDialog = defineAsyncComponent(() =>
  import('./NodeCommentsDialog.vue')
)
const DocumentConvertPreviewDialog = defineAsyncComponent(() =>
  import('./DocumentConvertPreviewDialog.vue')
)
const Import = defineAsyncComponent(() => import('./Import.vue'))
// 工具栏
const defaultBtnList = [
  'back',
  'forward',
  'painter',
  'siblingNode',
  'childNode',
  'deleteNode',
  'image',
  'icon',
  'link',
  'note',
  'attachment',
  'tag',
  'summary',
  'associativeLine',
  'formula',
  'outerFrame',
  'annotation',
  'ai'
]

export default {
  components: {
    NodeImage,
    NodeHyperlink,
    NodeNote,
    NodeTag,
    NodeCommentsDialog,
    DocumentConvertPreviewDialog,
    Import,
    EditorToolbarAction,
    ToolbarNodeBtnList
  },
  data() {
    return {
      isMobile: isMobile(),
      horizontalList: [],
      verticalList: [],
      showMoreBtn: true,
      popoverShow: false,
      fileTreeProps: {
        label: 'name',
        children: 'children',
        isLeaf: 'leaf'
      },
      recentFiles: [],
      fileTreeVisible: false,
      rootDirName: '',
      fileTreeExpand: true,
      isFullDataFile: true,
      waitingWriteToLocalFile: false,
      recoveredDraftLoaded: false,
      commandPaletteVisible: false,
      commandPaletteKeyword: '',
      commandPaletteActiveIndex: 0,
      activeNodes: [],
      markerFilterValue: '',
      lastSuccessfulSaveAt: 0,
      lastLocalSaveErrorMessage: '',
      pendingLocalFileRef: null,
      localFileReadRequestId: 0,
      localFileWriteRequestId: 0,
      completedLocalFileWriteRequestId: 0,
      currentLocalFileWriteRequestId: 0,
      layoutMeasureToken: 0,
      mountedPanels: {
        nodeImage: false,
        nodeHyperlink: false,
        nodeNote: false,
        nodeTag: false,
        import: false
      }
    }
  },
  computed: {
    ...mapState(useThemeStore, {
      isDark: 'isDark'
    }),
    ...mapState(useAppStore, {
      isHandleLocalFile: 'isHandleLocalFile'
    }),
    ...mapState(useEditorStore, {
      currentDocument: 'currentDocument',
      currentFileName: 'currentFileName'
    }),
    ...mapState(useSettingsStore, {
      localConfig: 'localConfig'
    }),

    isDesktopRuntime() {
      return isDesktopApp()
    },

    openNodeRichText() {
      return this.localConfig.openNodeRichText
    },

    enableAi() {
      return this.localConfig.enableAi
    },

    showToolbarLabels() {
      return this.localConfig.showToolbarLabels !== false
    },

    canDirectSave() {
      return this.isHandleLocalFile && !!this.currentDocument?.path
    },

    hasPotentialDataLoss() {
      return !!this.currentDocument?.dirty || this.waitingWriteToLocalFile
    },

    toolbarDocumentLabel() {
      return (
        this.currentFileName ||
        this.currentDocument?.name ||
        this.$t('toolbar.statusNoFile')
      )
    },

    toolbarStatusText() {
      if (this.lastLocalSaveErrorMessage) {
        return this.$t('toolbar.statusSaveFailed')
      }
      if (this.waitingWriteToLocalFile) {
        return this.$t('toolbar.statusAutosaving')
      }
      if (this.recoveredDraftLoaded) {
        return this.$t('toolbar.statusRecovered')
      }
      if (this.currentDocument?.dirty) {
        return this.$t('toolbar.statusUnsynced')
      }
      if (this.currentDocument?.path || this.currentFileName) {
        return this.$t('toolbar.statusSaved')
      }
      return this.$t('toolbar.statusNoFile')
    },

    toolbarStatusDetail() {
      const time = formatTimeLabel(this.lastSuccessfulSaveAt)
      if (this.lastLocalSaveErrorMessage) {
        return this.$t('toolbar.statusSaveFailedDetail', {
          message: this.lastLocalSaveErrorMessage
        })
      }
      if (this.waitingWriteToLocalFile) {
        return this.$t('toolbar.statusAutosavingDetail', {
          target: this.toolbarDocumentLabel
        })
      }
      if (this.recoveredDraftLoaded) {
        return this.$t('toolbar.statusRecoveredDetail', {
          target: this.toolbarDocumentLabel
        })
      }
      if (this.currentDocument?.dirty) {
        if (time) {
          return this.$t('toolbar.statusUnsyncedDetailWithTime', {
            time
          })
        }
        if (this.currentDocument?.path) {
          return this.$t('toolbar.statusUnsyncedDetail')
        }
        return this.$t('toolbar.statusNoFileDetail')
      }
      if (this.currentDocument?.path || this.currentFileName) {
        if (time) {
          return this.$t('toolbar.statusSavedDetailWithTime', {
            time
          })
        }
        return this.$t('toolbar.statusSavedDetail')
      }
      return this.$t('toolbar.statusNoFileDetail')
    },

    toolbarStatusTitle() {
      const path = String(this.currentDocument?.path || '').trim()
      if (this.lastLocalSaveErrorMessage) {
        return this.lastLocalSaveErrorMessage
      }
      return path || this.toolbarStatusDetail
    },

    toolbarStatusType() {
      if (this.lastLocalSaveErrorMessage) return 'failed'
      if (this.waitingWriteToLocalFile) return 'autosaving'
      if (this.recoveredDraftLoaded) return 'recovered'
      if (this.currentDocument?.dirty) return 'dirty'
      return 'saved'
    },

    commandPaletteItems() {
      return [
        {
          key: 'search',
          label: this.$t('toolbar.searchAction'),
          shortcut: 'Ctrl F',
          action: this.showSearch
        },
        {
          key: 'pasteOutline',
          label: this.$t('toolbar.pasteOutlineAction'),
          action: this.pasteOutlineFromClipboard
        },
        {
          key: 'import',
          label: this.$t('toolbar.import'),
          action: this.openImportDialog
        },
        {
          key: 'export',
          label: this.$t('toolbar.exportCenter'),
          action: this.openExportDialog
        },
        {
          key: 'convertToFlowchart',
          label: this.$t('toolbar.convertToFlowchart'),
          action: this.convertCurrentToFlowchart
        },
        {
          key: 'focus',
          label: this.$t('toolbar.focusModeAction'),
          action: this.toggleZenMode
        },
        {
          key: 'outline',
          label: this.$t('toolbar.outlineAction'),
          action: this.openOutlinePanel
        },
        {
          key: 'addSheet',
          label: this.$t('edit.addSheet') || '新建画布',
          action: () => this.$bus.$emit('mindmapAddSheet')
        },
        {
          key: 'duplicateSheet',
          label: this.$t('edit.sheetDuplicate') || '复制当前画布',
          action: () => this.$bus.$emit('mindmapDuplicateSheet')
        },
        {
          key: 'insertSiblingNode',
          label: this.$t('toolbar.insertSiblingNode'),
          shortcut: 'Enter',
          disabled: this.activeNodes.length <= 0,
          action: () => this.emitEditorCommand('INSERT_NODE')
        },
        {
          key: 'insertChildNode',
          label: this.$t('toolbar.insertChildNode'),
          shortcut: 'Tab',
          disabled: this.activeNodes.length <= 0,
          action: () => this.emitEditorCommand('INSERT_CHILD_NODE')
        },
        {
          key: 'deleteNode',
          label: this.$t('toolbar.deleteNode'),
          shortcut: 'Delete',
          disabled: this.activeNodes.length <= 0,
          action: () => this.emitEditorCommand('REMOVE_NODE')
        },
        {
          key: 'undo',
          label: this.$t('toolbar.undo'),
          shortcut: 'Ctrl Z',
          action: () => this.emitEditorCommand('BACK')
        },
        {
          key: 'redo',
          label: this.$t('toolbar.redo'),
          shortcut: 'Ctrl Y',
          action: () => this.emitEditorCommand('FORWARD')
        },
        {
          key: 'nodeImage',
          label: this.$t('toolbar.image'),
          disabled: this.activeNodes.length <= 0,
          action: () => this.openNodeImageDialog(this.getActiveNodesSnapshot())
        },
        {
          key: 'nodeLink',
          label: this.$t('toolbar.link'),
          disabled: this.activeNodes.length <= 0,
          action: () => this.openNodeLinkDialog(this.getActiveNodesSnapshot())
        },
        {
          key: 'nodeNote',
          label: this.$t('toolbar.note'),
          disabled: this.activeNodes.length <= 0,
          action: () => this.openNodeNoteDialog(this.getActiveNodesSnapshot())
        },
        {
          key: 'nodeAttachment',
          label: this.$t('toolbar.attachment'),
          shortcut: 'Ctrl+Shift+U',
          disabled: this.activeNodes.length <= 0,
          action: () => this.onSelectAttachment(this.getActiveNodesSnapshot())
        },
        {
          key: 'nodeTag',
          label: this.$t('toolbar.tag'),
          disabled: this.activeNodes.length <= 0,
          action: () => this.openNodeTagDialog(this.getActiveNodesSnapshot())
        },
        {
          key: 'nodeComments',
          label: this.$t('toolbar.nodeComments') || '主题批注',
          disabled: this.activeNodes.length <= 0,
          action: () => this.openNodeComments(this.getActiveNodesSnapshot())
        },
        {
          key: 'markerLegend',
          label: this.$t('markerLegend.title') || '标记图例',
          action: () => setActiveSidebar('markerLegend')
        },
        {
          key: 'bookmarkPanel',
          label: this.$t('bookmark.openPanel') || '打开书签',
          action: () => setActiveSidebar('bookmark')
        },
        {
          key: 'toggleBookmark',
          label: this.$t('bookmark.toggle') || '切换收藏',
          shortcut: 'Alt+Shift+B',
          disabled: this.activeNodes.length <= 0,
          action: () => this.toggleSelectedBookmark()
        },
        {
          key: 'fitCanvas',
          label: this.$t('toolbar.fitCanvasAction'),
          action: () => this.emitEditorCommand('FIT_CANVAS')
        },
        {
          key: 'returnCenter',
          label: this.$t('contextmenu.backToRoot'),
          action: () => this.emitEditorCommand('RETURN_CENTER')
        },
        {
          key: 'expandAll',
          label: this.$t('toolbar.expandAllAction'),
          action: () => this.emitEditorCommand('EXPAND_ALL')
        },
        {
          key: 'collapseAll',
          label: this.$t('toolbar.collapseAllAction'),
          action: () => this.emitEditorCommand('UNEXPAND_ALL', true, '')
        },
        {
          key: 'theme',
          label: this.$t('theme.title'),
          action: () => setActiveSidebar('theme')
        },
        {
          key: 'structure',
          label: this.$t('structure.title'),
          action: () => setActiveSidebar('structure')
        },
        {
          key: 'baseStyle',
          label: this.$t('baseStyle.title'),
          action: () => setActiveSidebar('baseStyle')
        },
        {
          key: 'shortcut',
          label: this.$t('toolbar.shortcutAction'),
          action: () => setActiveSidebar('shortcutKey')
        },
        {
          key: 'scrollbar',
          label: this.$t('setting.isShowScrollbar'),
          action: () => this.toggleScrollbar()
        },
        {
          key: 'save',
          label: this.$t('toolbar.save'),
          shortcut: 'Ctrl S',
          action: this.saveCurrentLocalFile
        },
        {
          key: 'saveAs',
          label: this.$t('toolbar.saveAs'),
          action: this.saveLocalFile
        },
        {
          key: 'returnHome',
          label: this.$t('toolbar.returnHome'),
          action: this.goHome
        }
      ]
    },

    filteredCommandPaletteItems() {
      return filterCommandPaletteItems(
        this.commandPaletteItems,
        this.commandPaletteKeyword
      )
    },

    activeCommandPaletteItem() {
      return resolveActiveCommandPaletteItem(
        this.filteredCommandPaletteItems,
        this.commandPaletteActiveIndex
      )
    },

    btnLit() {
      let res = [...defaultBtnList]
      if (!this.openNodeRichText) {
        res = res.filter(item => {
          return item !== 'formula'
        })
      }
      if (!this.enableAi) {
        res = res.filter(item => {
          return item !== 'ai'
        })
      }
      return res
    }
  },
  watch: {
    isHandleLocalFile(val) {
      if (!val) {
        this.lastSuccessfulSaveAt = 0
        this.lastLocalSaveErrorMessage = ''
      }
    },
    btnLit: {
      handler() {
        this.computeToolbarShow()
      }
    },
    showToolbarLabels() {
      this.computeToolbarShow()
    },
    commandPaletteKeyword() {
      this.commandPaletteActiveIndex = 0
    },
    filteredCommandPaletteItems(items) {
      if (!Array.isArray(items) || items.length <= 0) {
        this.commandPaletteActiveIndex = 0
        return
      }
      if (this.commandPaletteActiveIndex >= items.length) {
        this.commandPaletteActiveIndex = items.length - 1
      }
    }
  },
  created() {
    this.removeWriteLocalFileListener = onWriteLocalFile(this.onWriteLocalFile)
  },
  mounted() {
    this.refreshRecentFiles()
    this.computeToolbarShow()
    this.computeToolbarShowThrottle = throttle(this.computeToolbarShow, 300)
    window.addEventListener('resize', this.computeToolbarShowThrottle)
    window.addEventListener('beforeunload', this.onUnload)
    window.addEventListener('keydown', this.onCommandPaletteKeydown)
    this.$bus.$on('node_active', this.onNodeActive)
    this.$bus.$on('node_note_dblclick', this.onNodeNoteDblclick)
    this.$bus.$on('selectAttachment', this.onSelectAttachment)
    this.$bus.$on('node_attachmentClick', this.onAttachmentClick)
    this.$bus.$on('node_attachmentContextmenu', this.onAttachmentContextmenu)
    this.removeBootstrapStateReadyListener = onBootstrapStateReady(
      this.handleBootstrapStateReady
    )
  },
  beforeUnmount() {
    this.removeWriteLocalFileListener && this.removeWriteLocalFileListener()
    this.removeBootstrapStateReadyListener &&
      this.removeBootstrapStateReadyListener()
    window.removeEventListener('resize', this.computeToolbarShowThrottle)
    window.removeEventListener('beforeunload', this.onUnload)
    window.removeEventListener('keydown', this.onCommandPaletteKeydown)
    this.$bus.$off('node_active', this.onNodeActive)
    this.$bus.$off('node_note_dblclick', this.onNodeNoteDblclick)
    this.$bus.$off('selectAttachment', this.onSelectAttachment)
    this.$bus.$off('node_attachmentClick', this.onAttachmentClick)
    this.$bus.$off('node_attachmentContextmenu', this.onAttachmentContextmenu)
    clearTimeout(this.timer)
    clearTimeout(this.recoveryTimer)
  },
  methods: {
    handleBootstrapStateReady() {
      this.refreshRecentFiles()
    },

    async waitForRef(refName, { maxWaitMs = 800, intervalMs = 16 } = {}) {
      const startedAt = Date.now()
      while (Date.now() - startedAt <= maxWaitMs) {
        if (this.$refs[refName]) {
          return this.$refs[refName]
        }
        await new Promise(resolve => {
          setTimeout(resolve, intervalMs)
        })
      }
      return this.$refs[refName] || null
    },

    async ensurePanelMounted(panelKey, refName = '') {
      if (!this.mountedPanels[panelKey]) {
        this.mountedPanels[panelKey] = true
        await this.$nextTick()
      }
      if (!refName) {
        return null
      }
      return this.waitForRef(refName)
    },

    async openImportDialog() {
      const importRef = await this.ensurePanelMounted('import', 'ImportRef')
      if (importRef && typeof importRef.openDialog === 'function') {
        importRef.openDialog()
        return
      }
      emitShowImport()
    },

    openDocumentConvertPreview(payload = {}) {
      return new Promise((resolve, reject) => {
        this.$bus.$emit('openDocumentConvertPreview', {
          ...payload,
          resolve,
          reject
        })
      })
    },
    async convertCurrentToFlowchart() {
      try {
        const mindMapData = getData()
        if (!mindMapData?.root) {
          this.$message.warning(this.$t('toolbar.noMindMapToConvert'))
          return
        }
        let selectedSheetIds = null
        const sheets = Array.isArray(mindMapData.sheets) ? mindMapData.sheets : []
        // convert multi preview
        if (sheets.length > 1) {
          try {
            const result = await this.openDocumentConvertPreview({
              mode: 'mindmap-to-flowchart',
              items: sheets.map((sheet, index) => {
                const root = sheet.root || {}
                const childCount = Array.isArray(root.children)
                  ? root.children.length
                  : 0
                const previewLines = []
                const pushLine = (node, level = 0) => {
                  if (!node || previewLines.length >= 5) return
                  const text = String(node?.data?.text || '')
                    .replace(/<[^>]*>/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim()
                  if (text) previewLines.push({ text, level })
                  ;(Array.isArray(node.children) ? node.children : []).forEach(
                    child => pushLine(child, level + 1)
                  )
                }
                pushLine(root, 0)
                return {
                  id: sheet.id || 'sheet_' + (index + 1),
                  name: sheet.name || root?.data?.text || '画布 ' + (index + 1),
                  meta: childCount + ' 个子主题',
                  stats: [
                    '深度 ' + Math.max(...previewLines.map(line => (line.level || 0) + 1), 1),
                    '预览 ' + previewLines.length + ' 行'
                  ],
                  previewLines
                }
              })
            })
            selectedSheetIds = (result.selected || []).map(item => item.id)
            if (!selectedSheetIds.length) return
          } catch (_error) {
            return
          }
        }
        const flowWorkbook = convertMindmapWorkbookToFlowchartWorkbook(mindMapData, {
          title: String(mindMapData.root?.data?.text || '流程图'),
          selectedSheetIds
        })
        const nextDocument = {
          documentMode: 'flowchart',
          flowchartData: flowWorkbook,
          flowchartConfig: null
        }
        await saveBootstrapStatePatch({
          mindMapData: null,
          mindMapConfig: null,
          flowchartData: nextDocument.flowchartData,
          flowchartConfig: nextDocument.flowchartConfig || null
        })
        const current = getCurrentFileRef()
        setCurrentFileRef(
          {
            ...(current || {}),
            path: current?.path || '',
            name:
              current?.name ||
              String(mindMapData.root?.data?.text || '流程图') + '.smm',
            documentMode: 'flowchart',
            isFullDataFile: true
          },
          current?.mode || current?.source || 'desktop'
        )
        markDocumentDirty(true)
        // force mode switch immediately for in-page editor remount
        try {
          const { useEditorStore } = await import('@/stores/editor')
          const editorStore = useEditorStore()
          editorStore.syncWorkspaceSession({
            ...getWorkspaceMetaState(),
            currentDocument: {
              path: current?.path || '',
              name:
                current?.name ||
                String(mindMapData.root?.data?.text || '流程图') + '.smm',
              source: current?.mode || current?.source || 'desktop',
              dirty: true,
              isFullDataFile: true,
              documentMode: 'flowchart'
            }
          })
        } catch (_error) {}
        this.$message.success(
          this.$t('toolbar.convertToFlowchartDoneMulti', {
            count: flowWorkbook.sheets?.length || 1
          }) || this.$t('toolbar.convertToFlowchartDone')
        )
        if (this.$route.path !== '/edit') {
          await this.$router.push('/edit')
        }
      } catch (error) {
        console.error('convertCurrentToFlowchart failed', error)
        this.$message.error(error?.message || this.$t('home.actionFailed'))
      }
    },

    async openExportDialog() {
      if (this.$route.path === '/export') {
        return
      }
      await this.$router.push('/export')
    },

    emitEditorCommand(...args) {
      this.$bus.$emit('execCommand', ...args)
    },

    onNodeActive(...args) {
      this.activeNodes = [...(args[1] || [])]
    },

    getActiveNodesSnapshot() {
      return [...this.activeNodes]
    },

    openCommandPalette() {
      this.commandPaletteVisible = true
      this.commandPaletteKeyword = ''
      this.commandPaletteActiveIndex = 0
      this.$nextTick(() => {
        this.$refs.commandPaletteInputRef?.focus?.()
      })
    },

    closeCommandPalette() {
      this.commandPaletteVisible = false
      this.commandPaletteKeyword = ''
      this.commandPaletteActiveIndex = 0
    },

    executeCommandPaletteItem(item = this.activeCommandPaletteItem) {
      if (!item || item.disabled || typeof item.action !== 'function') {
        return
      }
      this.closeCommandPalette()
      item.action.call(this)
    },

    moveCommandPaletteSelection(step = 1) {
      this.commandPaletteActiveIndex = moveCommandPaletteIndex(
        this.filteredCommandPaletteItems,
        this.commandPaletteActiveIndex,
        step
      )
    },

    onCommandPaletteInputKeydown(event) {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        this.moveCommandPaletteSelection(1)
        return
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        this.moveCommandPaletteSelection(-1)
        return
      }
      if (event.key === 'Enter') {
        event.preventDefault()
        this.executeCommandPaletteItem(this.activeCommandPaletteItem)
        return
      }
      if (event.key === 'Escape') {
        event.preventDefault()
        this.closeCommandPalette()
      }
    },

    onCommandPaletteKeydown(event) {
      const isTypingTarget = isCommandPaletteTypingTarget(event.target)
      if (
        (event.ctrlKey || event.metaKey) &&
        !event.shiftKey &&
        event.key?.toLowerCase() === 'k'
      ) {
        if (isTypingTarget && !this.commandPaletteVisible) {
          return
        }
        event.preventDefault()
        if (this.commandPaletteVisible) {
          this.closeCommandPalette()
        } else {
          this.openCommandPalette()
        }
        return
      }
      if (
        (event.ctrlKey || event.metaKey) &&
        !event.shiftKey &&
        event.key?.toLowerCase() === 's'
      ) {
        if (isTypingTarget) {
          return
        }
        event.preventDefault()
        void this.saveCurrentLocalFile()
        return
      }
      if (event.key === 'Escape' && this.commandPaletteVisible) {
        event.preventDefault()
        this.closeCommandPalette()
        return
      }
      // Shift+F2 renames active workbook sheet
      if (
        event.key === 'F2' &&
        event.shiftKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        !isTypingTarget &&
        !this.commandPaletteVisible
      ) {
        event.preventDefault()
        this.$bus.$emit('mindmapRenameActiveSheet')
        return
      }
      // toggle rainbow lines Alt+R
      if (
        !isTypingTarget &&
        !this.commandPaletteVisible &&
        event.altKey &&
        !event.metaKey &&
        !event.ctrlKey &&
        event.key.toLowerCase() === 'r'
      ) {
        event.preventDefault()
        this.$bus.$emit('toggleRainbowLines')
        return
      }
      // toggle watermark Alt+W
      if (
        !isTypingTarget &&
        !this.commandPaletteVisible &&
        event.altKey &&
        !event.metaKey &&
        !event.ctrlKey &&
        event.key.toLowerCase() === 'w'
      ) {
        event.preventDefault()
        this.$bus.$emit('toggleWatermark')
        return
      }
      // toggle free drag Alt+D
      if (
        !isTypingTarget &&
        !this.commandPaletteVisible &&
        event.altKey &&
        !event.metaKey &&
        !event.ctrlKey &&
        event.key.toLowerCase() === 'd'
      ) {
        event.preventDefault()
        this.$bus.$emit('toggleFreeDrag')
        return
      }
      // toggle hand-drawn Alt+H
      if (
        !isTypingTarget &&
        !this.commandPaletteVisible &&
        event.altKey &&
        !event.metaKey &&
        !event.ctrlKey &&
        event.key.toLowerCase() === 'h'
      ) {
        event.preventDefault()
        this.$bus.$emit('toggleHandDrawn')
        return
      }
      // toggle bookmark Alt+Shift+B
      if (
        !isTypingTarget &&
        !this.commandPaletteVisible &&
        event.altKey &&
        event.shiftKey &&
        !event.metaKey &&
        !event.ctrlKey &&
        event.key.toLowerCase() === 'b'
      ) {
        event.preventDefault()
        this.toggleSelectedBookmark()
        return
      }
      // toggle blank mode Alt+B
      if (
        !isTypingTarget &&
        !this.commandPaletteVisible &&
        event.altKey &&
        !event.shiftKey &&
        !event.metaKey &&
        !event.ctrlKey &&
        event.key.toLowerCase() === 'b'
      ) {
        event.preventDefault()
        this.$bus.$emit('toggleBlankMode')
        return
      }
      // toggle focus mode Alt+F
      if (
        !isTypingTarget &&
        !this.commandPaletteVisible &&
        event.altKey &&
        !event.metaKey &&
        !event.ctrlKey &&
        event.key.toLowerCase() === 'f'
      ) {
        event.preventDefault()
        this.$bus.$emit('toggleFocusMode')
        return
      }
      // toggle always show expand Alt+E
      if (
        !isTypingTarget &&
        !this.commandPaletteVisible &&
        event.altKey &&
        !event.metaKey &&
        !event.ctrlKey &&
        event.key.toLowerCase() === 'e'
      ) {
        event.preventDefault()
        this.$bus.$emit('toggleAlwaysShowExpandBtn')
        return
      }
      // toggle child numbering Ctrl+Alt+N
      if (
        !isTypingTarget &&
        !this.commandPaletteVisible &&
        event.altKey &&
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === 'n'
      ) {
        const activeNodes = this.getActiveNodesSnapshot
          ? this.getActiveNodesSnapshot()
          : this.activeNodes || []
        if (activeNodes.length > 0) {
          event.preventDefault()
          this.toggleChildNumbering(activeNodes)
          return
        }
      }
      // copy selection as markdown Ctrl+Shift+C
      if (
        !isTypingTarget &&
        !this.commandPaletteVisible &&
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key.toLowerCase() === 'c'
      ) {
        event.preventDefault()
        void this.copyActiveAs('markdown')
        return
      }
      // copy selection as txt Ctrl+Shift+X (cut remains ctrl+x)
      if (
        !isTypingTarget &&
        !this.commandPaletteVisible &&
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key.toLowerCase() === 'x'
      ) {
        event.preventDefault()
        void this.copyActiveAs('txt')
        return
      }
      // Ctrl+Alt+P print outline
      if (
        !isTypingTarget &&
        !this.commandPaletteVisible &&
        event.altKey &&
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === 'p'
      ) {
        event.preventDefault()
        setActiveSidebar('outline')
        this.$nextTick(() => this.$bus.$emit('printOutline'))
        return
      }
      // Ctrl+Alt+T open theme panel
      if (
        !isTypingTarget &&
        !this.commandPaletteVisible &&
        event.altKey &&
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === 't'
      ) {
        event.preventDefault()
        setActiveSidebar('theme')
        return
      }
      // Ctrl+Alt+S open structure panel
      if (
        !isTypingTarget &&
        !this.commandPaletteVisible &&
        event.altKey &&
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === 's'
      ) {
        event.preventDefault()
        setActiveSidebar('structure')
        return
      }
      // Ctrl+Alt+M node comments
      if (
        !isTypingTarget &&
        !this.commandPaletteVisible &&
        event.altKey &&
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === 'm'
      ) {
        const activeNodes = this.getActiveNodesSnapshot
          ? this.getActiveNodesSnapshot()
          : this.activeNodes || []
        if (activeNodes.length > 0) {
          event.preventDefault()
          this.openNodeComments(activeNodes)
          return
        }
      }
      // Ctrl+Alt+I open marker legend
      if (
        !isTypingTarget &&
        !this.commandPaletteVisible &&
        event.altKey &&
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === 'i'
      ) {
        event.preventDefault()
        setActiveSidebar('markerLegend')
        return
      }
      // Ctrl+Alt+F filter markers
      if (
        !isTypingTarget &&
        !this.commandPaletteVisible &&
        event.altKey &&
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === 'f'
      ) {
        event.preventDefault()
        void this.promptMarkerFilter()
        return
      }
      // Ctrl+Alt+0 clear filter
      if (
        !isTypingTarget &&
        !this.commandPaletteVisible &&
        event.altKey &&
        (event.ctrlKey || event.metaKey) &&
        event.key === '0'
      ) {
        event.preventDefault()
        this.clearMarkerFilter()
        return
      }
      // Ctrl+Alt+F filter by priority marker
      if (
        !isTypingTarget &&
        !this.commandPaletteVisible &&
        event.altKey &&
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === 'f'
      ) {
        event.preventDefault()
        void this.promptMarkerFilter()
        return
      }
      // Ctrl+Alt+0 clear marker filter
      if (
        !isTypingTarget &&
        !this.commandPaletteVisible &&
        event.altKey &&
        (event.ctrlKey || event.metaKey) &&
        event.key === '0'
      ) {
        event.preventDefault()
        this.clearMarkerFilter()
        return
      }
      // Ctrl+L reset layout
      if (
        !isTypingTarget &&
        !this.commandPaletteVisible &&
        (event.ctrlKey || event.metaKey) &&
        !event.shiftKey &&
        !event.altKey &&
        event.key.toLowerCase() === 'l'
      ) {
        event.preventDefault()
        this.emitEditorCommand('RESET_LAYOUT')
        return
      }
      // Ctrl+Alt+C open source code edit
      if (
        !isTypingTarget &&
        !this.commandPaletteVisible &&
        event.altKey &&
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === 'c'
      ) {
        event.preventDefault()
        this.$bus.$emit('openSourceCodeEdit')
        return
      }
      // priority/progress markers
      if (
        !isTypingTarget &&
        !this.commandPaletteVisible &&
        event.altKey &&
        !event.metaKey &&
        !event.ctrlKey &&
        /^[0-9]$/.test(event.key)
      ) {
        const activeNodes = this.getActiveNodesSnapshot
          ? this.getActiveNodesSnapshot()
          : this.activeNodes || []
        if (activeNodes.length > 0) {
          event.preventDefault()
          const level = event.key === '0' ? '' : event.key
          this.applyMarkerIcon(activeNodes, 'priority', level)
          return
        }
      }
      if (
        !isTypingTarget &&
        !this.commandPaletteVisible &&
        event.altKey &&
        (event.ctrlKey || event.metaKey) &&
        /^[1-8]$/.test(event.key)
      ) {
        const activeNodes = this.getActiveNodesSnapshot
          ? this.getActiveNodesSnapshot()
          : this.activeNodes || []
        if (activeNodes.length > 0) {
          event.preventDefault()
          this.applyMarkerIcon(activeNodes, 'progress', event.key)
          return
        }
      }
      // Space opens note for active mindmap node (core annotation loop).
      if (
        event.key === ' ' &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        !isTypingTarget &&
        !this.commandPaletteVisible
      ) {
        const activeNodes = this.getActiveNodesSnapshot
          ? this.getActiveNodesSnapshot()
          : this.activeNodes || []
        if (activeNodes.length > 0) {
          event.preventDefault()
          void this.openNodeNoteDialog(activeNodes)
        }
        return
      }
      // Ctrl+Shift+K opens hyperlink dialog for active node.
      if (
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key?.toLowerCase() === 'k' &&
        !isTypingTarget
      ) {
        const activeNodes = this.getActiveNodesSnapshot
          ? this.getActiveNodesSnapshot()
          : this.activeNodes || []
        if (activeNodes.length > 0) {
          event.preventDefault()
          void this.openNodeLinkDialog(activeNodes)
        }
        return
      }
      // Ctrl+Shift+T opens tag dialog for active node.
      if (
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key?.toLowerCase() === 't' &&
        !isTypingTarget
      ) {
        const activeNodes = this.getActiveNodesSnapshot
          ? this.getActiveNodesSnapshot()
          : this.activeNodes || []
        if (activeNodes.length > 0) {
          event.preventDefault()
          void this.openNodeTagDialog(activeNodes)
        }
        return
      }
      // Ctrl+Shift+I opens image dialog for active node.
      if (
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key?.toLowerCase() === 'i' &&
        !isTypingTarget
      ) {
        const activeNodes = this.getActiveNodesSnapshot
          ? this.getActiveNodesSnapshot()
          : this.activeNodes || []
        if (activeNodes.length > 0) {
          event.preventDefault()
          void this.openNodeImageDialog(activeNodes)
        }
        return
      }
      // Ctrl+Shift+A starts associative line from active node.
      if (
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key?.toLowerCase() === 'a' &&
        !isTypingTarget
      ) {
        const activeNodes = this.getActiveNodesSnapshot
          ? this.getActiveNodesSnapshot()
          : this.activeNodes || []
        if (activeNodes.length > 0) {
          event.preventDefault()
          this.$bus.$emit('createAssociativeLine')
        }
        return
      }
      // Ctrl+Shift+P format painter
      if (
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key?.toLowerCase() === 'p' &&
        !isTypingTarget
      ) {
        const activeNodes = this.getActiveNodesSnapshot
          ? this.getActiveNodesSnapshot()
          : this.activeNodes || []
        if (activeNodes.length > 0) {
          event.preventDefault()
          this.$bus.$emit('startPainter')
        }
        return
      }
      // Ctrl+Shift+G outer frame
      if (
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key?.toLowerCase() === 'g' &&
        !isTypingTarget
      ) {
        const activeNodes = this.getActiveNodesSnapshot
          ? this.getActiveNodesSnapshot()
          : this.activeNodes || []
        if (activeNodes.length > 0) {
          event.preventDefault()
          this.$bus.$emit('execCommand', 'ADD_OUTER_FRAME')
        }
        return
      }
      // Ctrl+G summary/generalization
      if (
        (event.ctrlKey || event.metaKey) &&
        !event.shiftKey &&
        event.key?.toLowerCase() === 'g' &&
        !isTypingTarget
      ) {
        const activeNodes = this.getActiveNodesSnapshot
          ? this.getActiveNodesSnapshot()
          : this.activeNodes || []
        if (activeNodes.length > 0) {
          event.preventDefault()
          this.$bus.$emit('execCommand', 'ADD_GENERALIZATION')
        }
        return
      }
      // Ctrl+E open export center
      if (
        (event.ctrlKey || event.metaKey) &&
        !event.shiftKey &&
        event.key?.toLowerCase() === 'e' &&
        !isTypingTarget
      ) {
        event.preventDefault()
        void this.openExportDialog()
        return
      }
      // Ctrl+O open import
      if (
        (event.ctrlKey || event.metaKey) &&
        !event.shiftKey &&
        event.key?.toLowerCase() === 'o' &&
        !isTypingTarget
      ) {
        event.preventDefault()
        void this.openImportDialog()
        return
      }
      // Ctrl+T new sheet
      if (
        (event.ctrlKey || event.metaKey) &&
        !event.shiftKey &&
        event.key?.toLowerCase() === 't' &&
        !isTypingTarget
      ) {
        event.preventDefault()
        this.$bus.$emit('mindmapAddSheet')
        return
      }
      // Ctrl+Shift+N duplicate sheet
      if (
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key?.toLowerCase() === 'n' &&
        !isTypingTarget
      ) {
        event.preventDefault()
        this.$bus.$emit('mindmapDuplicateSheet')
        return
      }
      // Ctrl+ toggle zen mode
      if (
        (event.ctrlKey || event.metaKey) &&
        !event.shiftKey &&
        (event.key === '\' || event.code === 'Backslash') &&
        !isTypingTarget
      ) {
        event.preventDefault()
        this.toggleZenMode()
        return
      }
      // Ctrl+Shift+O open icons (avoid conflict with outline nowhere on mindmap)
      if (
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key?.toLowerCase() === 'o' &&
        !isTypingTarget
      ) {
        const activeNodes = this.getActiveNodesSnapshot
          ? this.getActiveNodesSnapshot()
          : this.activeNodes || []
        if (activeNodes.length > 0) {
          event.preventDefault()
          this.$bus.$emit('close_node_icon_toolbar')
          setActiveSidebar('nodeIconSidebar')
        }
        return
      }
      // Ctrl+Shift+F formula
      if (
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key?.toLowerCase() === 'f' &&
        !isTypingTarget
      ) {
        const activeNodes = this.getActiveNodesSnapshot
          ? this.getActiveNodesSnapshot()
          : this.activeNodes || []
        if (activeNodes.length > 0) {
          event.preventDefault()
          setActiveSidebar('formulaSidebar')
        }
        return
      }
      // Ctrl+Shift+E expand all
      if (
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key?.toLowerCase() === 'e' &&
        !isTypingTarget
      ) {
        event.preventDefault()
        this.emitEditorCommand('EXPAND_ALL')
        return
      }
      // Ctrl+Shift+W collapse all
      if (
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key?.toLowerCase() === 'w' &&
        !isTypingTarget
      ) {
        event.preventDefault()
        this.emitEditorCommand('UNEXPAND_ALL', true, '')
        return
      }
      // Ctrl+Shift+H fit canvas / return center alternates with Fit then center if needed
      if (
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key?.toLowerCase() === 'h' &&
        !isTypingTarget
      ) {
        event.preventDefault()
        this.emitEditorCommand('FIT_CANVAS')
        return
      }
      // Ctrl+Shift+B back to root center
      if (
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key?.toLowerCase() === 'b' &&
        !isTypingTarget
      ) {
        event.preventDefault()
        this.emitEditorCommand('RETURN_CENTER')
        return
      }
      // Ctrl+Shift+U attachment
      if (
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key?.toLowerCase() === 'u' &&
        !isTypingTarget
      ) {
        const activeNodes = this.getActiveNodesSnapshot
          ? this.getActiveNodesSnapshot()
          : this.activeNodes || []
        if (activeNodes.length > 0) {
          event.preventDefault()
          this.$bus.$emit('selectAttachment', activeNodes)
        }
        return
      }
      // Ctrl+Tab / Ctrl+Shift+Tab switch sheets
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key === 'Tab' &&
        !isTypingTarget
      ) {
        event.preventDefault()
        this.$bus.$emit(event.shiftKey ? 'mindmapPrevSheet' : 'mindmapNextSheet')
        return
      }
      // Alt+Left/Right reorder active sheet
      if (
        event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        (event.key === 'ArrowLeft' || event.key === 'ArrowRight') &&
        !isTypingTarget
      ) {
        event.preventDefault()
        this.$bus.$emit(
          event.key === 'ArrowLeft' ? 'mindmapMoveSheetLeft' : 'mindmapMoveSheetRight'
        )
      }
    },

    showSearch() {
      emitShowSearch()
    },

    toggleZenMode() {
      applyLocalConfigPatch({
        isZenMode: !this.localConfig.isZenMode
      })
    },

    toggleScrollbar() {
      const next = !this.localConfig.isShowScrollbar
      applyLocalConfigPatch({
        isShowScrollbar: next
      })
      this.$message.success(
        next
          ? this.$t("setting.scrollbarEnabled")
          : this.$t("setting.scrollbarDisabled")
      )
    },

    openOutlinePanel() {
      setActiveSidebar('outline')
    },

    pasteOutlineFromClipboard() {
      this.$bus.$emit('pasteOutlineFromClipboard')
    },

    openShortcutKey() {
      setActiveSidebar('shortcutKey')
    },

    getLeaveConfirmOptions(actionKey = '') {
      const normalizedAction = String(actionKey || '').trim()
      const configMap = {
        returnHome: {
          titleKey: 'toolbar.leaveConfirmReturnHomeTitle',
          messageKey: 'toolbar.leaveConfirmReturnHomeMessage'
        },
        openFile: {
          titleKey: 'toolbar.leaveConfirmOpenFileTitle',
          messageKey: 'toolbar.leaveConfirmOpenFileMessage'
        },
        openRecentFile: {
          titleKey: 'toolbar.leaveConfirmOpenRecentFileTitle',
          messageKey: 'toolbar.leaveConfirmOpenRecentFileMessage'
        },
        openDirectory: {
          titleKey: 'toolbar.leaveConfirmOpenDirectoryTitle',
          messageKey: 'toolbar.leaveConfirmOpenDirectoryMessage'
        },
        editLocalFile: {
          titleKey: 'toolbar.leaveConfirmEditLocalFileTitle',
          messageKey: 'toolbar.leaveConfirmEditLocalFileMessage'
        },
        newFile: {
          titleKey: 'toolbar.leaveConfirmNewFileTitle',
          messageKey: 'toolbar.leaveConfirmNewFileMessage'
        }
      }
      const selectedConfig = configMap[normalizedAction] || {}
      return {
        title: this.$t(selectedConfig.titleKey || 'toolbar.leaveConfirmTitle'),
        message: this.$t(
          selectedConfig.messageKey || 'toolbar.leaveConfirmMessage'
        )
      }
    },

    async confirmPotentialDataLoss(actionKey = '') {
      const nextAction = String(actionKey || '').trim()
      if (!this.hasPotentialDataLoss) {
        return true
      }
      const confirmOptions = this.getLeaveConfirmOptions(nextAction)
      try {
        await this.$confirm(
          confirmOptions.message,
          confirmOptions.title,
          {
            type: 'warning'
          }
        )
        if (!nextAction) {
          return true
        }
        return true
      } catch (_error) {
        return false
      }
    },

    async saveCurrentLocalFile() {
      if (!this.canDirectSave) {
        await this.saveLocalFile()
        return
      }
      const writeTask = this.createLocalWriteTask(getData())
      if (!writeTask) {
        return
      }
      if (this.timer) {
        clearTimeout(this.timer)
        this.timer = null
      }
      this.waitingWriteToLocalFile = true
      markDocumentDirty(true)
      try {
        await this.writeRecoveryDraft(writeTask)
        await this.writeLocalFile(writeTask)
      } catch (error) {
        console.error('saveCurrentLocalFile failed', error)
      }
    },

    async goHome() {
      if (this.$route.path === '/home') {
        return
      }
      if (!(await this.confirmPotentialDataLoss('returnHome'))) {
        return
      }
      await this.$router.push('/home')
    },

    async openNodeImageDialog(activeNodes = []) {
      const nodeImageRef = await this.ensurePanelMounted(
        'nodeImage',
        'NodeImageRef'
      )
      if (nodeImageRef && typeof nodeImageRef.openDialog === 'function') {
        nodeImageRef.openDialog({
          activeNodes
        })
        return
      }
      emitShowNodeImage({
        activeNodes
      })
    },

    async openNodeLinkDialog(activeNodes = []) {
      const nodeHyperlinkRef = await this.ensurePanelMounted(
        'nodeHyperlink',
        'NodeHyperlinkRef'
      )
      if (
        nodeHyperlinkRef &&
        typeof nodeHyperlinkRef.openDialog === 'function'
      ) {
        nodeHyperlinkRef.openDialog({
          activeNodes
        })
        return
      }
      emitShowNodeLink({
        activeNodes
      })
    },

    async openNodeNoteDialog(activeNodes = []) {
      const nodeNoteRef = await this.ensurePanelMounted('nodeNote', 'NodeNoteRef')
      if (nodeNoteRef && typeof nodeNoteRef.openDialog === 'function') {
        nodeNoteRef.openDialog({
          activeNodes
        })
        return
      }
      emitShowNodeNote({
        activeNodes
      })
    },

    async openNodeTagDialog(activeNodes = []) {
      const nodeTagRef = await this.ensurePanelMounted('nodeTag', 'NodeTagRef')
      if (nodeTagRef && typeof nodeTagRef.openDialog === 'function') {
        nodeTagRef.openDialog({
          activeNodes
        })
        return
      }
      emitShowNodeTag({
        activeNodes
      })
    },

    refreshRecentFiles() {
      this.recentFiles = this.isDesktopRuntime ? getRecentFiles() : []
      syncRuntimeFromWorkspaceMeta(getWorkspaceMetaState())
    },

    // 计算工具按钮如何显示
    getOuterWidth(el) {
      if (!el || typeof window === 'undefined') return 0
      const rect = el.getBoundingClientRect()
      const style = window.getComputedStyle(el)
      return (
        rect.width +
        parseFloat(style.marginLeft || 0) +
        parseFloat(style.marginRight || 0)
      )
    },

    getFixedToolbarWidth() {
      if (!this.$refs.toolbarRef) return 0
      const blocks = Array.from(this.$refs.toolbarRef.children).filter(item => {
        return (
          item.classList &&
          item.classList.contains('toolbarBlock') &&
          !item.classList.contains('isMeasure')
        )
      })
      return blocks.slice(1).reduce((total, block) => {
        return total + this.getOuterWidth(block)
      }, 0)
    },

    getNodeToolbarMeasure() {
      const measureBlock = this.$refs.toolbarMeasureBlockRef
      const measureList = this.$refs.toolbarMeasureListRef
      const moreBtn = this.$refs.toolbarMeasureMoreRef
      if (!measureBlock || !measureList || !moreBtn) {
        return null
      }
      const buttonWidths = Array.from(
        measureList.querySelectorAll('.toolbarBtn')
      ).map(item => this.getOuterWidth(item))
      const moreButtonWidth = this.getOuterWidth(moreBtn)
      const blockWidth = this.getOuterWidth(measureBlock)
      const blockChromeWidth =
        blockWidth -
        buttonWidths.reduce((total, width) => total + width, 0) -
        moreButtonWidth
      return {
        buttonWidths,
        moreButtonWidth,
        blockChromeWidth: Math.max(blockChromeWidth, 0)
      }
    },

    async computeToolbarShow() {
      const token = ++this.layoutMeasureToken
      await this.$nextTick()
      if (token !== this.layoutMeasureToken) return
      const all = [...this.btnLit]
      const measure = this.getNodeToolbarMeasure()
      if (!measure) return
      const windowWidth = Math.max(window.innerWidth - 40, 0)
      const availableNodeWidth = Math.max(
        windowWidth - this.getFixedToolbarWidth(),
        0
      )
      const { buttonWidths, moreButtonWidth, blockChromeWidth } = measure
      const totalButtonWidth = buttonWidths.reduce((total, width) => {
        return total + width
      }, 0)
      if (blockChromeWidth + totalButtonWidth <= availableNodeWidth) {
        this.horizontalList = all
        this.verticalList = []
        this.showMoreBtn = false
        this.popoverShow = false
        return
      }

      let usedWidth = blockChromeWidth + moreButtonWidth
      let visibleCount = 0
      buttonWidths.some(width => {
        if (usedWidth + width > availableNodeWidth) {
          return true
        }
        usedWidth += width
        visibleCount += 1
        return false
      })
      this.horizontalList = all.slice(0, visibleCount)
      this.verticalList = all.slice(visibleCount)
      this.showMoreBtn = this.verticalList.length > 0
      if (!this.showMoreBtn) {
        this.popoverShow = false
      }
    },

    // 监听本地文件读写
    onWriteLocalFile(content) {
      if (this.timer) {
        clearTimeout(this.timer)
        this.completedLocalFileWriteRequestId = Math.max(
          this.completedLocalFileWriteRequestId,
          this.localFileWriteRequestId
        )
      }
      this.timer = null
      const writeTask = this.createLocalWriteTask(content)
      if (!writeTask) {
        this.waitingWriteToLocalFile = this.hasPendingLocalWrite()
        return
      }
      this.waitingWriteToLocalFile = true
      this.lastLocalSaveErrorMessage = ''
      markDocumentDirty(true)
      this.scheduleRecoveryDraftWrite(writeTask)
      this.timer = setTimeout(() => {
        this.timer = null
        void this.writeLocalFile(writeTask)
      }, LOCAL_FILE_WRITE_DEBOUNCE_MS)
    },

    scheduleRecoveryDraftWrite(writeTask) {
      if (this.recoveryTimer) {
        clearTimeout(this.recoveryTimer)
      }
      this.recoveryTimer = setTimeout(() => {
        this.recoveryTimer = null
        void this.writeRecoveryDraft(writeTask)
      }, RECOVERY_WRITE_DEBOUNCE_MS)
    },

    async writeRecoveryDraft(writeTask) {
      if (!writeTask?.fileRef || !writeTask.content) {
        return
      }
      try {
        await writeRecoveryDraftForFile({
          fileRef: writeTask.fileRef,
          data: writeTask.content,
          config: getConfig(),
          isFullDataFile: writeTask.isFullDataFile
        })
      } catch (error) {
        console.error('writeRecoveryDraft failed', error)
      }
    },

    onUnload(e) {
      if (this.hasPotentialDataLoss) {
        const msg = this.$t('toolbar.unsavedData')
        e.returnValue = msg
        return msg
      }
    },

    // 加载本地文件树
    async loadFileTreeNode(node, resolve) {
      try {
        let directoryRef = null
        if (node.level === 0) {
          directoryRef = await platform.pickDirectory({
            defaultPath: getLastDirectory()
          })
          if (!directoryRef) {
            this.fileTreeVisible = false
            resolve([])
            return
          }
          this.rootDirName = directoryRef.name
          await setLastDirectory(directoryRef.path || '')
        } else {
          directoryRef = node.data
        }
        resolve(await platform.listDirectoryEntries(directoryRef))
      } catch (error) {
        console.error('loadFileTreeNode failed', error)
        this.fileTreeVisible = false
        resolve([])
        if (error.toString().includes('aborted')) {
          return
        }
        this.$message.warning(this.$t('toolbar.notSupportTip'))
      }
    },

    // 扫描本地文件夹
    async openDirectory() {
      if (!(await this.confirmPotentialDataLoss('openDirectory'))) {
        return
      }
      this.fileTreeVisible = false
      this.fileTreeExpand = true
      this.rootDirName = ''
      this.$nextTick(() => {
        this.fileTreeVisible = true
      })
    },

    // 编辑指定文件
    async editLocalFile(data) {
      if (!data || data.mode !== 'desktop') return
      if (!(await this.confirmPotentialDataLoss('editLocalFile'))) {
        return
      }
      void this.readFile(data)
    },

    // 导入指定文件
    async importLocalFile(data) {
      try {
        const importRef = await this.ensurePanelMounted('import', 'ImportRef')
        if (!importRef) return
        if (!data || data.mode !== 'desktop') return
        const result = await platform.readMindMapFile(data)
        const file = new File([result.content], result.name, {
          type: 'application/json'
        })
        importRef.onChange({
          raw: file,
          name: file.name
        })
        importRef.confirm()
      } catch (error) {
        console.error('importLocalFile failed', error)
      }
    },

    async openRecentFile(item) {
      if (!item || !item.path) return
      if (!(await this.confirmPotentialDataLoss('openRecentFile'))) {
        return
      }
      void this.readFile({
        ...item,
        mode: item.mode || 'desktop'
      })
    },

    // 打开本地文件
    async openLocalFile() {
      if (!(await this.confirmPotentialDataLoss('openFile'))) {
        return
      }
      try {
        const nextFileHandle = await platform.openMindMapFile({
          defaultPath: getLastDirectory()
        })
        if (!nextFileHandle) {
          return
        }
        const requestId = this.startLocalFileRead(nextFileHandle)
        if (!requestId) return
        const recoveredResult = await resolveFileContentWithRecovery(
          nextFileHandle,
          nextFileHandle.content
        )
        await this.applyLocalFileResult(
          {
            ...nextFileHandle,
            content: recoveredResult.content,
            recoveredFromDraft: recoveredResult.recovered
          },
          requestId
        )
      } catch (error) {
        console.error('openLocalFile failed', error)
        if (error.toString().includes('aborted')) {
          return
        }
        const fileError = createDesktopFsError(error)
        this.$message.error(
          fileError.message || this.$t('toolbar.fileOpenFailed')
        )
      }
    },

    // 读取本地文件
    async readFile(targetFileRef = null) {
      const fileRef = snapshotLocalFileRef(targetFileRef || getCurrentFileRef())
      if (!fileRef) return false
      const requestId = this.startLocalFileRead(fileRef)
      if (!requestId) return false
      try {
        const result = await platform.readMindMapFile(fileRef)
        const recoveredResult = await resolveFileContentWithRecovery(
          fileRef,
          result.content
        )
        return await this.applyLocalFileResult(
          {
            ...fileRef,
            ...result,
            content: recoveredResult.content,
            recoveredFromDraft: recoveredResult.recovered
          },
          requestId
        )
      } catch (error) {
        if (!this.isLatestLocalFileRead(requestId, fileRef)) {
          return false
        }
        if (requestId === this.localFileReadRequestId) {
          this.pendingLocalFileRef = null
        }
        console.error('readFile failed', error)
        const fileError = createDesktopFsError(error)
        this.$message.error(
          fileError.message || this.$t('toolbar.fileOpenFailed')
        )
        return false
      }
    },

    // 渲染读取的数据
    setData(str) {
      const normalized = parseToolbarLocalFileContent(
        str,
        this.$t('toolbar.fileContentError')
      )
      this.isFullDataFile = normalized.isFullDataFile
      if (normalized.documentMode === 'flowchart') {
        void saveBootstrapStatePatch({
          mindMapData: null,
          mindMapConfig: null,
          flowchartData: normalized.flowchartData,
          flowchartConfig: normalized.flowchartConfig || null
        })
        return normalized
      }
      void saveBootstrapStatePatch({
        mindMapData: normalized.data,
        mindMapConfig: normalized.configData || null,
        flowchartData: null,
        flowchartConfig: null
      })
      this.$bus.$emit('setData', normalized.data, {
        configData: normalized.configData || null
      })
      return normalized
    },

    startLocalFileRead(targetFileRef) {
      const fileRef = snapshotLocalFileRef(targetFileRef)
      if (!fileRef) return 0
      this.pendingLocalFileRef = fileRef
      return ++this.localFileReadRequestId
    },

    isLatestLocalFileRead(requestId, fileRef) {
      return (
        requestId === this.localFileReadRequestId &&
        isSameLocalFileRef(this.pendingLocalFileRef, fileRef)
      )
    },

    async applyLocalFileResult(fileResult, requestId) {
      const fileRef = snapshotLocalFileRef(fileResult)
      if (!fileRef) return false
      try {
        const normalized = parseToolbarLocalFileContent(
          fileResult.content,
          this.$t('toolbar.fileContentError')
        )
        if (!this.isLatestLocalFileRead(requestId, fileRef)) {
          return false
        }
        const nextFileRef = {
          ...fileRef,
          name: String(fileResult.name || fileRef.name || '').trim(),
          isFullDataFile: normalized.isFullDataFile,
          documentMode: normalized.documentMode
        }
        const setDataOptions = {
          configData: normalized.configData || null
        }
        this.isFullDataFile = normalized.isFullDataFile
        setCurrentFileRef(nextFileRef, nextFileRef.mode || 'desktop')
        setIsHandleLocalFile(true)
        if (normalized.documentMode === 'flowchart') {
          await saveBootstrapStatePatch({
            mindMapData: null,
            mindMapConfig: null,
            flowchartData: normalized.flowchartData,
            flowchartConfig: normalized.flowchartConfig || null
          })
        } else {
          await saveBootstrapStatePatch({
            mindMapData: normalized.data,
            mindMapConfig: setDataOptions.configData,
            flowchartData: null,
            flowchartConfig: null
          })
          this.$bus.$emit('setData', normalized.data, {
            skipSave: true,
            configData: setDataOptions.configData
          })
        }
        await recordRecentFile(nextFileRef)
        if (!this.isLatestLocalFileRead(requestId, fileRef)) {
          return false
        }
        this.pendingLocalFileRef = null
        markDocumentDirty(!!fileResult.recoveredFromDraft)
        this.recoveredDraftLoaded = !!fileResult.recoveredFromDraft
        this.lastSuccessfulSaveAt = 0
        this.lastLocalSaveErrorMessage = ''
        this.refreshRecentFiles()
        syncRuntimeFromWorkspaceMeta(getWorkspaceMetaState())
        if (fileResult.recoveredFromDraft) {
          this.$message.success(this.$t('toolbar.recoveredDraftLoaded'))
        }
        return true
      } catch (error) {
        if (
          requestId === this.localFileReadRequestId &&
          isSameLocalFileRef(this.pendingLocalFileRef, fileRef)
        ) {
          this.pendingLocalFileRef = null
        }
        throw error
      }
    },

    createLocalWriteTask(content) {
      return createLocalWriteTaskData({
        fileRef: getCurrentFileRef(),
        content,
        isFullDataFile:
          typeof this.isFullDataFile === 'boolean'
            ? this.isFullDataFile
            : !!getCurrentFileRef()?.isFullDataFile,
        configData: getConfig(),
        requestId: ++this.localFileWriteRequestId
      })
    },

    hasPendingLocalWrite(requestId = 0) {
      return hasPendingLocalWriteState({
        timer: this.timer,
        currentLocalFileWriteRequestId: this.currentLocalFileWriteRequestId,
        localFileWriteRequestId: this.localFileWriteRequestId,
        completedLocalFileWriteRequestId: this.completedLocalFileWriteRequestId,
        requestId
      })
    },

    // 写入本地文件
    async writeLocalFile(writeTask) {
      if (!writeTask) {
        this.waitingWriteToLocalFile = this.hasPendingLocalWrite()
        return
      }
      let writeSucceeded = false
      this.currentLocalFileWriteRequestId = writeTask.id
      try {
        const string = serializeMindMapWriteContent({
          content: writeTask.content,
          configData: writeTask.configData,
          isFullDataFile: writeTask.isFullDataFile
        })
        await platform.writeMindMapFile(writeTask.fileRef, string)
        await recordRecentFile(writeTask.fileRef)
        this.refreshRecentFiles()
        this.lastSuccessfulSaveAt = Date.now()
        this.lastLocalSaveErrorMessage = ''
        writeSucceeded = true
      } catch (error) {
        console.error('writeLocalFile failed', error)
        const fileError = createDesktopFsError(error)
        this.lastLocalSaveErrorMessage =
          fileError.message || this.$t('toolbar.fileSaveFailed')
        this.$message.error(
          this.lastLocalSaveErrorMessage
        )
      } finally {
        if (this.currentLocalFileWriteRequestId === writeTask.id) {
          this.currentLocalFileWriteRequestId = 0
        }
        this.completedLocalFileWriteRequestId = Math.max(
          this.completedLocalFileWriteRequestId,
          writeTask.id
        )
        const hasPendingLocalWrite = this.hasPendingLocalWrite(writeTask.id)
        this.waitingWriteToLocalFile = hasPendingLocalWrite
        if (!hasPendingLocalWrite && writeSucceeded) {
          if (this.recoveryTimer) {
            clearTimeout(this.recoveryTimer)
            this.recoveryTimer = null
          }
          try {
            await clearRecoveryDraftForFile(writeTask.fileRef)
          } catch (error) {
            console.error('clearRecoveryDraftForFile failed', error)
          }
          this.recoveredDraftLoaded = false
          markDocumentDirty(false)
          this.lastLocalSaveErrorMessage = ''
        }
      }
    },

    // 创建本地文件
    async createNewLocalFile() {
      if (!(await this.confirmPotentialDataLoss('newFile'))) {
        return
      }
      await this.createLocalFile(createDefaultMindMapData())
    },

    // 另存为
    async saveLocalFile() {
      let data = getData()
      await this.createLocalFile(data)
    },

    // 创建本地文件
    async createLocalFile(content) {
      try {
        const previousFileRef = snapshotLocalFileRef(getCurrentFileRef())
        const configData = getConfig()
        const serializedContent = serializeMindMapWriteContent({
          content,
          configData,
          isFullDataFile: true
        })
        const nextFileHandle = await platform.saveMindMapFileAs({
          suggestedName: this.$t('toolbar.defaultFileName'),
          content: serializedContent,
          defaultPath: getLastDirectory()
        })
        if (!nextFileHandle) {
          return
        }
        const loading = this.$loading({
          lock: true,
          text: this.$t('toolbar.creatingTip'),
          background: 'rgba(0, 0, 0, 0.7)'
        })
        try {
          const requestId = this.startLocalFileRead(nextFileHandle)
          if (!requestId) return
          await this.applyLocalFileResult(
            {
              ...nextFileHandle,
              content: serializedContent
            },
            requestId
          )
          this.lastSuccessfulSaveAt = Date.now()
          this.lastLocalSaveErrorMessage = ''
          if (this.recoveryTimer) {
            clearTimeout(this.recoveryTimer)
            this.recoveryTimer = null
          }
          await Promise.all(
            [previousFileRef, nextFileHandle]
              .filter(Boolean)
              .map(item =>
                clearRecoveryDraftForFile(item).catch(error => {
                  console.error('clearRecoveryDraftForFile failed', error)
                })
              )
          )
          this.recoveredDraftLoaded = false
          this.$message.success(this.$t('toolbar.fileCreated'))
        } finally {
          loading.close()
        }
      } catch (error) {
        console.error('createLocalFile failed', error)
        if (error.toString().includes('aborted')) {
          return
        }
        this.$message.warning(this.$t('toolbar.notSupportTip'))
      }
    },

    onNodeNoteDblclick(node, e) {
      e.stopPropagation()
      this.ensurePanelMounted('nodeNote').then(() => {
        emitShowNodeNote({
          node
        })
      })
    },

    toggleSelectedBookmark() {
      const nodes = this.getActiveNodesSnapshot
        ? this.getActiveNodesSnapshot()
        : this.activeNodes || []
      if (!nodes.length) {
        this.$message.warning(
          this.$t('bookmark.needSelection') || '请先选择主题'
        )
        return
      }
      const allBookmarked = nodes.every(node => isNodeBookmarked(node))
      const count = toggleNodesBookmark(nodes)
      if (count > 0) {
        this.$bus.$emit('bookmarkRefresh')
        this.$message.success(
          allBookmarked
            ? this.$t('bookmark.removed') || '已取消收藏'
            : this.$t('bookmark.added') || '已收藏主题'
        )
      }
    },

    async onSelectAttachment(activeNodes = []) {
      const nodes = Array.isArray(activeNodes)
        ? activeNodes.filter(Boolean)
        : this.activeNodes || []
      if (nodes.length <= 0) {
        this.$message.warning(
          this.$t('attachment.needSelection') || '请先选择主题'
        )
        return
      }
      try {
        const picked = await platform.pickOpenFile({
          defaultPath: getLastDirectory() || undefined
        })
        if (!picked?.path) {
          return
        }
        applyAttachmentToNodes(nodes, {
          url: picked.path,
          name: picked.name || picked.path.split(/[\\/]/).pop() || 'attachment'
        })
        this.$message.success(
          this.$t('attachment.attached') || '已添加附件'
        )
      } catch (error) {
        console.error('onSelectAttachment failed', error)
        this.$message.error(
          error?.message || this.$t('attachment.attachFailed') || '添加附件失败'
        )
      }
    },

    async onAttachmentClick(node, e) {
      if (e?.stopPropagation) e.stopPropagation()
      if (e?.preventDefault) e.preventDefault()
      const { url, name } = getAttachmentFromNode(node)
      if (!url) {
        this.$message.warning(
          this.$t('attachment.empty') || '当前主题没有附件'
        )
        return
      }
      try {
        if (typeof platform.openLocalPath === 'function') {
          await platform.openLocalPath(url)
        } else {
          await platform.openExternalUrl(url)
        }
      } catch (error) {
        console.error('onAttachmentClick failed', error)
        this.$message.error(
          error?.message ||
            this.$t('attachment.openFailed', { name: name || url }) ||
            '打开附件失败'
        )
      }
    },

    async onAttachmentContextmenu(node, e) {
      if (e?.stopPropagation) e.stopPropagation()
      if (e?.preventDefault) e.preventDefault()
      const { name, url } = getAttachmentFromNode(node)
      if (!url) return
      try {
        await this.$confirm(
          this.$t('attachment.deleteConfirmMessage', {
            name: name || url
          }) || `确定删除附件「${name || url}」吗？`,
          this.$t('attachment.deleteAttachment') || '删除附件',
          {
            type: 'warning',
            confirmButtonText: this.$t('ai.confirm') || '确认',
            cancelButtonText: this.$t('ai.cancel') || '取消'
          }
        )
      } catch (_error) {
        return
      }
      clearAttachmentFromNodes([node])
      this.$message.success(
        this.$t('attachment.deleted') || '已删除附件'
      )
    }
  }
}
</script>

<style lang="less" scoped>
.toolbarContainer {
  --toolbar-surface: rgba(255, 255, 255, 0.9);
  --toolbar-border: rgba(15, 23, 42, 0.08);
  --toolbar-shadow: none;
  --toolbar-text-color: rgba(15, 23, 42, 0.72);
  --toolbar-text-hover-color: rgba(15, 23, 42, 0.96);
  --toolbar-subtle-text-color: #737373;
  --toolbar-icon-bg: transparent;
  --toolbar-icon-border: transparent;
  --toolbar-icon-shadow: none;
  --toolbar-icon-hover-bg: rgba(15, 23, 42, 0.06);
  --toolbar-icon-hover-border: transparent;
  --toolbar-icon-hover-shadow: none;
  --toolbar-icon-active-bg: rgba(15, 23, 42, 0.09);
  --toolbar-icon-active-border: transparent;
  --toolbar-icon-active-shadow: none;
  --toolbar-divider-color: rgba(15, 23, 42, 0.08);
  --toolbar-disabled-color: rgba(15, 23, 42, 0.24);
  --command-palette-surface: #fff;
  --command-palette-border: rgba(15, 23, 42, 0.12);
  --command-palette-shadow: 0 22px 52px rgba(15, 23, 42, 0.18);
  --command-palette-input-bg: rgba(15, 23, 42, 0.04);
  --command-palette-hover-bg: rgba(15, 23, 42, 0.06);
  --command-palette-shortcut-bg: rgba(15, 23, 42, 0.06);

  &.isDark {
    --toolbar-surface: rgba(24, 28, 34, 0.92);
    --toolbar-border: rgba(255, 255, 255, 0.08);
    --toolbar-shadow: none;
    --toolbar-text-color: hsla(0, 0%, 100%, 0.74);
    --toolbar-text-hover-color: #fff;
    --toolbar-subtle-text-color: hsla(0, 0%, 100%, 0.52);
    --toolbar-icon-bg: transparent;
    --toolbar-icon-border: transparent;
    --toolbar-icon-shadow: none;
    --toolbar-icon-hover-bg: rgba(255, 255, 255, 0.1);
    --toolbar-icon-hover-border: transparent;
    --toolbar-icon-hover-shadow: none;
    --toolbar-icon-active-bg: rgba(255, 255, 255, 0.12);
    --toolbar-icon-active-border: transparent;
    --toolbar-icon-active-shadow: none;
    --toolbar-divider-color: rgba(255, 255, 255, 0.1);
    --toolbar-disabled-color: rgba(255, 255, 255, 0.2);
    --command-palette-surface: #20242b;
    --command-palette-border: rgba(255, 255, 255, 0.1);
    --command-palette-shadow: 0 24px 56px rgba(0, 0, 0, 0.36);
    --command-palette-input-bg: rgba(255, 255, 255, 0.08);
    --command-palette-hover-bg: rgba(255, 255, 255, 0.08);
    --command-palette-shortcut-bg: rgba(255, 255, 255, 0.1);

    .toolbar {
      color: var(--toolbar-text-color);
      .toolbarBlock {
        background-color: var(--toolbar-surface);

        .fileTreeBox {
          background-color: #20242b;
          border-color: rgba(255, 255, 255, 0.08);

          :deep(.el-tree) {
            background-color: #20242b;

            &.el-tree--highlight-current {
              .el-tree-node.is-current > .el-tree-node__content {
                background-color: hsla(0, 0%, 100%, 0.05) !important;
              }
            }

            .el-tree-node:focus > .el-tree-node__content {
              background-color: hsla(0, 0%, 100%, 0.05) !important;
            }

            .el-tree-node__content:hover,
            .el-upload-list__item:hover {
              background-color: hsla(0, 0%, 100%, 0.02) !important;
            }
          }

          .fileTreeWrap {
            .customTreeNode {
              .treeNodeInfo {
                color: #fff;
              }

              .treeNodeBtnList {
                .el-button {
                  padding: 7px 5px;
                }
              }
            }
          }
        }
      }

      .toolbarBtn {
        .icon {
          background: var(--toolbar-icon-bg);
          border-color: var(--toolbar-icon-border);
        }

        &:hover {
          &:not(.disabled) {
            .icon {
              background: var(--toolbar-icon-hover-bg);
            }
          }
        }

        &.disabled {
          color: var(--toolbar-disabled-color);
        }
      }

      .toolbarDivider {
        background: var(--toolbar-divider-color);
      }
    }
  }

  .toolbar {
    position: fixed;
    left: 0;
    right: 0;
    top: 0;
    width: auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
    font-family:
      "Segoe UI",
      "PingFang SC",
      "Microsoft YaHei",
      sans-serif;
    font-weight: 400;
    color: var(--toolbar-text-color);
    z-index: 1200;
    min-height: 56px;
    padding: 0 16px;
    background: var(--toolbar-surface);
    border-bottom: 1px solid var(--toolbar-border);
    box-shadow: var(--toolbar-shadow);
    backdrop-filter: blur(18px);

    .toolbarBlock {
      display: flex;
      align-items: center;
      background-color: transparent;
      padding: 0;
      border-radius: 0;
      box-shadow: none;
      border: none;
      flex-shrink: 0;
      position: relative;

      .fileTreeBox {
        position: absolute;
        left: 0;
        top: 52px;
        width: 100%;
        height: 30px;
        background-color: #fff;
        padding: 12px 5px;
        padding-top: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border-radius: 16px;
        min-width: 200px;
        box-shadow: 0 22px 40px rgba(15, 23, 42, 0.14);
        border: 1px solid var(--toolbar-border);

        &.expand {
          height: 300px;

          .fileTreeWrap {
            visibility: visible;
          }
        }

        .fileTreeToolbar {
          width: 100%;
          height: 34px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--toolbar-divider-color);
          margin-bottom: 12px;
          padding-left: 12px;
          color: inherit;

          .fileTreeName {
          }

          .fileTreeActionList {
            .btn {
              width: 24px;
              height: 24px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
              font-weight: 700;
              margin-left: 12px;
              cursor: pointer;
              line-height: 1;
              border-radius: 8px;
              transition:
                background 0.2s ease,
                transform 0.2s ease;

              &:hover {
                background: rgba(15, 23, 42, 0.06);
              }

              &.expanded {
                transform: rotate(180deg);
              }

              &.closeBtn {
                font-size: 14px;
              }
            }
          }
        }

        .fileTreeWrap {
          width: 100%;
          height: 100%;
          overflow: auto;
          visibility: hidden;

          .customTreeNode {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 13px;
            padding-right: 5px;

            .treeNodeInfo {
              display: flex;
              align-items: center;

              .treeNodeIcon {
                margin-right: 5px;
                opacity: 0.7;
              }

              .treeNodeName {
                max-width: 200px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              }
            }

            .treeNodeBtnList {
              display: flex;
              align-items: center;
            }
          }
        }
      }
    }

    .toolbarBlock:first-of-type {
      flex: 1 1 auto;
      min-width: 0;
      overflow: hidden;
      margin-right: 12px;
    }

    .toolbarBlock:nth-of-type(2) {
      flex: 0 0 auto;
      gap: 4px;

      :deep(.el-dropdown) {
        display: inline-flex;
        align-items: center;
      }

      .fileActionBtn,
      :deep(.el-dropdown) > .toolbarBtn {
        min-width: 38px;
      }
    }

    .toolbarMetaBlock {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      margin-left: 12px;
      gap: 10px;

      .toolbarSaveStatus {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        max-width: 148px;
        min-height: 28px;
        padding: 0 8px;
        border-radius: 999px;
        background: rgba(15, 23, 42, 0.04);
        color: var(--toolbar-subtle-text-color);
        font-size: 12px;
        line-height: 1;
        white-space: nowrap;
      }

      .toolbarSaveStatusDot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: currentColor;
        flex: 0 0 auto;
      }

      .toolbarSaveStatusText {
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .toolbarSaveStatus.is-saved {
        color: #15803d;
        background: rgba(21, 128, 61, 0.08);
      }

      .toolbarSaveStatus.is-autosaving {
        color: #1d4ed8;
        background: rgba(29, 78, 216, 0.08);
      }

      .toolbarSaveStatus.is-dirty,
      .toolbarSaveStatus.is-recovered {
        color: #b45309;
        background: rgba(180, 83, 9, 0.1);
      }

      .toolbarSaveStatus.is-failed {
        color: #b91c1c;
        background: rgba(185, 28, 28, 0.1);
      }

      .toolbarQuickActions {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .quickActionBtn {
        min-width: 38px;
      }
    }

    .toolbarBtn {
      display: inline-flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      cursor: pointer;
      min-width: 38px;
      flex-shrink: 0;
      color: inherit;
      transition:
        color 0.2s ease,
        transform 0.22s ease;

      &:hover {
        &:not(.disabled) {
          transform: translateY(-1px);

          .icon {
            background: var(--toolbar-icon-hover-bg);
            border-color: var(--toolbar-icon-hover-border);
            box-shadow: var(--toolbar-icon-hover-shadow);
          }
        }
      }

      &.active {
        .icon {
          background: var(--toolbar-icon-active-bg);
          border-color: var(--toolbar-icon-active-border);
          box-shadow: var(--toolbar-icon-active-shadow);
        }
      }

      &.disabled {
        color: var(--toolbar-disabled-color);
        cursor: not-allowed;
        pointer-events: none;
      }

      .icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        min-width: 32px;
        height: 32px;
        background: var(--toolbar-icon-bg);
        border-radius: 6px;
        border: 1px solid var(--toolbar-icon-border);
        text-align: center;
        padding: 0 6px;
        font-size: 15px;
        line-height: 1;
        box-shadow: var(--toolbar-icon-shadow);
        transition:
          background 0.2s ease,
          border-color 0.2s ease,
          box-shadow 0.22s ease;
      }

      .text {
        margin-top: 4px;
        line-height: 1.1;
        text-align: center;
        white-space: nowrap;
        font-size: 10px;
        font-weight: 500;
        letter-spacing: 0.01em;
        color: var(--toolbar-subtle-text-color);
      }
    }

    .toolbarDivider {
      width: 1px;
      height: 16px;
      background: var(--toolbar-divider-color);
      margin: 0 8px;
      flex-shrink: 0;
    }

    &.hideLabels {
      .toolbarBtn {
        min-width: 32px;

        .text {
          display: none;
        }
      }

      .fileActionsBlock {
        .fileActionBtn,
        :deep(.el-dropdown) > .toolbarBtn {
          min-width: 32px;
        }
      }

    }

    .toolbarMeasure {
      position: fixed;
      left: -99999px;
      top: -99999px;
      visibility: hidden;
      pointer-events: none;
    }
  }

  .commandPaletteOverlay {
    position: fixed;
    inset: 0;
    z-index: 1300;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 82px 16px 16px;
    background: rgba(15, 23, 42, 0.14);
  }

  .commandPalettePanel {
    width: min(520px, 100%);
    max-height: min(520px, calc(100vh - 110px));
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-radius: 8px;
    background: var(--command-palette-surface);
    border: 1px solid var(--command-palette-border);
    box-shadow: var(--command-palette-shadow);
    color: var(--toolbar-text-hover-color);
  }

  .commandPaletteHeader {
    height: 48px;
    padding: 0 14px 0 18px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--toolbar-divider-color);
  }

  .commandPaletteTitle {
    font-size: 14px;
    font-weight: 600;
  }

  .commandPaletteClose {
    width: 28px;
    height: 28px;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: var(--toolbar-subtle-text-color);
    cursor: pointer;
    font-size: 14px;
    line-height: 1;

    &:hover {
      color: var(--toolbar-text-hover-color);
      background: var(--command-palette-hover-bg);
    }
  }

  .commandPaletteInput {
    height: 42px;
    margin: 14px;
    padding: 0 12px;
    border: 1px solid transparent;
    border-radius: 6px;
    outline: none;
    background: var(--command-palette-input-bg);
    color: var(--toolbar-text-hover-color);
    font-size: 14px;
    font-family:
      "Segoe UI",
      "PingFang SC",
      "Microsoft YaHei",
      sans-serif;

    &:focus {
      border-color: var(--command-palette-border);
    }

    &::placeholder {
      color: var(--toolbar-subtle-text-color);
    }
  }

  .commandPaletteList {
    min-height: 72px;
    overflow: auto;
    padding: 0 8px 10px;
  }

  .commandPaletteItem {
    width: 100%;
    min-height: 42px;
    padding: 0 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: inherit;
    cursor: pointer;
    text-align: left;
    font: inherit;

    &:hover,
    &:focus-visible,
    &.isActive {
      outline: none;
      background: var(--command-palette-hover-bg);
    }

    &.isDisabled,
    &:disabled {
      cursor: not-allowed;
      color: var(--toolbar-disabled-color);
      background: transparent;
    }
  }

  .commandPaletteItemLabel {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .commandPaletteItemShortcut {
    flex: 0 0 auto;
    padding: 3px 6px;
    border-radius: 5px;
    background: var(--command-palette-shortcut-bg);
    color: var(--toolbar-subtle-text-color);
    font-size: 11px;
    line-height: 1.2;
  }

  .commandPaletteEmpty {
    min-height: 58px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--toolbar-subtle-text-color);
    font-size: 13px;
  }
}

@media (max-width: 980px) {
  .toolbarContainer {
    .toolbar {
      .toolbarMetaBlock {
        display: none;
      }
    }
  }
}

@media (max-width: 720px) {
  .toolbarContainer {
    .toolbar {
      padding: 0 10px;
    }
  }
}
</style>
