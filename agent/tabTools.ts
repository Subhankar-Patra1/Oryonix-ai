/**
 * Tab control tools for browser extension
 *
 * These tools allow the agent to manage multiple browser tabs:
 * - open_new_tab: Open a new tab and set it as current
 * - switch_to_tab: Switch to an existing tab
 * - close_tab: Close a tab (optionally switch to another)
 * - js_scroll: Scroll via JavaScript (fallback for broken scroll tool)
 */
import * as z from 'zod/v4'

import type { TabsController } from './TabsController'

/** Tool definition compatible with PageAgentCore customTools */
interface TabTool {
	description: string
	inputSchema: z.ZodType
	execute: (input: unknown) => Promise<string>
}

/** Callback that scrolls the current tab's page by the given pixel amount */
type ScrollFn = (pixels: number) => Promise<{ success: boolean; message: string }>

/**
 * Create tab control tools bound to a TabsManager instance.
 * These tools are injected into PageAgentCore via customTools config.
 */
export function createTabTools(
	tabsController: TabsController,
	scrollFn: ScrollFn,
): Record<string, TabTool> {
	return {
		open_new_tab: {
			description:
				'Open a new browser tab with the specified URL. The new tab becomes the current tab for all subsequent page operations.',
			inputSchema: z.object({
				url: z.string().describe('The URL to open in the new tab'),
			}),
			execute: async (input: unknown) => {
				const { url } = input as { url: string }
				try {
					return await tabsController.openNewTab(url)
				} catch (error) {
					return `❌ Failed: ${error instanceof Error ? error.message : String(error)}`
				}
			},
		},

		switch_to_tab: {
			description:
				'Switch to an existing tab by its ID. After switching, all page operations will target the new current tab. You can only switch to tabs in the tab list shown in browser state.',
			inputSchema: z.object({
				tab_id: z.coerce.number().int().describe('The tab ID to switch to'),
			}),
			execute: async (input: unknown) => {
				const { tab_id } = input as { tab_id: number }
				try {
					return await tabsController.switchToTab(tab_id)
				} catch (error) {
					return `❌ Failed: ${error instanceof Error ? error.message : String(error)}`
				}
			},
		},

		close_tab: {
			description:
				'Close a tab by its ID. Cannot close the initial tab. Optionally specify which tab to switch to after closing.',
			inputSchema: z.object({
				tab_id: z.coerce.number().int().describe('The tab ID to close'),
			}),
			execute: async (input: unknown) => {
				const { tab_id } = input as { tab_id: number }
				try {
					return await tabsController.closeTab(tab_id)
				} catch (error) {
					return `❌ Failed: ${error instanceof Error ? error.message : String(error)}`
				}
			},
		},

		js_scroll: {
			description:
				'Scroll the current page by executing window.scrollBy() via JavaScript. ' +
				'Use this as a FALLBACK when the regular scroll tool reports "already at bottom" incorrectly or fails/repeats without effect. ' +
				'Positive pixels = scroll down. Negative pixels = scroll up.',
			inputSchema: z.object({
				pixels: z.coerce
					.number()
					.describe(
						'Pixels to scroll vertically. Positive = down, negative = up. ' +
						'Suggested values: 300 (small step), 600 (medium), 1000 (large), -600 (scroll up).',
					),
			}),
			execute: async (input: unknown) => {
				const { pixels } = input as { pixels: number }
				try {
					const dir = pixels >= 0 ? 'down' : 'up'
					const result = await scrollFn(pixels)
					if (result.success) {
						return `✅ js_scroll: scrolled ${dir} by ${Math.abs(pixels)}px via JavaScript.`
					}
					return `❌ js_scroll failed: ${result.message}`
				} catch (error) {
					return `❌ js_scroll error: ${error instanceof Error ? error.message : String(error)}`
				}
			},
		},
	}
}
