import { createGeminiFetch } from './geminiFetch'
import { createSanitizingFetch } from './sanitizingFetch'
import { isTestingEndpoint } from './constants'

/**
 * Single source of truth for picking the right customFetch implementation.
 * Used by both the sidepanel agent (useAgent.ts) and the background manager
 * (BackgroundAgentManager.ts), since chrome messaging cannot serialize functions.
 */
export function resolveCustomFetch(
  baseURL: string,
  apiKey: string,
  model: string,
): typeof fetch | undefined {
  const isLocal = baseURL.includes('localhost') || baseURL.includes('127.0.0.1')
  const isGemini = baseURL.includes('generativelanguage.googleapis.com')
  const isProxy = isTestingEndpoint(baseURL)

  if (isLocal) return createSanitizingFetch()
  if (isGemini) return createGeminiFetch(apiKey, model)
  if (isProxy) return createProxyStripAuthFetch()
  return undefined
}

function createProxyStripAuthFetch(): typeof fetch {
  return async (input, init) => {
    if (init?.headers) {
      const h = init.headers as Record<string, string>
      const cleaned: Record<string, string> = {}
      for (const [k, v] of Object.entries(h)) {
        if (k.toLowerCase() !== 'authorization') cleaned[k] = v
      }
      return fetch(input, { ...init, headers: cleaned })
    }
    return fetch(input, init)
  }
}
