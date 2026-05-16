/**
 * Proxy fetch for Gemma/Gemini models via the native generateContent API.
 * The OpenAI-compatible endpoint doesn't support Gemma 4, so we intercept
 * the OpenAI-format request, translate it, call the native API, and return
 * a synthetic OpenAI-format response — fully transparent to the LLM client.
 */

function openAIMessagesToGemini(messages: any[]) {
  const systemMsg = messages.find((m) => m.role === 'system')
  const systemInstruction = systemMsg
    ? { parts: [{ text: systemMsg.content }] }
    : undefined

  const contents: any[] = []

  for (const msg of messages) {
    if (msg.role === 'system') continue

    if (msg.role === 'user') {
      const text = typeof msg.content === 'string'
        ? msg.content
        : (msg.content as any[]).map((c: any) => c.text ?? '').join('')
      contents.push({ role: 'user', parts: [{ text }] })
      continue
    }

    if (msg.role === 'assistant') {
      if (msg.tool_calls?.length) {
        const parts = msg.tool_calls.map((tc: any) => ({
          functionCall: {
            name: tc.function.name,
            args: (() => { try { return JSON.parse(tc.function.arguments) } catch { return {} } })(),
          },
        }))
        contents.push({ role: 'model', parts })
      } else {
        contents.push({ role: 'model', parts: [{ text: msg.content ?? '' }] })
      }
      continue
    }

    if (msg.role === 'tool') {
      let output: any
      try { output = JSON.parse(msg.content) } catch { output = { result: msg.content } }
      contents.push({
        role: 'user',
        parts: [{ functionResponse: { name: msg.name ?? 'tool', response: { output } } }],
      })
    }
  }

  return { systemInstruction, contents }
}

function openAIToolsToGemini(tools: any[]) {
  if (!tools?.length) return undefined
  return [{
    functionDeclarations: tools.map((t: any) => ({
      name: t.function.name,
      description: t.function.description ?? '',
      parameters: t.function.parameters,
    })),
  }]
}

function geminiResponseToOpenAI(data: any, model: string) {
  const candidate = data.candidates?.[0]
  const parts: any[] = candidate?.content?.parts ?? []

  const functionCallPart = parts.find((p: any) => p.functionCall)
  const textPart = parts.find((p: any) => typeof p.text === 'string')

  let message: any
  if (functionCallPart) {
    message = {
      role: 'assistant',
      content: null,
      tool_calls: [{
        id: `call_${Date.now()}`,
        type: 'function',
        function: {
          name: functionCallPart.functionCall.name,
          arguments: JSON.stringify(functionCallPart.functionCall.args ?? {}),
        },
      }],
    }
  } else {
    message = { role: 'assistant', content: textPart?.text ?? '' }
  }

  return {
    id: `chatcmpl-gemini-${Date.now()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [{ index: 0, message, finish_reason: functionCallPart ? 'tool_calls' : 'stop' }],
    usage: {
      prompt_tokens: data.usageMetadata?.promptTokenCount ?? 0,
      completion_tokens: data.usageMetadata?.candidatesTokenCount ?? 0,
      total_tokens: data.usageMetadata?.totalTokenCount ?? 0,
    },
  }
}

export function createGeminiFetch(apiKey: string, model: string): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const body = JSON.parse((init?.body as string) ?? '{}')
    const { messages, tools, temperature } = body

    const { systemInstruction, contents } = openAIMessagesToGemini(messages ?? [])
    const geminiTools = openAIToolsToGemini(tools)

    const geminiBody: any = {
      contents,
      ...(systemInstruction && { systemInstruction }),
      ...(geminiTools && { tools: geminiTools, toolConfig: { functionCallingConfig: { mode: 'ANY' } } }),
      generationConfig: { temperature: temperature ?? 0.7 },
    }

    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody),
      signal: init?.signal as AbortSignal | undefined,
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('[geminiFetch] API error', response.status, errText)
      return new Response(errText, { status: response.status, headers: { 'Content-Type': 'application/json' } })
    }

    const data = await response.json()
    const openAIFormat = geminiResponseToOpenAI(data, model)

    return new Response(JSON.stringify(openAIFormat), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
