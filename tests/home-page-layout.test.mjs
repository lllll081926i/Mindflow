import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const homePagePath = path.resolve('src/pages/Home/Index.vue')
const langPath = path.resolve('src/lang/index.js')

test('桌面工作台首页存在并展示核心入口', () => {
  assert.equal(fs.existsSync(homePagePath), true)
  const source = fs.readFileSync(homePagePath, 'utf8')

  assert.match(source, /\$t\('home\.continueTitle'\)/)
  assert.match(source, /\$t\('home\.continueAction'\)/)
  assert.match(source, /\$t\('home\.createNew'\)/)
  assert.match(source, /\$t\('home\.createFlowchart'\)/)
  assert.match(source, /\$t\('home\.openLocalFile'\)/)
  assert.match(source, /\$t\('home\.openLocalFolder'\)/)
  assert.match(source, /\$t\('home\.recentTitle'\)/)
  assert.match(source, /\$t\('home\.clearRecents'\)/)
})

test('桌面工作台首页不展示会员入口', () => {
  const source = fs.readFileSync(homePagePath, 'utf8')
  assert.equal(/会员|vip|VIP/.test(source), false)
})

test('桌面工作台首页不再提供设置视图入口', () => {
  const source = fs.readFileSync(homePagePath, 'utf8')
  assert.doesNotMatch(source, /WorkspaceSettings/)
  assert.doesNotMatch(source, /toggleSettings/)
  assert.doesNotMatch(source, /返回工作台/)
})

test('桌面工作台首页核心文案接入国际化', () => {
  const source = fs.readFileSync(homePagePath, 'utf8')
  assert.match(source, /\$t\('home\.brandTitle'\)/)
  assert.match(source, /\$t\('home\.continueEmpty'\)/)
  assert.match(source, /\$t\('home\.openLocalFile'\)/)
  assert.match(source, /\$t\('home\.recentTitle'\)/)
  assert.match(source, /\$t\('home\.emptyTitle'\)/)
  assert.match(source, /\$t\('navigatorToolbar\.darkMode'\)/)
  assert.match(source, /\$t\('navigatorToolbar\.lightMode'\)/)
})

test('桌面工作台首页已移除附加说明文案', () => {
  const source = fs.readFileSync(homePagePath, 'utf8')
  assert.doesNotMatch(source, /\$t\('home\.brandDescription'\)/)
  assert.doesNotMatch(source, /\$t\('home\.openLocalFileDesc'\)/)
  assert.doesNotMatch(source, /\$t\('home\.openLocalFolderDesc'\)/)
  assert.doesNotMatch(source, /\$t\('home\.resumeReadyHint'\)/)
  assert.doesNotMatch(source, /\$t\('home\.resumeDirtyHint'\)/)
  assert.doesNotMatch(source, /\$t\('home\.currentDirectory'\)/)
  assert.doesNotMatch(source, /class="recentHint"/)
})

test('桌面工作台首页左侧栏宽度加宽并延续编辑页扁平化面板样式', () => {
  const source = fs.readFileSync(homePagePath, 'utf8')
  assert.match(source, /width:\s*320px;/)
  assert.match(source, /display:\s*flex;/)
  assert.match(source, /border-radius:\s*6px;/)
  assert.match(source, /class="resumeCard"/)
})

test('桌面工作台首页已移除工作台信号、上手步骤与体验提示区', () => {
  const source = fs.readFileSync(homePagePath, 'utf8')

  assert.doesNotMatch(source, /class="workspaceSignals"/)
  assert.doesNotMatch(source, /class="signalCard"/)
  assert.doesNotMatch(source, /class="quickStartList"/)
  assert.doesNotMatch(source, /class="quickStartCard"/)
  assert.doesNotMatch(source, /class="experienceGrid"/)
  assert.doesNotMatch(source, /class="experienceCard"/)
  assert.doesNotMatch(source, /\$t\('home\.workspaceSignalsTitle'\)/)
  assert.doesNotMatch(source, /\$t\('home\.quickStartTitle'\)/)
  assert.doesNotMatch(source, /\$t\('home\.experienceTipsTitle'\)/)
  assert.match(source, /scheduleWarmupWorkspaceActions\(\)/)
})

test('桌面工作台首页提供全局明暗主题开关，并沿用思维导图主题记忆能力', () => {
  const source = fs.readFileSync(homePagePath, 'utf8')

  assert.match(source, /class="themeModeToggle"/)
  assert.match(source, /toggleAppearance/)
  assert.match(source, /getPreferredMindMapThemeValue/)
  assert.match(source, /toggleThemeMode/)
  assert.match(source, /createBlankProjectContent/)
  assert.match(source, /createDefaultMindMapData\('思维导图', themeTemplate/)
})

test('桌面工作台首页主题切换文案引用的国际化键完整存在', () => {
  const homeSource = fs.readFileSync(homePagePath, 'utf8')
  const langSource = fs.readFileSync(langPath, 'utf8')

  assert.match(homeSource, /\$t\('theme\.dark'\)/)
  assert.match(homeSource, /\$t\('theme\.light'\)/)
  assert.match(langSource, /"dark":\s*"深色"/)
  assert.match(langSource, /"light":\s*"浅色"/)
})


test('首页提供思维导图与流程图快速开始模板入口', () => {
  const source = fs.readFileSync(path.resolve('src/pages/Home/Index.vue'), 'utf8')
  const langSource = fs.readFileSync(path.resolve('src/lang/index.js'), 'utf8')
  assert.match(source, /starterSection/)
  assert.match(source, /createFlowchartFromTemplate\('approval'\)/)
  assert.match(source, /createFlowchartFromTemplate\('release'\)/)
  assert.match(source, /createFlowchartFromTemplate\('enterpriseDelivery'\)/)
  assert.match(source, /createBlankFlowchartProject\(templateId/)
  assert.match(langSource, /"starterTitle"/)
  assert.match(langSource, /"starterFlowEnterprise"/)
})


test('首页快速开始支持思维导图结构模板', () => {
  const source = fs.readFileSync(path.resolve('src/pages/Home/Index.vue'), 'utf8')
  const schemaSource = fs.readFileSync(
    path.resolve('src/platform/shared/configSchema.js'),
    'utf8'
  )
  const langSource = fs.readFileSync(path.resolve('src/lang/index.js'), 'utf8')
  assert.match(source, /createMindMapWithLayout\('mindMap'\)/)
  assert.match(source, /createMindMapWithLayout\('organizationStructure'\)/)
  assert.match(source, /createBlankProjectContent\(layout\)/)
  assert.match(schemaSource, /layout = DEFAULT_MIND_MAP_LAYOUT/)
  assert.match(langSource, /"starterMindMapOrg"/)
  assert.match(langSource, /"starterMindMapTree"/)
})


test('思维导图结构模板会预置示例分支，打开即可见结构', () => {
  const source = fs.readFileSync(path.resolve('src/pages/Home/Index.vue'), 'utf8')
  assert.match(source, /createSeededMindMapData/)
  assert.match(source, /中心主题|组织架构/)
  assert.match(source, /分支一|部门 A/)
})


test('首页提供会议纪要与项目计划场景模板', () => {
  const source = fs.readFileSync(path.resolve('src/pages/Home/Index.vue'), 'utf8')
  const langSource = fs.readFileSync(path.resolve('src/lang/index.js'), 'utf8')
  assert.match(source, /createMindMapScenario\('meeting'\)/)
  assert.match(source, /createMindMapScenario\('project'\)/)
  assert.match(source, /createScenarioMindMapData/)
  assert.match(langSource, /"starterMindMapMeeting"/)
  assert.match(langSource, /"starterMindMapProject"/)
})


test('首页导图模板中心覆盖学习复盘与 OKR 场景', () => {
  const source = fs.readFileSync(path.resolve('src/pages/Home/Index.vue'), 'utf8')
  const langSource = fs.readFileSync(path.resolve('src/lang/index.js'), 'utf8')
  assert.match(source, /createMindMapScenario\('learning'\)/)
  assert.match(source, /createMindMapScenario\('review'\)/)
  assert.match(source, /createMindMapScenario\('okr'\)/)
  assert.match(langSource, /"starterMindMapLearning"/)
  assert.match(langSource, /"starterMindMapReview"/)
  assert.match(langSource, /"starterMindMapOkr"/)
})


test('首页导图模板中心覆盖周报面试与读书笔记场景', () => {
  const source = fs.readFileSync(path.resolve('src/pages/Home/Index.vue'), 'utf8')
  const langSource = fs.readFileSync(path.resolve('src/lang/index.js'), 'utf8')
  assert.match(source, /createMindMapScenario\('weekly'\)/)
  assert.match(source, /createMindMapScenario\('interview'\)/)
  assert.match(source, /createMindMapScenario\('reading'\)/)
  assert.match(langSource, /"starterMindMapWeekly"/)
  assert.match(langSource, /"starterMindMapInterview"/)
  assert.match(langSource, /"starterMindMapReading"/)
})


test('首页流程图模板中心覆盖升级销售与审核场景', () => {
  const source = fs.readFileSync(path.resolve('src/pages/Home/Index.vue'), 'utf8')
  const langSource = fs.readFileSync(path.resolve('src/lang/index.js'), 'utf8')
  assert.match(source, /createFlowchartFromTemplate\('supportEscalation'\)/)
  assert.match(source, /createFlowchartFromTemplate\('salesPipeline'\)/)
  assert.match(source, /createFlowchartFromTemplate\('contentReview'\)/)
  assert.match(langSource, /"starterFlowSupport"/)
  assert.match(langSource, /"starterFlowSales"/)
  assert.match(langSource, /"starterFlowReviewFlow"/)
})


test('首页导图模板中心覆盖商业计划与知识管理场景', () => {
  const source = fs.readFileSync(path.resolve('src/pages/Home/Index.vue'), 'utf8')
  const langSource = fs.readFileSync(path.resolve('src/lang/index.js'), 'utf8')
  assert.match(source, /createMindMapScenario\('business'\)/)
  assert.match(source, /createMindMapScenario\('knowledge'\)/)
  assert.match(langSource, /"starterMindMapBusiness"/)
  assert.match(langSource, /"starterMindMapKnowledge"/)
})


test('首页导图模板中心覆盖竞品分析与复盘会场景', () => {
  const source = fs.readFileSync(path.resolve('src/pages/Home/Index.vue'), 'utf8')
  const langSource = fs.readFileSync(path.resolve('src/lang/index.js'), 'utf8')
  assert.match(source, /createMindMapScenario\('competitor'\)/)
  assert.match(source, /createMindMapScenario\('retro'\)/)
  assert.match(langSource, /"starterMindMapCompetitor"/)
  assert.match(langSource, /"starterMindMapRetro"/)
})


test('首页模板中心支持搜索，并覆盖产品路线图与内容日历', () => {
  const source = fs.readFileSync(path.resolve('src/pages/Home/Index.vue'), 'utf8')
  const langSource = fs.readFileSync(path.resolve('src/lang/index.js'), 'utf8')
  assert.match(source, /starterKeyword/)
  assert.match(source, /isStarterVisible/)
  assert.match(source, /starterSearch/)
  assert.match(source, /createMindMapScenario\('roadmap'\)/)
  assert.match(source, /createMindMapScenario\('content'\)/)
  assert.match(langSource, /"starterSearchPlaceholder"/)
  assert.match(langSource, /"starterMindMapRoadmap"/)
  assert.match(langSource, /"starterMindMapContent"/)
})


test('首页最近文件支持单项移除', () => {
  const source = fs.readFileSync(path.resolve('src/pages/Home/Index.vue'), 'utf8')
  const actionsSource = fs.readFileSync(
    path.resolve('src/services/workspaceActions.js'),
    'utf8'
  )
  const langSource = fs.readFileSync(path.resolve('src/lang/index.js'), 'utf8')
  assert.match(source, /removeRecent\(/)
  assert.match(source, /recentRemoveBtn/)
  assert.match(actionsSource, /removeWorkspaceRecentFile/)
  assert.match(langSource, /"removeRecent"/)
})


test('首页模板中心支持导图与流程图分类筛选', () => {
  const source = fs.readFileSync(path.resolve('src/pages/Home/Index.vue'), 'utf8')
  const langSource = fs.readFileSync(path.resolve('src/lang/index.js'), 'utf8')
  assert.match(source, /starterCategory/)
  assert.match(source, /starterCategoryChips/)
  assert.match(source, /isStarterVisible\('mindmap'/)
  assert.match(source, /isStarterVisible\('flowchart'/)
  assert.match(langSource, /"starterCategoryAll"/)
  assert.match(langSource, /"starterCategoryMindmap"/)
  assert.match(langSource, /"starterCategoryFlowchart"/)
})


test('首页模板筛选无结果时展示空态提示', () => {
  const source = fs.readFileSync(path.resolve('src/pages/Home/Index.vue'), 'utf8')
  const langSource = fs.readFileSync(path.resolve('src/lang/index.js'), 'utf8')
  assert.match(source, /hasVisibleStarters/)
  assert.match(source, /starterEmpty/)
  assert.match(langSource, /"starterEmpty"/)
})


test('首页模板分类展示数量', () => {
  const source = fs.readFileSync(path.resolve('src/pages/Home/Index.vue'), 'utf8')
  assert.match(source, /starterCategoryCounts/)
  assert.match(source, /starterCategoryCounts.all|starterCategoryCounts.mindmap/)
})


test('首页模板中心展示当前分类标题', () => {
  const source = fs.readFileSync(path.resolve('src/pages/Home/Index.vue'), 'utf8')
  assert.match(source, /starterSectionTitle/)
})


test('首页流程图模板覆盖事故响应与客户旅程', () => {
  const source = fs.readFileSync(path.resolve('src/pages/Home/Index.vue'), 'utf8')
  const langSource = fs.readFileSync(path.resolve('src/lang/index.js'), 'utf8')
  assert.match(source, /createFlowchartFromTemplate\('incident'\)/)
  assert.match(source, /createFlowchartFromTemplate\('customerJourney'\)/)
  assert.match(langSource, /"starterFlowIncident"/)
  assert.match(langSource, /"starterFlowJourney"/)
})


test('首页模板中心记录并展示最近使用模板', () => {
  const source = fs.readFileSync(path.resolve('src/pages/Home/Index.vue'), 'utf8')
  const langSource = fs.readFileSync(path.resolve('src/lang/index.js'), 'utf8')
  assert.match(source, /recentStarterKeys/)
  assert.match(source, /rememberStarter/)
  assert.match(source, /openRecentStarter/)
  assert.match(langSource, /"recentStarters"/)
})


test('首页提供模板中心独立入口', () => {
  const source = fs.readFileSync(path.resolve('src/pages/Home/Index.vue'), 'utf8')
  const routerSource = fs.readFileSync(path.resolve('src/router.js'), 'utf8')
  const templatesSource = fs.readFileSync(
    path.resolve('src/pages/Templates/Index.vue'),
    'utf8'
  )
  const langSource = fs.readFileSync(path.resolve('src/lang/index.js'), 'utf8')
  assert.match(source, /\/templates/)
  assert.match(routerSource, /path: '\/templates'/)
  assert.match(templatesSource, /TemplatesPage|templatesPage/)
  assert.match(langSource, /"templatesCenterTitle"/)
})


test('模板中心与首页共享完整导图场景工厂', () => {
  const factorySource = fs.readFileSync(
    path.resolve('src/services/scenarioMindMapFactory.js'),
    'utf8'
  )
  const homeSource = fs.readFileSync(path.resolve('src/pages/Home/Index.vue'), 'utf8')
  const templatesSource = fs.readFileSync(
    path.resolve('src/pages/Templates/Index.vue'),
    'utf8'
  )
  assert.match(factorySource, /export function createScenarioMindMapData/)
  assert.match(factorySource, /产品路线图|内容日历|竞品分析/)
  assert.match(homeSource, /scenarioMindMapFactory/)
  assert.match(templatesSource, /scenarioMindMapFactory/)
  assert.match(templatesSource, /rememberStarter/)
})


test('首页与模板中心覆盖商业路演与采购流程模板', () => {
  const source = fs.readFileSync(path.resolve('src/pages/Home/Index.vue'), 'utf8')
  const catalog = fs.readFileSync(path.resolve('src/services/templateCatalog.js'), 'utf8')
  const factory = fs.readFileSync(path.resolve('src/services/scenarioMindMapFactory.js'), 'utf8')
  const langSource = fs.readFileSync(path.resolve('src/lang/index.js'), 'utf8')
  assert.match(source, /createMindMapScenario\('pitch'\)/)
  assert.match(source, /createFlowchartFromTemplate\('procurement'\)/)
  assert.match(catalog, /key: 'pitch'/)
  assert.match(catalog, /key: 'procurement'/)
  assert.match(factory, /scenario === 'pitch'/)
  assert.match(langSource, /"starterMindMapPitch"/)
  assert.match(langSource, /"starterFlowProcurement"/)
})


test('首页修复最近模板方法并支持收藏', () => {
  const source = fs.readFileSync(path.resolve('src/pages/Home/Index.vue'), 'utf8')
  const prefs = fs.readFileSync(path.resolve('src/services/starterPrefs.js'), 'utf8')
  const langSource = fs.readFileSync(path.resolve('src/lang/index.js'), 'utf8')
  assert.match(source, /loadRecentStarters\(\) \{/)
  assert.match(source, /rememberStarter\(key\) \{/)
  assert.match(source, /openRecentStarter\(key\) \{/)
  assert.match(source, /favoriteStarterKeys/)
  assert.match(source, /toggleFavoritePref/)
  assert.match(source, /starterFavoriteBtn/)
  assert.match(prefs, /loadFavoriteStarterKeys/)
  assert.match(prefs, /toggleFavoriteStarter/)
  assert.match(langSource, /"favoriteStarters"/)
  assert.match(langSource, /"toggleFavoriteStarter"/)
})

test('首页与模板中心覆盖排障/工单/入职/数据管道等流程模板', () => {
  const source = fs.readFileSync(path.resolve('src/pages/Home/Index.vue'), 'utf8')
  const catalog = fs.readFileSync(path.resolve('src/services/templateCatalog.js'), 'utf8')
  const templatesSource = fs.readFileSync(path.resolve('src/pages/Templates/Index.vue'), 'utf8')
  const langSource = fs.readFileSync(path.resolve('src/lang/index.js'), 'utf8')
  assert.match(source, /createFlowchartFromTemplate\('troubleshooting'\)/)
  assert.match(source, /createFlowchartFromTemplate\('ticket'\)/)
  assert.match(source, /createFlowchartFromTemplate\('onboarding'\)/)
  assert.match(source, /createFlowchartFromTemplate\('dataPipeline'\)/)
  assert.match(source, /createFlowchartFromTemplate\('projectPlan'\)/)
  assert.match(source, /createFlowchartFromTemplate\('crossFunctionalApproval'\)/)
  assert.match(catalog, /key: 'troubleshooting'/)
  assert.match(catalog, /key: 'crossFunctionalApproval'/)
  assert.match(templatesSource, /templateFavoriteBtn/)
  assert.match(templatesSource, /category === 'favorites'/)
  assert.match(langSource, /"starterFlowTroubleshooting"/)
  assert.match(langSource, /"starterFlowCrossApproval"/)
})


test('首页与模板中心收藏按钮具备可访问状态', () => {
  const source = fs.readFileSync(path.resolve('src/pages/Home/Index.vue'), 'utf8')
  const templatesSource = fs.readFileSync(path.resolve('src/pages/Templates/Index.vue'), 'utf8')
  assert.match(source, /aria-pressed/)
  assert.ok(source.includes('@keydown.enter.prevent.stop="toggleFavoritePref'))
  assert.match(templatesSource, /aria-pressed/)
  assert.match(templatesSource, /templateFavoriteBtn/)
})
