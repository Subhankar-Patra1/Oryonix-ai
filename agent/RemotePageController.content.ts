/**
 * content script for RemotePageController
 */
import type { PageController as PageControllerType } from '@page-agent/page-controller'

export function initPageController() {
	let pageController: PageControllerType | null = null
	let intervalID: number | null = null

	const myTabIdPromise = chrome.runtime
		.sendMessage({ type: 'PAGE_CONTROL', action: 'get_my_tab_id' })
		.then((response) => {
			return (response as { tabId: number | null }).tabId
		})
		.catch((error) => {
			console.error('[RemotePageController.ContentScript]: Failed to get my tab id', error)
			return null
		})

	async function getPCPromise(): Promise<PageControllerType> {
		if (!pageController) {
			const { PageController } = await import('@page-agent/page-controller')
			pageController = new PageController({
				enableMask: false,
				viewportExpansion: 400,
			})
		}
		return pageController
	}

	intervalID = window.setInterval(async () => {
		// Extension was reloaded — stop the interval immediately to prevent
		// "Extension context invalidated" errors flooding the console.
		if (!chrome.runtime?.id) {
			if (intervalID !== null) window.clearInterval(intervalID)
			return
		}

		try {
			const agentHeartbeat = (await chrome.storage.local.get('agentHeartbeat')).agentHeartbeat
			const now = Date.now()
			const agentInTouch = typeof agentHeartbeat === 'number' && now - agentHeartbeat < 2_000

			const isAgentRunning = (await chrome.storage.local.get('isAgentRunning')).isAgentRunning
			const currentTabId = (await chrome.storage.local.get('currentTabId')).currentTabId

			const shouldShowMask = isAgentRunning && agentInTouch && currentTabId === (await myTabIdPromise)

			if (shouldShowMask) {
				const pc = await getPCPromise()
				pc.initMask()
				await pc.showMask()
			} else {
				if (pageController) {
					pageController.hideMask()
					pageController.cleanUpHighlights()
				}
			}

			if (!isAgentRunning && agentInTouch) {
				if (pageController) {
					pageController.dispose()
					pageController = null
				}
			}
		} catch (error) {
			if (error instanceof Error && error.message.includes('Extension context invalidated')) {
				if (intervalID !== null) window.clearInterval(intervalID)
			}
		}
	}, 500)

	chrome.runtime.onMessage.addListener((message, sender, sendResponse): true | undefined => {
		if (message.type !== 'PAGE_CONTROL') {
			return
		}

		const { action, payload } = message
		const methodName = getMethodName(action)

		getPCPromise().then((pc: any) => {
			switch (action) {
				case 'get_last_update_time':
				case 'get_browser_state':
				case 'update_tree':
				case 'clean_up_highlights':
				case 'click_element':
				case 'select_option':
				case 'scroll':
				case 'scroll_horizontally':
					pc[methodName](...(payload || []))
						.then((result: any) => sendResponse(result))
						.catch((error: any) =>
							sendResponse({
								success: false,
								error: error instanceof Error ? error.message : String(error),
							})
						)
					break

				case 'fallback_scroll': {
					const pixels = (payload || [])[0] ?? 0
					window.scrollBy(0, pixels)
					sendResponse({ success: true, message: `Scrolled by ${pixels}px` })
					break
				}

				case 'input_text': {
					const isGoogleSheets = window.location.hostname.includes('docs.google.com') && window.location.pathname.includes('/spreadsheets')

					if (isGoogleSheets) {
						console.log('[Sheets] Intercepting input_text — blocking blur, redirecting cursor to cell')

						// Auto-dismiss blocking dialogs
						try {
							const btns = document.querySelectorAll('button, [role="button"]')
							for (const b of btns) {
								const t = (b as HTMLElement).textContent?.trim().toLowerCase()
								if (t === 'got it' || t === 'dismiss' || t === 'no thanks') {
									(b as HTMLElement).click()
									break
								}
							}
						} catch (_) {}

						// Helper: get cell position from Name Box value or active cell overlay
						function getCellPosition(cellRef: string): DOMRect | null {
							const activeCell = document.querySelector('.active-cell-border, [class*="cell-border"]') as HTMLElement
							if (activeCell) {
								const rect = activeCell.getBoundingClientRect()
								if (rect.width > 0 && rect.height > 0) return rect
							}
							const match = cellRef.match(/^([A-Z]+)(\d+)$/)
							if (match) {
								const colIdx = match[1].charCodeAt(0) - 65
								const rowIdx = parseInt(match[2]) - 1
								const x = 32 + colIdx * 100
								const y = 105 + rowIdx * 21
								return new DOMRect(x, y, 100, 21)
							}
							return null
						}

						// Read current cell BEFORE typing
						let currentCellRef = ''
						try {
							const nameBox = document.querySelector('#t-name-box, .docs-name-input, [class*="name-box"]') as HTMLInputElement
							if (nameBox) currentCellRef = nameBox.value || ''
						} catch (_) {}
						const cellRect = getCellPosition(currentCellRef)

						// Override getBoundingClientRect on the target element so the library's
						// clickElement() computes CELL coordinates for the cursor, not formula bar
						let targetElement: HTMLElement | null = null
						let origGetBCR: (() => DOMRect) | null = null
						if (cellRect) {
							try {
								const node = pc.selectorMap?.get((payload || [])[0])
								if (node?.ref) {
									targetElement = node.ref as HTMLElement
									origGetBCR = targetElement.getBoundingClientRect.bind(targetElement)
									targetElement.getBoundingClientRect = () => cellRect
								}
							} catch (_) {}
						}

						// Block blur
						const origBlur = HTMLElement.prototype.blur
						HTMLElement.prototype.blur = function () {}

						pc[methodName](...(payload || []))
							.then(async (result: any) => {
								// Restore everything
								HTMLElement.prototype.blur = origBlur
								if (targetElement && origGetBCR) {
									targetElement.getBoundingClientRect = origGetBCR
								}

								await new Promise(r => setTimeout(r, 150))

								// Dispatch Enter to commit
								let target: HTMLElement | null = document.activeElement as HTMLElement
								try {
									const node = pc.selectorMap?.get((payload || [])[0])
									if (node?.ref) target = node.ref as HTMLElement
								} catch (_) {}

								const enterOpts = {
									key: 'Enter', code: 'Enter',
									keyCode: 13, which: 13,
									bubbles: true, cancelable: true
								}
								for (const el of [target, document.activeElement as HTMLElement].filter(Boolean)) {
									el!.dispatchEvent(new KeyboardEvent('keydown', enterOpts))
									el!.dispatchEvent(new KeyboardEvent('keypress', enterOpts))
									el!.dispatchEvent(new KeyboardEvent('keyup', enterOpts))
								}

								// Wait for commit
								await new Promise(r => setTimeout(r, 500))

								// Move cursor to the NEXT cell (after Enter moved selection down)
								try {
									let nextRef = ''
									const nb = document.querySelector('#t-name-box, .docs-name-input, [class*="name-box"]') as HTMLInputElement
									if (nb) nextRef = nb.value || ''
									const nextRect = getCellPosition(nextRef)
									if (nextRect) {
										window.dispatchEvent(new CustomEvent('PageAgent::MovePointerTo', {
											detail: { x: nextRect.left + nextRect.width / 2, y: nextRect.top + nextRect.height / 2 }
										}))
									}
								} catch (_) {}

								sendResponse({
									success: true,
									message: `✅ Typed "${(payload || [])[1]}" and pressed Enter in Google Sheets.`
								})
							})
							.catch((error: any) => {
								HTMLElement.prototype.blur = origBlur
								if (targetElement && origGetBCR) {
									targetElement.getBoundingClientRect = origGetBCR
								}
								sendResponse({
									success: false,
									error: error instanceof Error ? error.message : String(error),
								})
							})
					} else {
						pc[methodName](...(payload || []))
							.then((result: any) => sendResponse(result))
							.catch((error: any) =>
								sendResponse({
									success: false,
									error: error instanceof Error ? error.message : String(error),
								})
							)
					}
					break
				}

				default:
					sendResponse({
						success: false,
						error: `Unknown PAGE_CONTROL action: ${action}`,
					})
			}
		});

		return true
	})
}

function getMethodName(action: string): string {
	switch (action) {
		case 'get_last_update_time':
			return 'getLastUpdateTime' as const
		case 'get_browser_state':
			return 'getBrowserState' as const
		case 'update_tree':
			return 'updateTree' as const
		case 'clean_up_highlights':
			return 'cleanUpHighlights' as const

		// DOM actions

		case 'click_element':
			return 'clickElement' as const
		case 'input_text':
			return 'inputText' as const
		case 'select_option':
			return 'selectOption' as const
		case 'scroll':
			return 'scroll' as const
		case 'scroll_horizontally':
			return 'scrollHorizontally' as const

		default:
			return action
	}
}

