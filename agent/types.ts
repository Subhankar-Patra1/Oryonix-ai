import type {
	AgentActivity,
	AgentStatus,
	HistoricalEvent,
	SupportedLanguage,
} from '@page-agent/core'
import type { LLMConfig } from '@page-agent/llms'

/** Language preference: undefined means follow system */
export type LanguagePreference = SupportedLanguage | undefined

export interface AdvancedConfig {
	maxSteps?: number
	systemInstruction?: string
	experimentalLlmsTxt?: boolean
	experimentalIncludeAllTabs?: boolean
	disableNamedToolChoice?: boolean
}

export interface ExtConfig extends LLMConfig, AdvancedConfig {
	language?: LanguagePreference
}

/** 
 * Single source of truth for the Agent's current execution state, 
 * managed by the background script and synced to the UI.
 */
export interface AgentState {
	status: AgentStatus
	currentTask: string
	history: HistoricalEvent[]
	activity: AgentActivity | null
	error: string | null
}

/** Messages sent from UI (Side Panel) to Background */
export type UICommandMessage =
	| { type: 'START_TASK'; payload: { task: string; tabId: number; config: ExtConfig } }
	| { type: 'STOP_TASK' }

/** Messages sent from Background to UI (Side Panel) */
export type BackgroundUpdateMessage =
	| { type: 'AGENT_STATE_UPDATE'; payload: AgentState }
