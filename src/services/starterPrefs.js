const RECENT_KEY = 'mindflow.recentStarters.v1'
const FAVORITE_KEY = 'mindflow.favoriteStarters.v1'
const MAX_RECENT = 8

const safeParseList = raw => {
  try {
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list.filter(item => typeof item === 'string' && item) : []
  } catch (_error) {
    return []
  }
}

export const loadRecentStarterKeys = () => {
  if (typeof localStorage === 'undefined') return []
  return safeParseList(localStorage.getItem(RECENT_KEY)).slice(0, MAX_RECENT)
}

export const rememberRecentStarter = key => {
  if (!key || typeof localStorage === 'undefined') return loadRecentStarterKeys()
  try {
    const list = loadRecentStarterKeys()
    const next = [key, ...list.filter(item => item !== key)].slice(0, MAX_RECENT)
    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
    return next
  } catch (_error) {
    return loadRecentStarterKeys()
  }
}

export const loadFavoriteStarterKeys = () => {
  if (typeof localStorage === 'undefined') return []
  return safeParseList(localStorage.getItem(FAVORITE_KEY))
}

export const isFavoriteStarter = key => {
  if (!key) return false
  return loadFavoriteStarterKeys().includes(key)
}

export const toggleFavoriteStarter = key => {
  if (!key || typeof localStorage === 'undefined') return loadFavoriteStarterKeys()
  try {
    const list = loadFavoriteStarterKeys()
    const next = list.includes(key)
      ? list.filter(item => item !== key)
      : [key, ...list.filter(item => item !== key)]
    localStorage.setItem(FAVORITE_KEY, JSON.stringify(next))
    return next
  } catch (_error) {
    return loadFavoriteStarterKeys()
  }
}

export const starterPrefKey = {
  mindmapScenario: key => `mindmap:${key}`,
  mindmapLayout: layout => `mindmap-layout:${layout}`,
  flowchart: key => `flowchart:${key}`,
  mindmapBlank: () => 'mindmap-layout:blank'
}

export const STARTER_LABEL_KEY_MAP = {
  'mindmap-layout:blank': 'home.starterMindMapBlank',
  'mindmap-layout:mindMap': 'home.starterMindMapOrg',
  'mindmap-layout:organizationStructure': 'home.starterMindMapTree',
  'mindmap:meeting': 'home.starterMindMapMeeting',
  'mindmap:project': 'home.starterMindMapProject',
  'mindmap:learning': 'home.starterMindMapLearning',
  'mindmap:review': 'home.starterMindMapReview',
  'mindmap:okr': 'home.starterMindMapOkr',
  'mindmap:weekly': 'home.starterMindMapWeekly',
  'mindmap:interview': 'home.starterMindMapInterview',
  'mindmap:reading': 'home.starterMindMapReading',
  'mindmap:business': 'home.starterMindMapBusiness',
  'mindmap:knowledge': 'home.starterMindMapKnowledge',
  'mindmap:competitor': 'home.starterMindMapCompetitor',
  'mindmap:retro': 'home.starterMindMapRetro',
  'mindmap:roadmap': 'home.starterMindMapRoadmap',
  'mindmap:content': 'home.starterMindMapContent',
  'mindmap:pitch': 'home.starterMindMapPitch',
  'flowchart:approval': 'home.starterFlowApproval',
  'flowchart:release': 'home.starterFlowRelease',
  'flowchart:enterpriseDelivery': 'home.starterFlowEnterprise',
  'flowchart:supportEscalation': 'home.starterFlowSupport',
  'flowchart:salesPipeline': 'home.starterFlowSales',
  'flowchart:contentReview': 'home.starterFlowReviewFlow',
  'flowchart:incident': 'home.starterFlowIncident',
  'flowchart:customerJourney': 'home.starterFlowJourney',
  'flowchart:procurement': 'home.starterFlowProcurement',
  'flowchart:troubleshooting': 'home.starterFlowTroubleshooting',
  'flowchart:ticket': 'home.starterFlowTicket',
  'flowchart:onboarding': 'home.starterFlowOnboarding',
  'flowchart:dataPipeline': 'home.starterFlowDataPipeline',
  'flowchart:projectPlan': 'home.starterFlowProjectPlan',
  'flowchart:crossFunctionalApproval': 'home.starterFlowCrossApproval'
}

export const resolveStarterLabelKey = key => STARTER_LABEL_KEY_MAP[key] || ''
