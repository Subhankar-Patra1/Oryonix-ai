/**
 * Forgiving tool overrides for local models like gemma4:e4b
 * 
 * The built-in @page-agent/core tools use strict z.int() validation.
 * Local models often output {"index": "15"} (string) instead of {"index": 15} (number).
 * These overrides use z.coerce.number() to automatically convert strings to numbers.
 */
import * as z from 'zod/v4'

interface ForgivingTool {
	description: string
	inputSchema: z.ZodType
	execute: (input: unknown) => Promise<string>
}

/**
 * Create forgiving versions of the built-in page-agent tools.
 * These use z.coerce to accept both string and number types for index params.
 * The execute functions delegate to `this.pageController` (bound by PageAgentCore).
 */
export function createForgivingTools(): Record<string, ForgivingTool> {
	return {
		click_element_by_index: {
			description: 'Click element by index',
			inputSchema: z.object({
				index: z.coerce.number().int().min(0),
			}),
			execute: async function (this: any, input: any) {
				const result = await this.pageController.clickElement(input.index)
				return result.message
			},
		},

		input_text: {
			description: 'Click and type text into an interactive input element',
			inputSchema: z.object({
				index: z.coerce.number().int().min(0),
				text: z.coerce.string(),
			}),
			execute: async function (this: any, input: any) {
				const result = await this.pageController.inputText(input.index, input.text)
				return result.message
			},
		},

		select_dropdown_option: {
			description: 'Select dropdown option for interactive element index by the text of the option',
			inputSchema: z.object({
				index: z.coerce.number().int().min(0),
				text: z.coerce.string(),
			}),
			execute: async function (this: any, input: any) {
				const result = await this.pageController.selectOption(input.index, input.text)
				return result.message
			},
		},

		scroll: {
			description: 'Scroll vertically. Use down=true to scroll down, down=false to scroll up.',
			inputSchema: z.object({
				down: z.preprocess(
					(val) => {
						if (typeof val === 'string') return val === 'true' || val === 'down'
						return val
					},
					z.boolean().default(true)
				),
				num_pages: z.coerce.number().min(0).max(10).optional().default(0.1),
				pixels: z.coerce.number().int().min(0).optional(),
				index: z.coerce.number().int().min(0).optional(),
			}),
			execute: async function (this: any, input: any) {
				const result = await this.pageController.scroll({
					...input,
					numPages: input.num_pages,
				})
				return result.message
			},
		},

		scroll_horizontally: {
			description: 'Scroll horizontally. Use right=true to scroll right, right=false to scroll left.',
			inputSchema: z.object({
				right: z.preprocess(
					(val) => {
						if (typeof val === 'string') return val === 'true' || val === 'right'
						return val
					},
					z.boolean().default(true)
				),
				pixels: z.coerce.number().int().min(0),
				index: z.coerce.number().int().min(0).optional(),
			}),
			execute: async function (this: any, input: any) {
				const result = await this.pageController.scrollHorizontally(input)
				return result.message
			},
		},

		wait: {
			description: 'Wait for x seconds. Can be used to wait until the page or data is fully loaded.',
			inputSchema: z.object({
				seconds: z.coerce.number().min(1).max(10).default(1),
			}),
			execute: async function (this: any, input: any) {
				const lastTimeUpdate = await this.pageController.getLastUpdateTime()
				const actualWaitTime = Math.max(0, input.seconds - (Date.now() - lastTimeUpdate) / 1000)
				await new Promise((resolve) => setTimeout(resolve, actualWaitTime * 1000))
				return `✅ Waited for ${input.seconds} seconds.`
			},
		},

		done: {
			description: 'Complete task. Text is your final response to the user.',
			inputSchema: z.object({
				text: z.coerce.string(),
				success: z.preprocess(
					(val) => {
						if (typeof val === 'string') return val === 'true'
						return val
					},
					z.boolean().default(true)
				),
			}),
			execute: async function (this: any, input: any) {
				return Promise.resolve('Task completed')
			},
		},
	}
}
