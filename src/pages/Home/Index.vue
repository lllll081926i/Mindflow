<template>
  <div class="homePage" :class="{ isDark: isDark }">
    <div class="workspaceShell">
      <aside class="workspaceSidebar">
        <div class="sidebarMeta">{{ $t('home.eyebrow') }}</div>
        <div class="sidebarIntro">
          <h1>{{ $t('home.brandTitle') }}</h1>
        </div>

        <div class="actionList">
          <button
            type="button"
            class="primaryAction"
            :disabled="busy"
            @click="createBlankProject"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>{{ $t('home.createNew') }}</span>
          </button>

          <button
            type="button"
            class="secondaryAction"
            :disabled="busy"
            @click="createFlowchart"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="4" y="5" width="6" height="4" rx="1"></rect>
              <rect x="14" y="15" width="6" height="4" rx="1"></rect>
              <path d="M10 7h4"></path>
              <path d="M14 17h-4"></path>
              <path d="M12 9v6"></path>
            </svg>
            <span>{{ $t('home.createFlowchart') }}</span>
          </button>

          <button
            type="button"
            class="actionItem"
            :disabled="busy"
            @click="openLocalFile"
          >
            <div class="actionIcon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"
                ></path>
                <polyline points="13 2 13 9 20 9"></polyline>
              </svg>
            </div>
            <div class="actionText">
              <strong>{{ $t('home.openLocalFile') }}</strong>
            </div>
          </button>

          <button
            type="button"
            class="actionItem"
            :disabled="busy"
            @click="openLocalDirectory"
          >
            <div class="actionIcon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
                ></path>
              </svg>
            </div>
            <div class="actionText">
              <strong>{{ $t('home.openLocalFolder') }}</strong>
            </div>
          </button>
        </div>
      </aside>

      <main class="workspaceMain">
        <section class="resumeSection">
          <div class="resumeHeader">
            <h2>{{ $t('home.continueTitle') }}</h2>
            <span v-if="hasDirtyDraft" class="dirtyBadge">
              {{ $t('home.unsavedBadge') }}
            </span>
          </div>

          <button
            v-if="hasResumeEntry"
            type="button"
            class="resumeCard"
            :disabled="busy"
            @click="continueWorkspace"
          >
            <div class="resumeMain">
              <strong>{{ resumeEntry.title }}</strong>
              <span>{{ resumeEntry.path || $t('home.resumeUnsavedPath') }}</span>
            </div>
            <span class="resumeAction">{{ $t('home.continueAction') }}</span>
          </button>

          <div v-else class="resumeEmpty">
            <p>{{ $t('home.continueEmpty') }}</p>
          </div>
        </section>

        <section class="starterSection">
          <div class="resumeHeader">
            <h2>{{ $t('home.starterTitle') }}</h2>
            <div class="starterHeaderActions">
              <input
                v-model.trim="starterKeyword"
                class="starterSearch"
                type="search"
                :placeholder="$t('home.starterSearchPlaceholder')"
              />
              <button type="button" class="templatesCenterBtn" @click="$router.push('/templates')">
                {{ $t('home.openTemplatesCenter') }}
              </button>
            </div>
          </div>
          <div class="starterCategoryChips">
            <button type="button" class="starterCategoryChip" :class="{ isActive: starterCategory === 'all' }" @click="starterCategory = 'all'">
              {{ $t('home.starterCategoryAll') }} ({{ starterCategoryCounts.all }})
            </button>
            <button type="button" class="starterCategoryChip" :class="{ isActive: starterCategory === 'mindmap' }" @click="starterCategory = 'mindmap'">
              {{ $t('home.starterCategoryMindmap') }} ({{ starterCategoryCounts.mindmap }})
            </button>
            <button type="button" class="starterCategoryChip" :class="{ isActive: starterCategory === 'flowchart' }" @click="starterCategory = 'flowchart'">
              {{ $t('home.starterCategoryFlowchart') }} ({{ starterCategoryCounts.flowchart }})
            </button>
          </div>
          <div class="starterSectionTitle">{{ starterSectionTitle }}</div>
          <div v-if="recentStarterKeys.length" class="recentStarterChips">
            <span class="recentStarterLabel">{{ $t('home.recentStarters') }}</span>
            <button
              v-for="key in recentStarterKeys"
              :key="key"
              type="button"
              class="recentStarterChip"
              @click="openRecentStarter(key)"
            >
              {{ formatRecentStarter(key) }}
            </button>
          </div>
          <div class="starterGrid">
            <button
              type="button"
              class="starterCard"
              v-show="isStarterVisible('mindmap', $t('home.starterMindMapBlank'), $t('home.starterMindMapBlankDesc'))"
              :disabled="busy"
              @click="createBlankProject"
            >
              <strong>{{ $t('home.starterMindMapBlank') }}</strong>
              <span>{{ $t('home.starterMindMapBlankDesc') }}</span>
            </button>
            <button
              type="button"
              class="starterCard"
              v-show="isStarterVisible('mindmap', $t('home.starterMindMapOrg'), $t('home.starterMindMapOrgDesc'))"
              :disabled="busy"
              @click="createMindMapWithLayout('mindMap')"
            >
              <strong>{{ $t('home.starterMindMapOrg') }}</strong>
              <span>{{ $t('home.starterMindMapOrgDesc') }}</span>
            </button>
            <button
              type="button"
              class="starterCard"
              v-show="isStarterVisible('mindmap', $t('home.starterMindMapTree'), $t('home.starterMindMapTreeDesc'))"
              :disabled="busy"
              @click="createMindMapWithLayout('organizationStructure')"
            >
              <strong>{{ $t('home.starterMindMapTree') }}</strong>
              <span>{{ $t('home.starterMindMapTreeDesc') }}</span>
            </button>
            <button
              type="button"
              class="starterCard"
              v-show="isStarterVisible('mindmap', $t('home.starterMindMapMeeting'), $t('home.starterMindMapMeetingDesc'))"
              :disabled="busy"
              @click="createMindMapScenario('meeting')"
            >
              <strong>{{ $t('home.starterMindMapMeeting') }}</strong>
              <span>{{ $t('home.starterMindMapMeetingDesc') }}</span>
            </button>
            <button
              type="button"
              class="starterCard"
              v-show="isStarterVisible('mindmap', $t('home.starterMindMapProject'), $t('home.starterMindMapProjectDesc'))"
              :disabled="busy"
              @click="createMindMapScenario('project')"
            >
              <strong>{{ $t('home.starterMindMapProject') }}</strong>
              <span>{{ $t('home.starterMindMapProjectDesc') }}</span>
            </button>
            <button
              type="button"
              class="starterCard"
              v-show="isStarterVisible('mindmap', $t('home.starterMindMapLearning'), $t('home.starterMindMapLearningDesc'))"
              :disabled="busy"
              @click="createMindMapScenario('learning')"
            >
              <strong>{{ $t('home.starterMindMapLearning') }}</strong>
              <span>{{ $t('home.starterMindMapLearningDesc') }}</span>
            </button>
            <button
              type="button"
              class="starterCard"
              v-show="isStarterVisible('mindmap', $t('home.starterMindMapReview'), $t('home.starterMindMapReviewDesc'))"
              :disabled="busy"
              @click="createMindMapScenario('review')"
            >
              <strong>{{ $t('home.starterMindMapReview') }}</strong>
              <span>{{ $t('home.starterMindMapReviewDesc') }}</span>
            </button>
            <button
              type="button"
              class="starterCard"
              v-show="isStarterVisible('mindmap', $t('home.starterMindMapOkr'), $t('home.starterMindMapOkrDesc'))"
              :disabled="busy"
              @click="createMindMapScenario('okr')"
            >
              <strong>{{ $t('home.starterMindMapOkr') }}</strong>
              <span>{{ $t('home.starterMindMapOkrDesc') }}</span>
            </button>
            <button
              type="button"
              class="starterCard"
              v-show="isStarterVisible('mindmap', $t('home.starterMindMapWeekly'), $t('home.starterMindMapWeeklyDesc'))"
              :disabled="busy"
              @click="createMindMapScenario('weekly')"
            >
              <strong>{{ $t('home.starterMindMapWeekly') }}</strong>
              <span>{{ $t('home.starterMindMapWeeklyDesc') }}</span>
            </button>
            <button
              type="button"
              class="starterCard"
              v-show="isStarterVisible('mindmap', $t('home.starterMindMapInterview'), $t('home.starterMindMapInterviewDesc'))"
              :disabled="busy"
              @click="createMindMapScenario('interview')"
            >
              <strong>{{ $t('home.starterMindMapInterview') }}</strong>
              <span>{{ $t('home.starterMindMapInterviewDesc') }}</span>
            </button>
            <button
              type="button"
              class="starterCard"
              v-show="isStarterVisible('mindmap', $t('home.starterMindMapReading'), $t('home.starterMindMapReadingDesc'))"
              :disabled="busy"
              @click="createMindMapScenario('reading')"
            >
              <strong>{{ $t('home.starterMindMapReading') }}</strong>
              <span>{{ $t('home.starterMindMapReadingDesc') }}</span>
            </button>
            <button
              type="button"
              class="starterCard"
              v-show="isStarterVisible('mindmap', $t('home.starterMindMapBusiness'), $t('home.starterMindMapBusinessDesc'))"
              :disabled="busy"
              @click="createMindMapScenario('business')"
            >
              <strong>{{ $t('home.starterMindMapBusiness') }}</strong>
              <span>{{ $t('home.starterMindMapBusinessDesc') }}</span>
            </button>
            <button
              type="button"
              class="starterCard"
              v-show="isStarterVisible('mindmap', $t('home.starterMindMapKnowledge'), $t('home.starterMindMapKnowledgeDesc'))"
              :disabled="busy"
              @click="createMindMapScenario('knowledge')"
            >
              <strong>{{ $t('home.starterMindMapKnowledge') }}</strong>
              <span>{{ $t('home.starterMindMapKnowledgeDesc') }}</span>
            </button>
            <button
              type="button"
              class="starterCard"
              v-show="isStarterVisible('mindmap', $t('home.starterMindMapCompetitor'), $t('home.starterMindMapCompetitorDesc'))"
              :disabled="busy"
              @click="createMindMapScenario('competitor')"
            >
              <strong>{{ $t('home.starterMindMapCompetitor') }}</strong>
              <span>{{ $t('home.starterMindMapCompetitorDesc') }}</span>
            </button>
            <button
              type="button"
              class="starterCard"
              v-show="isStarterVisible('mindmap', $t('home.starterMindMapRetro'), $t('home.starterMindMapRetroDesc'))"
              :disabled="busy"
              @click="createMindMapScenario('retro')"
            >
              <strong>{{ $t('home.starterMindMapRetro') }}</strong>
              <span>{{ $t('home.starterMindMapRetroDesc') }}</span>
            </button>
            <button
              type="button"
              class="starterCard"
              v-show="isStarterVisible('mindmap', $t('home.starterMindMapRoadmap'), $t('home.starterMindMapRoadmapDesc'))"
              :disabled="busy"
              @click="createMindMapScenario('roadmap')"
            >
              <strong>{{ $t('home.starterMindMapRoadmap') }}</strong>
              <span>{{ $t('home.starterMindMapRoadmapDesc') }}</span>
            </button>
            <button
              type="button"
              class="starterCard"
              v-show="isStarterVisible('mindmap', $t('home.starterMindMapContent'), $t('home.starterMindMapContentDesc'))"
              :disabled="busy"
              @click="createMindMapScenario('content')"
            >
              <strong>{{ $t('home.starterMindMapContent') }}</strong>
              <span>{{ $t('home.starterMindMapContentDesc') }}</span>
            </button>
            <button
              type="button"
              class="starterCard"
              v-show="isStarterVisible('flowchart', $t('home.starterFlowApproval'), $t('home.starterFlowApprovalDesc'))"
              :disabled="busy"
              @click="createFlowchartFromTemplate('approval')"
            >
              <strong>{{ $t('home.starterFlowApproval') }}</strong>
              <span>{{ $t('home.starterFlowApprovalDesc') }}</span>
            </button>
            <button
              type="button"
              class="starterCard"
              v-show="isStarterVisible('flowchart', $t('home.starterFlowRelease'), $t('home.starterFlowReleaseDesc'))"
              :disabled="busy"
              @click="createFlowchartFromTemplate('release')"
            >
              <strong>{{ $t('home.starterFlowRelease') }}</strong>
              <span>{{ $t('home.starterFlowReleaseDesc') }}</span>
            </button>
            <button
              type="button"
              class="starterCard"
              v-show="isStarterVisible('flowchart', $t('home.starterFlowEnterprise'), $t('home.starterFlowEnterpriseDesc'))"
              :disabled="busy"
              @click="createFlowchartFromTemplate('enterpriseDelivery')"
            >
              <strong>{{ $t('home.starterFlowEnterprise') }}</strong>
              <span>{{ $t('home.starterFlowEnterpriseDesc') }}</span>
            </button>
            <button
              type="button"
              class="starterCard"
              v-show="isStarterVisible('flowchart', $t('home.starterFlowSupport'), $t('home.starterFlowSupportDesc'))"
              :disabled="busy"
              @click="createFlowchartFromTemplate('supportEscalation')"
            >
              <strong>{{ $t('home.starterFlowSupport') }}</strong>
              <span>{{ $t('home.starterFlowSupportDesc') }}</span>
            </button>
            <button
              type="button"
              class="starterCard"
              v-show="isStarterVisible('flowchart', $t('home.starterFlowSales'), $t('home.starterFlowSalesDesc'))"
              :disabled="busy"
              @click="createFlowchartFromTemplate('salesPipeline')"
            >
              <strong>{{ $t('home.starterFlowSales') }}</strong>
              <span>{{ $t('home.starterFlowSalesDesc') }}</span>
            </button>
            <button
              type="button"
              class="starterCard"
              v-show="isStarterVisible('flowchart', $t('home.starterFlowReviewFlow'), $t('home.starterFlowReviewFlowDesc'))"
              :disabled="busy"
              @click="createFlowchartFromTemplate('contentReview')"
            >
              <strong>{{ $t('home.starterFlowReviewFlow') }}</strong>
              <span>{{ $t('home.starterFlowReviewFlowDesc') }}</span>
            </button>
            <button
              type="button"
              class="starterCard"
              v-show="isStarterVisible('flowchart', $t('home.starterFlowIncident'), $t('home.starterFlowIncidentDesc'))"
              :disabled="busy"
              @click="createFlowchartFromTemplate('incident')"
            >
              <strong>{{ $t('home.starterFlowIncident') }}</strong>
              <span>{{ $t('home.starterFlowIncidentDesc') }}</span>
            </button>
            <button
              type="button"
              class="starterCard"
              v-show="isStarterVisible('flowchart', $t('home.starterFlowJourney'), $t('home.starterFlowJourneyDesc'))"
              :disabled="busy"
              @click="createFlowchartFromTemplate('customerJourney')"
            >
              <strong>{{ $t('home.starterFlowJourney') }}</strong>
              <span>{{ $t('home.starterFlowJourneyDesc') }}</span>
            </button>
          </div>
            <div v-if="!hasVisibleStarters" class="starterEmpty">
              {{ $t('home.starterEmpty') }}
            </div>
        </section>

        <header class="mainHeader">
          <h2>{{ $t('home.recentTitle') }}</h2>
          <div class="headerActions">
            <button
              type="button"
              class="themeModeToggle"
              :aria-label="themeToggleLabel"
              :title="themeToggleLabel"
              :disabled="busy"
              @click="toggleAppearance"
            >
              <span class="themeModeToggleIcon" aria-hidden="true">
                <svg v-if="isDark" viewBox="0 0 24 24">
                  <path
                    d="M18 14.5A7.5 7.5 0 0 1 9.5 6a8 8 0 1 0 8.5 8.5Z"
                  ></path>
                </svg>
                <svg v-else viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="4"></circle>
                  <path d="M12 2v2.5"></path>
                  <path d="M12 19.5V22"></path>
                  <path d="m4.9 4.9 1.8 1.8"></path>
                  <path d="m17.3 17.3 1.8 1.8"></path>
                  <path d="M2 12h2.5"></path>
                  <path d="M19.5 12H22"></path>
                  <path d="m4.9 19.1 1.8-1.8"></path>
                  <path d="m17.3 6.7 1.8-1.8"></path>
                </svg>
              </span>
              <span>{{ isDark ? $t('theme.dark') : $t('theme.light') }}</span>
            </button>
            <button
              type="button"
              class="textButton"
              :disabled="busy || recentFiles.length <= 0"
              @click="clearRecents"
            >
              {{ $t('home.clearRecents') }}
            </button>
          </div>
        </header>

        <div v-if="recentFiles.length > 0" class="recentList">
          <button
            v-for="item in recentFiles"
            :key="item.path"
            type="button"
            class="recentItem"
            :disabled="busy"
            @click="openRecent(item)"
          >
            <div class="recentMain">
              <div class="recentTitleRow">
                <strong>{{ resolveRecentTitle(item) }}</strong>
                <em class="recentMode">
                  {{
                    item.documentMode === 'flowchart'
                      ? $t('home.documentModeFlowchart')
                      : $t('home.documentModeMindmap')
                  }}
                </em>
              </div>
              <span>{{ item.path }}</span>
            </div>
            <div class="recentSide">
              <time class="recentMeta">{{ formatUpdatedAt(item.updatedAt) }}</time>
              <button
                type="button"
                class="recentRemoveBtn"
                :title="$t('home.removeRecent')"
                @click.stop="removeRecent(item)"
              >
                ×
              </button>
            </div>
          </button>
        </div>

        <div v-else class="emptyState">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="3" y1="9" x2="21" y2="9"></line>
            <line x1="9" y1="21" x2="9" y2="9"></line>
          </svg>
          <p>{{ $t('home.emptyTitle') }}</p>
        </div>

      </main>
    </div>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { useEditorStore } from '@/stores/editor'
import { useThemeStore } from '@/stores/theme'
import { createDefaultMindMapData } from '@/platform/shared/configSchema'
import {
  getPreferredMindMapThemeValue,
  toggleThemeMode
} from '@/stores/runtime'

let workspaceActionsPromise = null

const loadWorkspaceActions = async () => {
  if (!workspaceActionsPromise) {
    workspaceActionsPromise = import('@/services/workspaceActions')
      .catch(error => {
        workspaceActionsPromise = null
        throw error
      })
  }
  return workspaceActionsPromise
}

export default {
  name: 'HomePage',
  data() {
    return {
      starterKeyword: '',
      starterCategory: 'all',
      recentStarterKeys: [],
      busy: false,
      homeRefreshFrame: 0,
      homeRefreshTimer: 0,
      workspaceWarmupTimer: 0
    }
  },
  computed: {
    starterSectionTitle() {
      if (this.starterCategory === 'mindmap') return this.$t('home.starterCategoryMindmap')
      if (this.starterCategory === 'flowchart') return this.$t('home.starterCategoryFlowchart')
      return this.$t('home.starterCategoryAll')
    },
    starterCategoryCounts() {
      return {
        all: 25,
        mindmap: 17,
        flowchart: 8
      }
    },
    hasVisibleStarters() {
      const labels = [
        ['mindmap', 'home.starterMindMapBlank', 'home.starterMindMapBlankDesc'],
        ['mindmap', 'home.starterMindMapOrg', 'home.starterMindMapOrgDesc'],
        ['mindmap', 'home.starterMindMapTree', 'home.starterMindMapTreeDesc'],
        ['mindmap', 'home.starterMindMapMeeting', 'home.starterMindMapMeetingDesc'],
        ['mindmap', 'home.starterMindMapProject', 'home.starterMindMapProjectDesc'],
        ['mindmap', 'home.starterMindMapLearning', 'home.starterMindMapLearningDesc'],
        ['mindmap', 'home.starterMindMapReview', 'home.starterMindMapReviewDesc'],
        ['mindmap', 'home.starterMindMapOkr', 'home.starterMindMapOkrDesc'],
        ['mindmap', 'home.starterMindMapWeekly', 'home.starterMindMapWeeklyDesc'],
        ['mindmap', 'home.starterMindMapInterview', 'home.starterMindMapInterviewDesc'],
        ['mindmap', 'home.starterMindMapReading', 'home.starterMindMapReadingDesc'],
        ['mindmap', 'home.starterMindMapBusiness', 'home.starterMindMapBusinessDesc'],
        ['mindmap', 'home.starterMindMapKnowledge', 'home.starterMindMapKnowledgeDesc'],
        ['mindmap', 'home.starterMindMapCompetitor', 'home.starterMindMapCompetitorDesc'],
        ['mindmap', 'home.starterMindMapRetro', 'home.starterMindMapRetroDesc'],
        ['mindmap', 'home.starterMindMapRoadmap', 'home.starterMindMapRoadmapDesc'],
        ['mindmap', 'home.starterMindMapContent', 'home.starterMindMapContentDesc'],
        ['flowchart', 'home.starterFlowApproval', 'home.starterFlowApprovalDesc'],
        ['flowchart', 'home.starterFlowRelease', 'home.starterFlowReleaseDesc'],
        ['flowchart', 'home.starterFlowEnterprise', 'home.starterFlowEnterpriseDesc'],
        ['flowchart', 'home.starterFlowSupport', 'home.starterFlowSupportDesc'],
        ['flowchart', 'home.starterFlowSales', 'home.starterFlowSalesDesc'],
        ['flowchart', 'home.starterFlowReviewFlow', 'home.starterFlowReviewFlowDesc'],
        ['flowchart', 'home.starterFlowIncident', 'home.starterFlowIncidentDesc'],
        ['flowchart', 'home.starterFlowJourney', 'home.starterFlowJourneyDesc']
      ]
      return labels.some(([category, titleKey, descKey]) =>
        this.isStarterVisible(category, this.$t(titleKey), this.$t(descKey))
      )
    },
    ...mapState(useEditorStore, {
      recentFiles: 'recentFiles',
      resumeEntry: 'resumeEntry',
      hasResumeEntry: 'hasResumeEntry',
      hasDirtyDraft: 'hasDirtyDraft'
    }),
    ...mapState(useThemeStore, {
      isDark: 'isDark'
    }),
    themeToggleLabel() {
      return this.isDark
        ? this.$t('navigatorToolbar.lightMode')
        : this.$t('navigatorToolbar.darkMode')
    }
  },
  mounted() {
    this.loadRecentStarters()

    this.scheduleRefreshHomeData()
    this.scheduleWarmupWorkspaceActions()
  },
  beforeUnmount() {
    this.clearHomeRefreshTask()
    this.clearWorkspaceWarmupTask()
  },
  methods: {
    clearHomeRefreshTask() {
      if (this.homeRefreshFrame) {
        cancelAnimationFrame(this.homeRefreshFrame)
        this.homeRefreshFrame = 0
      }
      if (this.homeRefreshTimer) {
        clearTimeout(this.homeRefreshTimer)
        this.homeRefreshTimer = 0
      }
    },

    clearWorkspaceWarmupTask() {
      if (this.workspaceWarmupTimer) {
        clearTimeout(this.workspaceWarmupTimer)
        this.workspaceWarmupTimer = 0
      }
    },

    scheduleRefreshHomeData() {
      this.clearHomeRefreshTask()
      this.homeRefreshFrame = requestAnimationFrame(() => {
        this.homeRefreshFrame = 0
        this.homeRefreshTimer = window.setTimeout(() => {
          this.homeRefreshTimer = 0
          void this.refreshHomeData()
        }, 80)
      })
    },

    scheduleWarmupWorkspaceActions() {
      this.clearWorkspaceWarmupTask()
      this.workspaceWarmupTimer = window.setTimeout(() => {
        this.workspaceWarmupTimer = 0
        void loadWorkspaceActions().catch(error => {
          console.warn('warmup workspace actions failed', error)
        })
      }, 160)
    },

    async refreshHomeData() {
      const { refreshWorkspaceRecentFiles } = await loadWorkspaceActions()
      refreshWorkspaceRecentFiles()
    },

    resolveRecentTitle(item) {
      const name = String(item?.name || '').trim()
      return name ? name.replace(/\.[^.]+$/u, '') : this.$t('home.untitledProject')
    },

    formatUpdatedAt(updatedAt) {
      if (!updatedAt) {
        return this.$t('home.justNow')
      }
      try {
        return new Intl.DateTimeFormat('zh-CN', {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }).format(updatedAt)
      } catch (error) {
        console.error('formatUpdatedAt failed', error)
        return this.$t('home.recentlyUsed')
      }
    },

    async runWorkspaceAction(action) {
      if (this.busy) return
      this.busy = true
      try {
        await action()
        await this.refreshHomeData()
      } catch (error) {
        console.error('workspace action failed', error)
        this.$message.error(error?.message || this.$t('home.actionFailed'))
      } finally {
        this.busy = false
      }
    },

    async createBlankProject() {
      await this.runWorkspaceAction(async () => {
        const { createWorkspaceLocalFile } = await loadWorkspaceActions()
        return createWorkspaceLocalFile({
          router: this.$router,
          content: this.createBlankProjectContent()
        })
      })
    },

    async createBlankFlowchartProject(templateId = 'blank') {
      await this.runWorkspaceAction(async () => {
        const { createWorkspaceFlowchartFile } = await loadWorkspaceActions()
        return createWorkspaceFlowchartFile({
          router: this.$router,
          templateId,
          suggestedName:
            templateId === 'blank' ? '流程图' : this.$t('home.createFlowchart')
        })
      })
    },

    async createFlowchart() {
      await this.createBlankFlowchartProject('blank')
    },

    async createFlowchartFromTemplate(templateId = 'blank') {
      this.rememberStarter('flowchart:' + templateId)
      await this.createBlankFlowchartProject(templateId)
    },

    async openLocalFile() {
      await this.runWorkspaceAction(async () => {
        const { openWorkspaceLocalFile } = await loadWorkspaceActions()
        return openWorkspaceLocalFile(this.$router)
      })
    },

    async openLocalDirectory() {
      await this.runWorkspaceAction(async () => {
        const { openWorkspaceDirectory } = await loadWorkspaceActions()
        const result = await openWorkspaceDirectory()
        if (!result) return
        this.$message.success(this.$t('home.workspaceRecorded'))
      })
    },

    async continueWorkspace() {
      await this.runWorkspaceAction(async () => {
        const { resumeWorkspaceSession } = await loadWorkspaceActions()
        return resumeWorkspaceSession(this.$router)
      })
    },

    async openRecent(item) {
      await this.runWorkspaceAction(async () => {
        const { openWorkspaceRecentFile } = await loadWorkspaceActions()
        return openWorkspaceRecentFile(item, this.$router)
      })
    },

    async removeRecent(item) {
      if (!item?.path) return
      await this.runWorkspaceAction(async () => {
        const { removeWorkspaceRecentFile } = await loadWorkspaceActions()
        await removeWorkspaceRecentFile(item)
      })
    },

    async clearRecents() {
      if (this.recentFiles.length <= 0) return
      try {
        await this.$confirm(
          this.$t('home.clearRecentsConfirmMessage'),
          this.$t('home.clearRecentsConfirmTitle'),
          {
            type: 'warning'
          }
        )
      } catch (_error) {
        return
      }
      await this.runWorkspaceAction(async () => {
        const { clearWorkspaceRecentFiles } = await loadWorkspaceActions()
        await clearWorkspaceRecentFiles()
      })
    },

    isStarterVisible(category, ...labels) {
      if (this.starterCategory !== 'all' && category !== this.starterCategory) {
        return false
      }
      const keyword = String(this.starterKeyword || '')
        .trim()
        .toLowerCase()
      if (!keyword) return true
      return labels.some(label =>
        String(label || '')
          .toLowerCase()
          .includes(keyword)
      )
    },

    createBlankProjectContent(layout) {
      const themeTemplate = getPreferredMindMapThemeValue(!!this.isDark)
      return createDefaultMindMapData('思维导图', themeTemplate, layout)
    },

    createSeededMindMapData(layout = 'logicalStructure') {
      const data = this.createBlankProjectContent(layout)
      const rootText =
        layout === 'organizationStructure'
          ? '组织架构'
          : layout === 'mindMap'
            ? '中心主题'
            : '思维导图'
      data.root.data.text = rootText
      data.root.children = [
        {
          data: { text: layout === 'organizationStructure' ? '部门 A' : '分支一' },
          children: [
            { data: { text: layout === 'organizationStructure' ? '成员 A1' : '要点 1' }, children: [] },
            { data: { text: layout === 'organizationStructure' ? '成员 A2' : '要点 2' }, children: [] }
          ]
        },
        {
          data: { text: layout === 'organizationStructure' ? '部门 B' : '分支二' },
          children: [
            { data: { text: layout === 'organizationStructure' ? '成员 B1' : '要点 3' }, children: [] }
          ]
        },
        {
          data: { text: layout === 'organizationStructure' ? '部门 C' : '分支三' },
          children: []
        }
      ]
      return data
    },

    async createMindMapWithLayout(layout = 'logicalStructure') {
      this.rememberStarter('mindmap-layout:' + layout)
      await this.runWorkspaceAction(async () => {
        const { createWorkspaceLocalFile } = await loadWorkspaceActions()
        return createWorkspaceLocalFile({
          router: this.$router,
          content: this.createSeededMindMapData(layout)
        })
      })
    },

    createScenarioMindMapData(scenario = 'meeting') {
      const layout =
        scenario === 'project' || scenario === 'okr'
          ? 'organizationStructure'
          : 'mindMap'
      const data = this.createBlankProjectContent(layout)
      if (scenario === 'project') {
        data.root.data.text = '项目计划'
        data.root.children = [
          {
            data: { text: '目标与范围' },
            children: [
              { data: { text: '成功标准' }, children: [] },
              { data: { text: '非目标' }, children: [] }
            ]
          },
          {
            data: { text: '里程碑' },
            children: [
              { data: { text: '方案评审' }, children: [] },
              { data: { text: '开发完成' }, children: [] },
              { data: { text: '上线发布' }, children: [] }
            ]
          },
          {
            data: { text: '风险与依赖' },
            children: [
              { data: { text: '资源风险' }, children: [] },
              { data: { text: '外部依赖' }, children: [] }
            ]
          }
        ]
        return data
      }
      if (scenario === 'learning') {
        data.root.data.text = '学习计划'
        data.root.children = [
          {
            data: { text: '学习目标' },
            children: [
              { data: { text: '核心概念' }, children: [] },
              { data: { text: '可交付成果' }, children: [] }
            ]
          },
          {
            data: { text: '学习路径' },
            children: [
              { data: { text: '基础' }, children: [] },
              { data: { text: '进阶' }, children: [] },
              { data: { text: '实践项目' }, children: [] }
            ]
          },
          {
            data: { text: '复盘节奏' },
            children: [
              { data: { text: '每周回顾' }, children: [] },
              { data: { text: '错题/问题本' }, children: [] }
            ]
          }
        ]
        return data
      }
      if (scenario === 'review') {
        data.root.data.text = '复盘总结'
        data.root.children = [
          {
            data: { text: '目标回顾' },
            children: [
              { data: { text: '预期结果' }, children: [] },
              { data: { text: '实际结果' }, children: [] }
            ]
          },
          {
            data: { text: '过程分析' },
            children: [
              { data: { text: '做得好的' }, children: [] },
              { data: { text: '可改进的' }, children: [] }
            ]
          },
          {
            data: { text: '行动项' },
            children: [
              { data: { text: '立即行动' }, children: [] },
              { data: { text: '下周期计划' }, children: [] }
            ]
          }
        ]
        return data
      }
      if (scenario === 'okr') {
        data.root.data.text = 'OKR'
        data.root.children = [
          {
            data: { text: 'O1 核心目标' },
            children: [
              { data: { text: 'KR1 可量化结果' }, children: [] },
              { data: { text: 'KR2 可量化结果' }, children: [] },
              { data: { text: 'KR3 可量化结果' }, children: [] }
            ]
          },
          {
            data: { text: 'O2 支撑目标' },
            children: [
              { data: { text: 'KR1 可量化结果' }, children: [] },
              { data: { text: 'KR2 可量化结果' }, children: [] }
            ]
          }
        ]
        return data
      }
      if (scenario === 'weekly') {
        data.root.data.text = '周报'
        data.root.children = [
          {
            data: { text: '本周进展' },
            children: [
              { data: { text: '已完成' }, children: [] },
              { data: { text: '进行中' }, children: [] }
            ]
          },
          {
            data: { text: '风险阻塞' },
            children: [
              { data: { text: '风险项' }, children: [] },
              { data: { text: '需要支持' }, children: [] }
            ]
          },
          {
            data: { text: '下周计划' },
            children: [
              { data: { text: '优先事项' }, children: [] },
              { data: { text: '时间安排' }, children: [] }
            ]
          }
        ]
        return data
      }
      if (scenario === 'interview') {
        data.root.data.text = '面试准备'
        data.root.children = [
          {
            data: { text: '岗位理解' },
            children: [
              { data: { text: '职责重点' }, children: [] },
              { data: { text: '能力要求' }, children: [] }
            ]
          },
          {
            data: { text: '项目故事' },
            children: [
              { data: { text: '背景与目标' }, children: [] },
              { data: { text: '行动与结果' }, children: [] }
            ]
          },
          {
            data: { text: '问答清单' },
            children: [
              { data: { text: '高频问题' }, children: [] },
              { data: { text: '反问问题' }, children: [] }
            ]
          }
        ]
        return data
      }
      if (scenario === 'reading') {
        data.root.data.text = '读书笔记'
        data.root.children = [
          {
            data: { text: '核心观点' },
            children: [
              { data: { text: '观点 1' }, children: [] },
              { data: { text: '观点 2' }, children: [] }
            ]
          },
          {
            data: { text: '金句摘录' },
            children: [
              { data: { text: '摘录 1' }, children: [] }
            ]
          },
          {
            data: { text: '行动启发' },
            children: [
              { data: { text: '可落地行动' }, children: [] },
              { data: { text: '关联项目' }, children: [] }
            ]
          }
        ]
        return data
      }
      if (scenario === 'business') {
        data.root.data.text = '商业计划'
        data.root.children = [
          {
            data: { text: '市场与用户' },
            children: [
              { data: { text: '目标用户' }, children: [] },
              { data: { text: '核心痛点' }, children: [] }
            ]
          },
          {
            data: { text: '产品方案' },
            children: [
              { data: { text: '价值主张' }, children: [] },
              { data: { text: '关键功能' }, children: [] }
            ]
          },
          {
            data: { text: '增长与商业' },
            children: [
              { data: { text: '获客路径' }, children: [] },
              { data: { text: '收入模型' }, children: [] }
            ]
          },
          {
            data: { text: '里程碑' },
            children: [
              { data: { text: 'MVP' }, children: [] },
              { data: { text: '验证目标' }, children: [] }
            ]
          }
        ]
        return data
      }
      if (scenario === 'knowledge') {
        data.root.data.text = '知识管理'
        data.root.children = [
          {
            data: { text: '知识采集' },
            children: [
              { data: { text: '来源清单' }, children: [] },
              { data: { text: '摘录规范' }, children: [] }
            ]
          },
          {
            data: { text: '知识整理' },
            children: [
              { data: { text: '主题分类' }, children: [] },
              { data: { text: '标签体系' }, children: [] }
            ]
          },
          {
            data: { text: '知识应用' },
            children: [
              { data: { text: '复用场景' }, children: [] },
              { data: { text: '输出作品' }, children: [] }
            ]
          }
        ]
        return data
      }
      if (scenario === 'competitor') {
        data.root.data.text = '竞品分析'
        data.root.children = [
          {
            data: { text: '竞品画像' },
            children: [
              { data: { text: '定位与客群' }, children: [] },
              { data: { text: '核心卖点' }, children: [] }
            ]
          },
          {
            data: { text: '能力对比' },
            children: [
              { data: { text: '优势' }, children: [] },
              { data: { text: '劣势' }, children: [] }
            ]
          },
          {
            data: { text: '策略启发' },
            children: [
              { data: { text: '可借鉴点' }, children: [] },
              { data: { text: '差异化机会' }, children: [] }
            ]
          }
        ]
        return data
      }
      if (scenario === 'retro') {
        data.root.data.text = '复盘会'
        data.root.children = [
          {
            data: { text: '目标与结果' },
            children: [
              { data: { text: '预期' }, children: [] },
              { data: { text: '实际' }, children: [] }
            ]
          },
          {
            data: { text: '过程观察' },
            children: [
              { data: { text: 'Keep' }, children: [] },
              { data: { text: 'Problem' }, children: [] },
              { data: { text: 'Try' }, children: [] }
            ]
          },
          {
            data: { text: '行动项' },
            children: [
              { data: { text: '负责人' }, children: [] },
              { data: { text: '截止时间' }, children: [] }
            ]
          }
        ]
        return data
      }
      if (scenario === 'roadmap') {
        data.root.data.text = '产品路线图'
        data.root.children = [
          {
            data: { text: 'Now' },
            children: [
              { data: { text: 'P0 功能' }, children: [] },
              { data: { text: '体验修复' }, children: [] }
            ]
          },
          {
            data: { text: 'Next' },
            children: [
              { data: { text: '增长能力' }, children: [] },
              { data: { text: '平台能力' }, children: [] }
            ]
          },
          {
            data: { text: 'Later' },
            children: [{ data: { text: '探索方向' }, children: [] }]
          }
        ]
        return data
      }
      if (scenario === 'content') {
        data.root.data.text = '内容日历'
        data.root.children = [
          {
            data: { text: '本周选题' },
            children: [
              { data: { text: '主题 A' }, children: [] },
              { data: { text: '主题 B' }, children: [] }
            ]
          },
          {
            data: { text: '生产安排' },
            children: [
              { data: { text: '撰稿' }, children: [] },
              { data: { text: '设计' }, children: [] },
              { data: { text: '发布' }, children: [] }
            ]
          },
          {
            data: { text: '复盘指标' },
            children: [
              { data: { text: '阅读/互动' }, children: [] },
              { data: { text: '转化' }, children: [] }
            ]
          }
        ]
        return data
      }
      data.root.data.text = '会议纪要'
      data.root.children = [
        {
          data: { text: '议题' },
          children: [
            { data: { text: '议题 1' }, children: [] },
            { data: { text: '议题 2' }, children: [] }
          ]
        },
        {
          data: { text: '决议' },
          children: [{ data: { text: '决议 1' }, children: [] }]
        },
        {
          data: { text: '待办' },
          children: [{ data: { text: '负责人 / 截止时间' }, children: [] }]
        }
      ]
      return data
    },

    async createMindMapScenario(scenario = 'meeting') {
      this.rememberStarter('mindmap:' + scenario)
      await this.runWorkspaceAction(async () => {
        const { createWorkspaceLocalFile } = await loadWorkspaceActions()
        return createWorkspaceLocalFile({
          router: this.$router,
          content: this.createScenarioMindMapData(scenario)
        })
      })
    },

    async toggleAppearance() {
      if (this.busy) return
      try {
        await toggleThemeMode()
      } catch (error) {
        console.error('toggleAppearance failed', error)
        this.$message.error(error?.message || this.$t('home.actionFailed'))
      }
    }
  }
}
</script>

<style lang="less" scoped>
.homePage {
  min-height: 100vh;
  background: #fff;
  color: #111827;
  display: flex;
  flex-direction: column;

  &.isDark {
    background:
      radial-gradient(circle at top left, rgba(64, 158, 255, 0.08), transparent 28%),
      #171a1f;
    color: hsla(0, 0%, 100%, 0.88);

    .workspaceSidebar {
      background: rgba(28, 32, 38, 0.92);
      border-right-color: hsla(0, 0%, 100%, 0.08);
      box-shadow: inset -1px 0 0 hsla(0, 0%, 100%, 0.04);
    }

    .sidebarMeta {
      color: hsla(0, 0%, 100%, 0.46);

      &::before {
        background: rgba(64, 158, 255, 0.72);
      }
    }

    .resumeMain span,
    .resumeEmpty p,
    .recentMain span,
    .recentMeta,
    .textButton,
    .emptyState p {
      color: hsla(0, 0%, 100%, 0.56);
    }

    .workspaceMain {
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.02), transparent 20%),
        transparent;
    }

    .themeModeToggle {
      background: rgba(255, 255, 255, 0.04);
      border-color: hsla(0, 0%, 100%, 0.08);
      color: hsla(0, 0%, 100%, 0.9);

      &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.08);
        border-color: hsla(0, 0%, 100%, 0.12);
      }
    }

    .primaryAction {
      background: #409eff;

      &:hover:not(:disabled) {
        background: #67b1ff;
      }
    }

    .secondaryAction {
      background: rgba(255, 255, 255, 0.05);
      color: hsla(0, 0%, 100%, 0.92);

      &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.08);
      }
    }

    .actionItem {
      &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.05);
      }
    }

    .actionIcon,
    .recentMode {
      color: hsla(0, 0%, 100%, 0.42);
    }

    .actionText strong,
    .resumeHeader h2,
    .resumeMain strong,
    .resumeAction,
    .mainHeader h2,
    .recentMain strong,
    .textButton:hover:not(:disabled) {
      color: hsla(0, 0%, 100%, 0.92);
    }

    .mainHeader {
      border-bottom-color: hsla(0, 0%, 100%, 0.08);
    }

    .resumeCard {
      background: rgba(255, 255, 255, 0.02);
      border-color: hsla(0, 0%, 100%, 0.08);

      &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.04);
        border-color: hsla(0, 0%, 100%, 0.14);
      }
    }

    .resumeEmpty {
      border-color: hsla(0, 0%, 100%, 0.1);
    }

    .dirtyBadge {
      background: rgba(251, 191, 36, 0.18);
      color: #fcd34d;
    }

    .recentSide {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}
.recentRemoveBtn {
  width: 24px;
  height: 24px;
  border: 0;
  border-radius: 999px;
  background: rgba(15,23,42,0.06);
  color: inherit;
  cursor: pointer;
  line-height: 1;
}
.recentRemoveBtn:hover {
  background: rgba(220,38,38,0.12);
  color: #b91c1c;
}
.recentItem {
      border-bottom-color: hsla(0, 0%, 100%, 0.08);

      &:hover:not(:disabled) {
        .recentMain strong {
          color: #fff;
        }
      }
    }

    .emptyState svg {
      stroke: hsla(0, 0%, 100%, 0.12);
    }
  }
}

.workspaceShell {
  min-height: 100vh;
  display: flex;
}

.workspaceSidebar {
  width: 320px;
  padding: 48px 32px;
  border-right: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.sidebarMeta {
  font-size: 11px;
  font-weight: 600;
  color: #9ca3af;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: 12px;

  &::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #9ca3af;
    display: inline-block;
  }
}

.sidebarIntro {
  margin-bottom: 48px;

  h1 {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 0;
    letter-spacing: -0.03em;
  }
}

.actionList {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.primaryAction {
  width: 100%;
  border: none;
  border-radius: 6px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #000;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
  margin-bottom: 8px;

  svg {
    width: 16px;
    height: 16px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  &:hover:not(:disabled) {
    background: #333;
  }

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
}

.secondaryAction {
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #f8fafc;
  color: #111827;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
  margin-bottom: 16px;

  svg {
    width: 16px;
    height: 16px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  &:hover:not(:disabled) {
    background: #eef2f7;
  }

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
}

.actionItem {
  border: none;
  background: transparent;
  border-radius: 6px;
  padding: 12px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover:not(:disabled) {
    background: #f9fafb;
  }

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
}

.actionIcon {
  color: #4b5563;
  margin-top: 2px;

  svg {
    width: 18px;
    height: 18px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.5;
    stroke-linecap: round;
    stroke-linejoin: round;
    display: block;
  }
}

.actionText {
  strong {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: #111827;
  }
}

.workspaceMain {
  flex: 1;
  padding: 48px 64px;
  display: flex;
  flex-direction: column;
  background: #fff;
  gap: 32px;
}

.starterSection {
  margin-bottom: 22px;
}
.recentStarterChips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin: 0 0 12px;
}
.recentStarterLabel {
  font-size: 12px;
  color: #737373;
}
.recentStarterChip {
  height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid rgba(15,23,42,0.1);
  background: rgba(37,99,235,0.08);
  color: inherit;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
}
.homePage.isDark .recentStarterLabel {
  color: rgba(255,255,255,0.55);
}
.homePage.isDark .recentStarterChip {
  border-color: rgba(255,255,255,0.12);
}
.starterSectionTitle {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 600;
  color: #525252;
}
.homePage.isDark .starterSectionTitle {
  color: rgba(255,255,255,0.7);
}
.starterGrid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.starterCard {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  min-height: 92px;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.8);
  color: inherit;
  text-align: left;
  cursor: pointer;
  font: inherit;
}
.starterCard:hover {
  border-color: rgba(0, 117, 222, 0.28);
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
}
.starterCard strong {
  font-size: 14px;
}
.starterCard span {
  color: #737373;
  font-size: 12px;
  line-height: 1.4;
}
.homePage.isDark .starterCard {
  background: rgba(24, 28, 34, 0.88);
  border-color: rgba(255, 255, 255, 0.08);
}
.homePage.isDark .starterCard span {
  color: rgba(255, 255, 255, 0.56);
}
@media (max-width: 900px) {
  .starterGrid {
    grid-template-columns: 1fr;
  }
}
.resumeSection {
  margin-bottom: 0;
}

.resumeHeader {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;

  h2 {
    font-size: 16px;
    font-weight: 500;
    color: #111827;
  }
}

.dirtyBadge {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  background: rgba(245, 158, 11, 0.14);
  color: #b45309;
  font-size: 12px;
  font-weight: 500;
}

.resumeCard {
  width: 100%;
  padding: 16px 18px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease;

  &:hover:not(:disabled) {
    border-color: #d1d5db;
    background: #fafafa;
  }

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
}

.resumeMain {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;

  strong {
    font-size: 15px;
    font-weight: 500;
    color: #111827;
  }

  span {
    font-size: 12px;
    color: #6b7280;
    word-break: break-all;
  }
}

.resumeAction {
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 500;
  color: #111827;
}

.resumeEmpty {
  padding: 16px 18px;
  border: 1px dashed #e5e7eb;
  border-radius: 6px;

  p {
    font-size: 13px;
    color: #9ca3af;
  }
}

.mainHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 0;

  h2 {
    font-size: 16px;
    font-weight: 500;
    color: #111827;
  }
}

.headerActions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.themeModeToggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 34px;
  padding: 0 12px;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  background: #fff;
  color: #111827;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease;

  &:hover:not(:disabled) {
    border-color: #d1d5db;
    background: #f9fafb;
    transform: translateY(-1px);
  }

  &:disabled {
    cursor: default;
    opacity: 0.5;
  }
}

.themeModeToggleIcon {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 14px;
    height: 14px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.9;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
}

.textButton {
  border: none;
  background: transparent;
  color: #9ca3af;
  font-size: 13px;
  cursor: pointer;
  transition: color 0.2s ease;

  &:hover:not(:disabled) {
    color: #111827;
  }

  &:disabled {
    cursor: default;
    opacity: 0.5;
  }
}

.recentList {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: -20px;
}

.recentItem {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  padding: 14px 0;
  border: none;
  border-bottom: 1px solid #f3f4f6;
  background: transparent;
  cursor: pointer;
  text-align: left;

  &:hover:not(:disabled) {
    .recentMain strong {
      color: #000;
    }
  }

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
}

.recentMain {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;

  strong {
    font-size: 15px;
    font-weight: 500;
    color: #111827;
  }

  span {
    font-size: 12px;
    color: #9ca3af;
    word-break: break-all;
  }
}

.recentTitleRow {
  display: flex;
  align-items: center;
  gap: 8px;
}

.recentMode {
  font-style: normal;
  font-size: 11px;
  line-height: 1;
  padding: 4px 6px;
  border-radius: 999px;
  background: #f3f4f6;
  color: #6b7280;
}

.recentMeta {
  flex-shrink: 0;
  font-size: 12px;
  color: #9ca3af;
}

.emptyState {
  min-height: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;

  svg {
    width: 48px;
    height: 48px;
    fill: none;
    stroke: #f0f0f0;
    stroke-width: 1;
    stroke-linecap: round;
    stroke-linejoin: round;
    margin-bottom: 16px;
  }

  p {
    font-size: 14px;
    color: #9ca3af;
  }
}

@media (max-width: 980px) {
  .workspaceShell {
    flex-direction: column;
  }

  .workspaceSidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #f0f0f0;
  }

}

@media (max-width: 720px) {
  .workspaceSidebar,
  .workspaceMain {
    padding: 20px;
  }

  .mainHeader {
    flex-direction: column;
    align-items: stretch;
  }

  .recentItem {
    flex-direction: column;
    align-items: flex-start;
  }

  .resumeCard {
    flex-direction: column;
    align-items: flex-start;
  }

  .workspaceMain {
    gap: 24px;
  }
}
</style>
