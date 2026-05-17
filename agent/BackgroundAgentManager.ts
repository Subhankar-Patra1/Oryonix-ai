import type { AgentActivity, AgentStatus, HistoricalEvent } from '@page-agent/core'
import { MultiPageAgent } from './MultiPageAgent'
import type { AgentState, BackgroundUpdateMessage, ExtConfig, UICommandMessage } from './types'
import { createSanitizingFetch } from './sanitizingFetch'
import { createGeminiFetch } from './geminiFetch'

export class BackgroundAgentManager {
	private agent: MultiPageAgent | null = null
	private ports: Set<chrome.runtime.Port> = new Set()

	private state: AgentState = {
		status: 'idle',
		currentTask: '',
		history: [],
		activity: null,
		error: null,
	}

	constructor() {
		// Listen for keep-alive alarms to wake up the service worker
		chrome.alarms.onAlarm.addListener((alarm) => {
			if (alarm.name === 'agentKeepAlive' && this.state.status === 'running') {
				// Wake up worker by calling an API
				chrome.runtime.getPlatformInfo(() => {})
			}
		})
	}

	/** Handle a new UI port connection (e.g. Side Panel opened) */
	public handleConnection(port: chrome.runtime.Port) {
		this.ports.add(port)

		// Send initial state immediately
		this.broadcastState()

		port.onMessage.addListener((msg: UICommandMessage) => {
			if (msg.type === 'START_TASK') {
				this.startTask(msg.payload.task, msg.payload.tabId, msg.payload.config).catch(console.error)
			} else if (msg.type === 'STOP_TASK') {
				this.stopTask()
			}
		})

		port.onDisconnect.addListener(() => {
			this.ports.delete(port)
		})
	}

	private updateState(partial: Partial<AgentState>) {
		this.state = { ...this.state, ...partial }
		this.broadcastState()
	}

	private broadcastState() {
		const message: BackgroundUpdateMessage = {
			type: 'AGENT_STATE_UPDATE',
			payload: this.state,
		}
		for (const port of this.ports) {
			try {
				port.postMessage(message)
			} catch (e) {
				console.warn('Failed to send message to port, removing it.', e)
				this.ports.delete(port)
			}
		}
	}

	private async startTask(task: string, tabId: number, config: ExtConfig) {
		// Cleanup previous agent
		if (this.agent) {
			this.agent.stop()
		}

		// Reset state
		this.updateState({
			status: 'idle',
			currentTask: task,
			history: [],
			activity: null,
			error: null,
		})

		// Ensure we don't sleep during a long task
		chrome.alarms.create('agentKeepAlive', { periodInMinutes: 0.4 })

		try {
			const { systemInstruction, ...agentConfig } = config
			this.agent = new MultiPageAgent({
				...agentConfig,
				customFetch: (config.baseURL ?? '').includes('generativelanguage.googleapis.com')
					? createGeminiFetch(config.apiKey ?? '', config.model ?? '')
					: createSanitizingFetch(),
				instructions: systemInstruction ? { system: systemInstruction } : undefined,
			})

			// Bind agent events to update our state
			this.agent.addEventListener('statuschange', () => {
				if (this.agent) this.updateState({ status: this.agent.status as AgentStatus })
			})
			this.agent.addEventListener('historychange', () => {
				if (this.agent) this.updateState({ history: [...this.agent.history] })
			})
			this.agent.addEventListener('activity', (e: Event) => {
				const activity = (e as CustomEvent).detail as AgentActivity
				this.updateState({ activity })
			})

			// Focus the tab to ensure page agent has visibility
			await chrome.tabs.update(tabId, { active: true })
			const tab = await chrome.tabs.get(tabId)
			if (tab.windowId) {
				await chrome.windows.update(tab.windowId, { focused: true })
			}

			// Execute
			const result = await this.agent.execute(task)

			if (!result.success) {
				this.updateState({ error: result.data || 'Execution failed' })
			}
		} catch (error: any) {
			console.error('Agent execution failed', error)
			this.updateState({ status: 'error', error: error.message || 'Unknown error' })
		} finally {
			// Clear keep-alive alarm when done
			chrome.alarms.clear('agentKeepAlive')
			
			// If not error/done explicitly, mark done
			if (this.state.status === 'running') {
				this.updateState({ status: 'completed' as any })
			}
		}
	}

	private stopTask() {
		if (this.agent) {
			this.agent.stop()
		}
		chrome.alarms.clear('agentKeepAlive')
		this.updateState({ status: 'idle' })
	}
}

// Export singleton instance
export const backgroundAgentManager = new BackgroundAgentManager()
