/**
 * @typedef {{
 *   value: string
 *   labelKey: string
 *   protocol: string
 *   adapter: string
 *   defaultBaseUrl: string
 *   defaultApiPath: string
 *   defaultModel?: string
 *   defaultMethod: string
 * }} AiProviderMeta
 */

/**
 * @typedef {{
 *   provider: string
 *   protocol: string
 *   baseUrl: string
 *   apiPath: string
 *   api: string
 *   key: string
 *   model: string
 *   port: number | string | null
 *   method: string
 * }} AiConfig
 */

import { parseExternalJsonSafely } from './json.js'

const DEFAULT_PORT = 3456
const DEFAULT_METHOD = 'POST'
const DEFAULT_PROTOCOL = 'openai-compatible'
const ANTHROPIC_PROTOCOL = 'anthropic'
const DEFAULT_ANTHROPIC_VERSION = '2023-06-01'
const DEFAULT_ANTHROPIC_MAX_TOKENS = 4096
const DEFAULT_PROVIDER = 'volcanoArk'
export const AI_PROXY_AUTH_HEADER_NAME = 'x-ai-proxy-token'
const AI_STORAGE_KEY_PREFIX = 'b64:'

export const AI_PROVIDER_LIST = [
  {
    value: 'volcanoArk',
    labelKey: 'ai.providerVolcanoArk',
    protocol: DEFAULT_PROTOCOL,
    adapter: DEFAULT_PROTOCOL,
    defaultBaseUrl: 'https://ark.cn-beijing.volces.com',
    defaultApiPath: '/api/v3/chat/completions',
    defaultMethod: DEFAULT_METHOD
  },
  {
    value: 'openai',
    labelKey: 'ai.providerOpenAI',
    protocol: DEFAULT_PROTOCOL,
    adapter: DEFAULT_PROTOCOL,
    defaultBaseUrl: 'https://api.openai.com',
    defaultApiPath: '/v1/chat/completions',
    defaultModel: 'gpt-4.1-mini',
    defaultMethod: DEFAULT_METHOD
  },
  {
    value: 'anthropic',
    labelKey: 'ai.providerAnthropic',
    protocol: ANTHROPIC_PROTOCOL,
    adapter: ANTHROPIC_PROTOCOL,
    defaultBaseUrl: 'https://api.anthropic.com',
    defaultApiPath: '/v1/messages',
    defaultModel: 'claude-sonnet-4-5',
    defaultMethod: DEFAULT_METHOD
  },
  {
    value: 'deepseek',
    labelKey: 'ai.providerDeepSeek',
    protocol: DEFAULT_PROTOCOL,
    adapter: DEFAULT_PROTOCOL,
    defaultBaseUrl: 'https://api.deepseek.com',
    defaultApiPath: '/v1/chat/completions',
    defaultMethod: DEFAULT_METHOD
  },
  {
    value: 'siliconFlow',
    labelKey: 'ai.providerSiliconFlow',
    protocol: DEFAULT_PROTOCOL,
    adapter: DEFAULT_PROTOCOL,
    defaultBaseUrl: 'https://api.siliconflow.cn',
    defaultApiPath: '/v1/chat/completions',
    defaultMethod: DEFAULT_METHOD
  },
  {
    value: 'customOpenAI',
    labelKey: 'ai.providerCustomOpenAI',
    protocol: DEFAULT_PROTOCOL,
    adapter: DEFAULT_PROTOCOL,
    defaultBaseUrl: '',
    defaultApiPath: '/v1/chat/completions',
    defaultMethod: DEFAULT_METHOD
  },
  {
    value: 'customAnthropic',
    labelKey: 'ai.providerCustomAnthropic',
    protocol: ANTHROPIC_PROTOCOL,
    adapter: ANTHROPIC_PROTOCOL,
    defaultBaseUrl: '',
    defaultApiPath: '/v1/messages',
    defaultMethod: DEFAULT_METHOD
  }
]

export const AI_CONFIG_KEYS = [
  'provider',
  'protocol',
  'baseUrl',
  'apiPath',
  'api',
  'key',
  'model',
  'port',
  'method'
]

/** @param {unknown} value */
const encodeBase64Utf8 = value => {
  const normalized = String(value || '')
  if (!normalized) return ''
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(normalized, 'utf8').toString('base64')
  }
  if (typeof btoa === 'function') {
    return btoa(unescape(encodeURIComponent(normalized)))
  }
  return normalized
}

/** @param {unknown} value */
const decodeBase64Utf8 = value => {
  const normalized = String(value || '')
  if (!normalized) return ''
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(normalized, 'base64').toString('utf8')
  }
  if (typeof atob === 'function') {
    return decodeURIComponent(escape(atob(normalized)))
  }
  return normalized
}

/** @param {unknown} value */
const decodeStoredAiKey = value => {
  const normalized = String(value || '')
  if (!normalized.startsWith(AI_STORAGE_KEY_PREFIX)) {
    return normalized
  }
  const payload = normalized.slice(AI_STORAGE_KEY_PREFIX.length)
  if (!payload) {
    return ''
  }
  try {
    return decodeBase64Utf8(payload)
  } catch (_error) {
    return normalized
  }
}

/** @param {Record<string, unknown> | null | undefined} config */
export const encodeAiConfigForStorage = config => {
  const nextConfig = config && typeof config === 'object' ? { ...config } : {}
  const decodedKey = decodeStoredAiKey(nextConfig.key)
  nextConfig.key = decodedKey
    ? `${AI_STORAGE_KEY_PREFIX}${encodeBase64Utf8(decodedKey)}`
    : ''
  return nextConfig
}

/** @param {Record<string, unknown> | null | undefined} config */
export const decodeAiConfigFromStorage = config => {
  const nextConfig = config && typeof config === 'object' ? { ...config } : {}
  nextConfig.key = decodeStoredAiKey(nextConfig.key)
  return nextConfig
}

/** @param {Record<string, unknown>} [input] */
export const separateAppAndAiConfig = input => {
  /** @type {Record<string, unknown>} */
  const localConfig = {}
  /** @type {Record<string, unknown>} */
  const aiConfig = {}
  const source = input || {}
  Object.keys(source).forEach(key => {
    if (AI_CONFIG_KEYS.includes(key)) {
      aiConfig[key] = source[key]
      return
    }
    localConfig[key] = source[key]
  })
  return {
    localConfig,
    aiConfig
  }
}

/** @param {boolean} isDesktop */
export const shouldUseLocalProxyHealthcheck = isDesktop => {
  return !isDesktop
}

export const getAiProxyAuthToken = () => {
  return typeof __APP_AI_PROXY_TOKEN__ === 'string'
    ? __APP_AI_PROXY_TOKEN__.trim()
    : ''
}

/** @param {Record<string, string>} [headers] */
export const buildAiProxyAuthHeaders = (headers = {}) => {
  const token = getAiProxyAuthToken()
  if (!token) {
    return {
      ...headers
    }
  }
  return {
    ...headers,
    [AI_PROXY_AUTH_HEADER_NAME]: token
  }
}

/** @param {unknown} value */
const trimTrailingSlash = value => String(value || '').replace(/\/+$/, '')

/** @param {unknown} value */
const normalizeApiPath = value => {
  const path = String(value || '').trim()
  if (!path) return ''
  return path.startsWith('/') ? path : `/${path}`
}

/** @param {unknown} value */
const isBlankValue = value => {
  return value === undefined || value === null || String(value).trim() === ''
}

/** @param {unknown} value */
export const parseAiPort = value => {
  if (isBlankValue(value)) {
    return {
      empty: true,
      valid: false,
      value: null
    }
  }
  const port = Number(String(value).trim())
  const valid = Number.isInteger(port) && port >= 1 && port <= 65535
  return {
    empty: false,
    valid,
    value: valid ? port : null
  }
}

/**
 * @param {unknown} baseUrl
 * @param {unknown} apiPath
 */
export const buildApiUrl = (baseUrl, apiPath) => {
  const normalizedBaseUrl = trimTrailingSlash(baseUrl)
  const normalizedApiPath = normalizeApiPath(apiPath)
  if (!normalizedBaseUrl) return normalizedApiPath
  return `${normalizedBaseUrl}${normalizedApiPath}`
}

/** @param {unknown} provider */
export const getAiProviderMeta = provider => {
  return (
    AI_PROVIDER_LIST.find(item => item.value === provider) ||
    AI_PROVIDER_LIST.find(item => item.value === DEFAULT_PROVIDER) ||
    AI_PROVIDER_LIST[0]
  )
}

/** @param {unknown} api */
const detectProviderByApi = api => {
  const url = String(api || '')
  if (!url) return 'volcanoArk'
  if (url.includes('ark.cn-beijing.volces.com')) return 'volcanoArk'
  if (url.includes('api.openai.com')) return 'openai'
  if (url.includes('api.anthropic.com')) return 'anthropic'
  if (url.includes('api.deepseek.com')) return 'deepseek'
  if (url.includes('api.siliconflow.cn')) return 'siliconFlow'
  return 'customOpenAI'
}

/** @param {unknown} api */
const parseLegacyApi = api => {
  const value = String(api || '').trim()
  if (!value) {
    return {
      baseUrl: '',
      apiPath: ''
    }
  }
  try {
    const url = new URL(value)
    return {
      baseUrl: `${url.protocol}//${url.host}`,
      apiPath: `${url.pathname}${url.search || ''}`
    }
  } catch (_error) {
    // 历史配置里也可能只保存了路径片段，这里按路径回退是预期行为。
    return {
      baseUrl: '',
      apiPath: normalizeApiPath(value)
    }
  }
}

/** @param {unknown} provider */
export const getDefaultAiConfig = provider => {
  const meta = getAiProviderMeta(provider || DEFAULT_PROVIDER)
  /** @type {AiConfig} */
  return {
    provider: meta.value,
    protocol: meta.protocol,
    baseUrl: meta.defaultBaseUrl,
    apiPath: meta.defaultApiPath,
    api: buildApiUrl(meta.defaultBaseUrl, meta.defaultApiPath),
    key: '',
    model: meta.defaultModel || '',
    port: DEFAULT_PORT,
    method: meta.defaultMethod || DEFAULT_METHOD
  }
}

/** @param {Record<string, unknown> | null | undefined} config */
export const normalizeAiConfig = config => {
  const input = decodeAiConfigFromStorage(config)
  const meta = getAiProviderMeta(input.provider || detectProviderByApi(input.api))
  const defaults = getDefaultAiConfig(meta.value)
  const legacyApi = parseLegacyApi(input.api)
  const baseUrl =
    trimTrailingSlash(input.baseUrl) ||
    trimTrailingSlash(legacyApi.baseUrl) ||
    defaults.baseUrl
  const apiPath =
    normalizeApiPath(input.apiPath) ||
    normalizeApiPath(legacyApi.apiPath) ||
    defaults.apiPath
  const parsedPort = parseAiPort(input.port)
  const port = parsedPort.empty
    ? defaults.port
    : parsedPort.valid
      ? parsedPort.value
      : String(input.port).trim()
  const method = String(input.method || defaults.method || DEFAULT_METHOD).toUpperCase()
  const protocol = input.protocol || meta.protocol || defaults.protocol || DEFAULT_PROTOCOL

  /** @type {AiConfig} */
  return {
    provider: meta.value,
    protocol,
    baseUrl,
    apiPath,
    api: buildApiUrl(baseUrl, apiPath),
    key: String(input.key || ''),
    model: String(input.model || defaults.model || ''),
    port,
    method
  }
}

/** @param {Record<string, unknown> | null | undefined} config */
export const validateAiConfig = config => {
  const parsedPort = parseAiPort(config && config.port)
  if (!parsedPort.empty && !parsedPort.valid) {
    return { valid: false, messageKey: 'ai.portValidateTip' }
  }
  const normalized = normalizeAiConfig(config)
  if (!normalized.provider) {
    return { valid: false, messageKey: 'ai.providerValidateTip' }
  }
  if (!normalized.baseUrl) {
    return { valid: false, messageKey: 'ai.baseUrlValidateTip' }
  }
  if (!normalized.apiPath) {
    return { valid: false, messageKey: 'ai.apiPathValidateTip' }
  }
  if (!normalized.key) {
    return { valid: false, messageKey: 'ai.keyValidateTip' }
  }
  if (!normalized.model) {
    return { valid: false, messageKey: 'ai.modelValidateTip' }
  }
  if (!normalized.port) {
    return { valid: false, messageKey: 'ai.portValidateTip' }
  }
  return { valid: true, config: normalized }
}

/** @param {Record<string, unknown> | null | undefined} config */
export const buildAiRequestConfig = config => {
  const normalized = normalizeAiConfig(config)
  const headers =
    normalized.protocol === ANTHROPIC_PROTOCOL
      ? {
          'x-api-key': normalized.key,
          'anthropic-version': DEFAULT_ANTHROPIC_VERSION
        }
      : {
          Authorization: `Bearer ${normalized.key}`
        }
  return {
    provider: normalized.provider,
    protocol: normalized.protocol,
    api: normalized.api,
    method: normalized.method,
    headers,
    data: {
      model: normalized.model,
      stream: true,
      ...(normalized.protocol === ANTHROPIC_PROTOCOL
        ? { max_tokens: DEFAULT_ANTHROPIC_MAX_TOKENS }
        : {})
    }
  }
}

/** @param {unknown} role */
const normalizeAnthropicRole = role => {
  return role === 'assistant' ? 'assistant' : 'user'
}

/**
 * @param {unknown} protocol
 * @param {Record<string, unknown>} data
 */
export const buildAiProtocolRequestData = (protocol, data = {}) => {
  if (protocol !== ANTHROPIC_PROTOCOL) {
    return data
  }
  const messages = Array.isArray(data.messages) ? data.messages : []
  /** @type {string[]} */
  const systemMessages = []
  /** @type {Array<{ role: string, content: string }>} */
  const nextMessages = []
  messages.forEach(message => {
    const item =
      message && typeof message === 'object'
        ? /** @type {{ role?: unknown, content?: unknown }} */ (message)
        : {}
    const content = String(item.content || '').trim()
    if (!content) return
    if (item.role === 'system') {
      systemMessages.push(content)
      return
    }
    nextMessages.push({
      role: normalizeAnthropicRole(item.role),
      content
    })
  })
  /** @type {Record<string, unknown>} */
  const nextData = {
    ...data,
    messages: nextMessages
  }
  if (systemMessages.length) {
    nextData.system = systemMessages.join('\n\n')
  }
  return nextData
}

/**
 * @param {{ choices?: Array<{ delta?: { content?: string } }> } | null | undefined} item
 */
export const parseOpenAICompatibleStreamChunk = item => {
  if (!item || !Array.isArray(item.choices)) return ''
  return item.choices
    .map(choice => {
      const delta = choice && choice.delta
      return delta && typeof delta.content === 'string' ? delta.content : ''
    })
    .join('')
}

/** @param {any} item */
export const parseAnthropicStreamChunk = item => {
  if (!item || item.type !== 'content_block_delta') return ''
  const delta = item.delta
  return delta && delta.type === 'text_delta' && typeof delta.text === 'string'
    ? delta.text
    : ''
}

/**
 * @param {string} pending
 * @param {string} chunk
 */
export const consumeOpenAICompatibleStreamText = (pending, chunk) => {
  const source = `${String(pending || '')}${String(chunk || '')}`
  if (!source) {
    return {
      items: [],
      pending: '',
      done: false
    }
  }

  const hasTerminator = /(?:\r?\n){2}$/.test(source)
  const segments = source.split(/\r?\n\r?\n/)
  const nextPending = hasTerminator ? '' : segments.pop() || ''
  const items = []
  let done = false

  for (const segment of segments) {
    const lines = String(segment)
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean)
    if (!lines.length) continue
    const data = lines
      .filter(line => line.startsWith('data:'))
      .map(line => line.slice(5).trimStart())
      .join('\n')
    if (!data) continue
    if (data === '[DONE]') {
      done = true
      break
    }
    try {
      items.push(parseExternalJsonSafely(data))
    } catch (error) {
      console.error('consumeOpenAICompatibleStreamText parse failed', error)
    }
  }

  return {
    items,
    pending: done ? '' : nextPending,
    done
  }
}

/**
 * @param {string} pending
 * @param {string} chunk
 */
export const consumeAnthropicStreamText = (pending, chunk) => {
  const source = `${String(pending || '')}${String(chunk || '')}`
  if (!source) {
    return {
      items: [],
      pending: '',
      done: false
    }
  }

  const hasTerminator = /(?:\r?\n){2}$/.test(source)
  const segments = source.split(/\r?\n\r?\n/)
  const nextPending = hasTerminator ? '' : segments.pop() || ''
  const items = []
  let done = false

  for (const segment of segments) {
    const lines = String(segment)
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean)
    if (!lines.length) continue
    const eventName = lines
      .find(line => line.startsWith('event:'))
      ?.slice(6)
      .trim()
    const data = lines
      .filter(line => line.startsWith('data:'))
      .map(line => line.slice(5).trimStart())
      .join('\n')
    if (eventName === 'message_stop') {
      done = true
    }
    if (!data) continue
    try {
      const item = parseExternalJsonSafely(data)
      if (item?.type === 'message_stop') {
        done = true
      } else if (item?.type === 'content_block_delta') {
        items.push(item)
      }
    } catch (error) {
      console.error('consumeAnthropicStreamText parse failed', error)
    }
  }

  return {
    items,
    pending: done ? '' : nextPending,
    done
  }
}

/**
 * @param {unknown} protocol
 * @param {any} item
 */
export const parseAiStreamChunk = (protocol, item) => {
  return protocol === ANTHROPIC_PROTOCOL
    ? parseAnthropicStreamChunk(item)
    : parseOpenAICompatibleStreamChunk(item)
}

/**
 * @param {unknown} protocol
 * @param {string} pending
 * @param {string} chunk
 */
export const consumeAiStreamText = (protocol, pending, chunk) => {
  return protocol === ANTHROPIC_PROTOCOL
    ? consumeAnthropicStreamText(pending, chunk)
    : consumeOpenAICompatibleStreamText(pending, chunk)
}
