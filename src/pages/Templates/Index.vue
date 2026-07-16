<template>
  <div class="templatesPage" :class="{ isDark }">
    <header class="templatesHeader">
      <div>
        <div class="eyebrow">{{ $t('home.starterTitle') }}</div>
        <h1>{{ $t('home.templatesCenterTitle') }}</h1>
      </div>
      <div class="headerActions">
        <input
          v-model.trim="keyword"
          class="templatesSearch"
          type="search"
          :placeholder="$t('home.starterSearchPlaceholder')"
        />
        <button type="button" class="backBtn" @click="$router.push('/home')">
          {{ $t('home.backHome') }}
        </button>
      </div>
    </header>

    <div class="categoryChips">
      <button
        type="button"
        class="categoryChip"
        :class="{ isActive: category === 'all' }"
        @click="category = 'all'"
      >
        {{ $t('home.starterCategoryAll') }} ({{ counts.all }})
      </button>
      <button
        type="button"
        class="categoryChip"
        :class="{ isActive: category === 'mindmap' }"
        @click="category = 'mindmap'"
      >
        {{ $t('home.starterCategoryMindmap') }} ({{ counts.mindmap }})
      </button>
      <button
        type="button"
        class="categoryChip"
        :class="{ isActive: category === 'flowchart' }"
        @click="category = 'flowchart'"
      >
        {{ $t('home.starterCategoryFlowchart') }} ({{ counts.flowchart }})
      </button>
    </div>

    <section v-if="showMindmap" class="templateSection">
      <h2>{{ $t('home.starterCategoryMindmap') }}</h2>
      <div class="templateGrid">
        <button
          v-for="item in filteredMindmapStarters"
          :key="item.key"
          type="button"
          class="templateCard"
          :disabled="busy"
          @click="createMindMapScenario(item.key)"
        >
          <strong>{{ $t(item.titleKey) }}</strong>
          <span>{{ $t(item.descKey) }}</span>
        </button>
      </div>
    </section>

    <section v-if="showFlowchart" class="templateSection">
      <h2>{{ $t('home.starterCategoryFlowchart') }}</h2>
      <div class="templateGrid">
        <button
          v-for="item in filteredFlowchartStarters"
          :key="item.key"
          type="button"
          class="templateCard"
          :disabled="busy"
          @click="createFlowchartFromTemplate(item.key)"
        >
          <strong>{{ $t(item.titleKey) }}</strong>
          <span>{{ $t(item.descKey) }}</span>
        </button>
      </div>
    </section>

    <div v-if="!filteredMindmapStarters.length && !filteredFlowchartStarters.length" class="empty">
      {{ $t('home.starterEmpty') }}
    </div>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { useThemeStore } from '@/stores/theme'
import { createDefaultMindMapData } from '@/platform/shared/configSchema'
import { getPreferredMindMapThemeValue } from '@/stores/runtime'
import {
  FLOWCHART_TEMPLATE_STARTERS,
  MIND_MAP_SCENARIO_STARTERS
} from '@/services/templateCatalog'

let workspaceActionsPromise = null
const loadWorkspaceActions = async () => {
  if (!workspaceActionsPromise) {
    workspaceActionsPromise = import('@/services/workspaceActions').catch(error => {
      workspaceActionsPromise = null
      throw error
    })
  }
  return workspaceActionsPromise
}

export default {
  name: 'TemplatesPage',
  data() {
    return {
      busy: false,
      keyword: '',
      category: 'all',
      mindmapStarters: MIND_MAP_SCENARIO_STARTERS,
      flowchartStarters: FLOWCHART_TEMPLATE_STARTERS
    }
  },
  computed: {
    ...mapState(useThemeStore, {
      isDark: 'isDark'
    }),
    counts() {
      return {
        all: this.mindmapStarters.length + this.flowchartStarters.length,
        mindmap: this.mindmapStarters.length,
        flowchart: this.flowchartStarters.length
      }
    },
    showMindmap() {
      return this.category === 'all' || this.category === 'mindmap'
    },
    showFlowchart() {
      return this.category === 'all' || this.category === 'flowchart'
    },
    filteredMindmapStarters() {
      return this.filterList(this.mindmapStarters)
    },
    filteredFlowchartStarters() {
      return this.filterList(this.flowchartStarters)
    }
  },
  methods: {
    filterList(list) {
      const keyword = String(this.keyword || '')
        .trim()
        .toLowerCase()
      if (!keyword) return list
      return list.filter(item => {
        const title = String(this.$t(item.titleKey) || '').toLowerCase()
        const desc = String(this.$t(item.descKey) || '').toLowerCase()
        return title.includes(keyword) || desc.includes(keyword)
      })
    },
    async runWorkspaceAction(task) {
      if (this.busy) return null
      this.busy = true
      try {
        return await task()
      } catch (error) {
        this.$message.error(error?.message || this.$t('home.actionFailed'))
        return null
      } finally {
        this.busy = false
      }
    },
    createScenarioMindMapData(scenario = 'meeting') {
      // Reuse home-compatible scenario factory via dynamic import of home logic would be heavy.
      // Keep a compact set of popular scenarios and fallback to blank seeded structures.
      const layout =
        scenario === 'project' || scenario === 'okr' ? 'organizationStructure' : 'mindMap'
      const themeTemplate = getPreferredMindMapThemeValue(!!this.isDark)
      const data = createDefaultMindMapData('思维导图', themeTemplate, layout)
      const titleMap = {
        meeting: '会议纪要',
        project: '项目计划',
        learning: '学习计划',
        review: '复盘总结',
        okr: 'OKR',
        weekly: '周报',
        interview: '面试准备',
        reading: '读书笔记',
        business: '商业计划',
        knowledge: '知识管理',
        competitor: '竞品分析',
        retro: '复盘会',
        roadmap: '产品路线图',
        content: '内容日历'
      }
      data.root.data.text = titleMap[scenario] || '思维导图'
      data.root.children = [
        {
          data: { text: '要点一' },
          children: [{ data: { text: '子要点' }, children: [] }]
        },
        {
          data: { text: '要点二' },
          children: []
        }
      ]
      return data
    },
    async createMindMapScenario(scenario) {
      await this.runWorkspaceAction(async () => {
        const { createWorkspaceLocalFile } = await loadWorkspaceActions()
        return createWorkspaceLocalFile({
          router: this.$router,
          content: this.createScenarioMindMapData(scenario)
        })
      })
    },
    async createFlowchartFromTemplate(templateId) {
      await this.runWorkspaceAction(async () => {
        const { createWorkspaceFlowchartFile } = await loadWorkspaceActions()
        return createWorkspaceFlowchartFile({
          router: this.$router,
          templateId,
          suggestedName: this.$t('home.createFlowchart')
        })
      })
    }
  }
}
</script>

<style lang="less" scoped>
.templatesPage {
  min-height: 100vh;
  padding: 28px 32px 48px;
  background: #fff;
  color: #111827;
}
.templatesPage.isDark {
  background: #171a1f;
  color: hsla(0, 0%, 100%, 0.9);
}
.templatesHeader {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 18px;
}
.eyebrow {
  font-size: 12px;
  color: #737373;
  margin-bottom: 4px;
}
.templatesHeader h1 {
  margin: 0;
  font-size: 24px;
}
.headerActions {
  display: flex;
  gap: 10px;
  align-items: center;
}
.templatesSearch {
  width: min(260px, 48vw);
  height: 36px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: rgba(255, 255, 255, 0.92);
  color: inherit;
  font: inherit;
}
.templatesPage.isDark .templatesSearch {
  border-color: rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
}
.backBtn {
  height: 36px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
}
.categoryChips {
  display: flex;
  gap: 8px;
  margin-bottom: 18px;
}
.categoryChip {
  height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
}
.categoryChip.isActive {
  background: rgba(37, 99, 235, 0.12);
  border-color: transparent;
}
.templateSection + .templateSection {
  margin-top: 22px;
}
.templateSection h2 {
  margin: 0 0 10px;
  font-size: 15px;
}
.templateGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}
.templateCard {
  min-height: 96px;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.9);
  color: inherit;
  text-align: left;
  cursor: pointer;
  font: inherit;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.templateCard span {
  color: #737373;
  font-size: 12px;
  line-height: 1.4;
}
.templatesPage.isDark .templateCard {
  background: rgba(24, 28, 34, 0.9);
  border-color: rgba(255, 255, 255, 0.08);
}
.templatesPage.isDark .templateCard span {
  color: rgba(255, 255, 255, 0.55);
}
.empty {
  margin-top: 24px;
  color: #737373;
}
</style>
