import type { LLMConfig } from '@page-agent/llms'

// ─── LLM Config from Environment Variables ───────────────────
// Values are loaded from .env file (VITE_ prefix required for Vite/WXT)
// Fallbacks to local Ollama if .env is not configured
export const DEMO_MODEL = import.meta.env.VITE_LLM_MODEL_NAME || 'qwen3.5-plus'
export const DEMO_BASE_URL = import.meta.env.VITE_LLM_BASE_URL || 'https://page-ag-testing-ohftxirgbn.cn-shanghai.fcapp.run'
export const DEMO_API_KEY = import.meta.env.VITE_LLM_API_KEY || 'NA'

export const DEMO_CONFIG: LLMConfig = {
	baseURL: DEMO_BASE_URL,
	model: DEMO_MODEL,
	apiKey: DEMO_API_KEY,
}

/** Legacy testing endpoints that should be auto-migrated to DEMO_BASE_URL */
export const LEGACY_TESTING_ENDPOINTS = [
	'https://hwcxiuzfylggtcktqgij.supabase.co/functions/v1/llm-testing-proxy',
]

export function isTestingEndpoint(url: string): boolean {
	const normalized = url.replace(/\/+$/, '')
	return normalized === DEMO_BASE_URL || LEGACY_TESTING_ENDPOINTS.some((ep) => normalized === ep)
}

