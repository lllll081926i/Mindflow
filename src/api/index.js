import { getBootstrapState, saveBootstrapStatePatch } from '@/platform'
import { createDefaultMindMapData } from '@/platform/shared/configSchema'
import { emitWriteLocalFile } from '@/services/appEvents'
import {
  loadLocalConfig,
  persistLocalConfig
} from '@/services/localConfigStorage'
import { getCurrentData } from '@/services/runtimeGlobals'
import { getRuntimeStores } from '@/stores/runtime'

// 获取缓存的思维导图数据
export const getData = () => {
  const { appStore } = getRuntimeStores()
  const currentData = appStore?.isHandleLocalFile ? getCurrentData() : null
  if (currentData) {
    return currentData
  }
  const state = getBootstrapState()
  return state.mindMapData || createDefaultMindMapData()
}

// 存储思维导图数据
export const storeData = data => {
  try {
    let originData = getData()
    if (!originData) {
      originData = {}
    }
    // workbook-aware merge: keep sheets unless explicitly replaced
    originData = {
      ...originData,
      ...data
    }
    if (
      Array.isArray(originData.sheets) &&
      originData.sheets.length &&
      data &&
      data.root &&
      !Array.isArray(data.sheets)
    ) {
      originData.sheets = originData.sheets.map(sheet => {
        if (sheet.id !== originData.activeSheetId) return sheet
        return {
          ...sheet,
          root: data.root,
          theme: data.theme || sheet.theme,
          layout: data.layout || sheet.layout,
          view: data.view !== undefined ? data.view : sheet.view
        }
      })
    }
    void saveBootstrapStatePatch({
      mindMapData: originData
    }).catch(error => {
      console.error('storeData persist failed', error)
    })
    emitWriteLocalFile(originData)
  } catch (error) {
    console.error('storeData failed', error)
  }
}

// 获取思维导图配置数据
export const getConfig = () => {
  return getBootstrapState().mindMapConfig || null
}

// 存储思维导图配置数据
export const storeConfig = config => {
  try {
    void saveBootstrapStatePatch({
      mindMapConfig: config
    }).catch(error => {
      console.error('storeConfig persist failed', error)
    })
  } catch (error) {
    console.error('storeConfig failed', error)
  }
}

// 存储本地配置
export const storeLocalConfig = config => {
  persistLocalConfig(config)
}

// 获取本地配置
export const getLocalConfig = () => {
  return loadLocalConfig()
}
