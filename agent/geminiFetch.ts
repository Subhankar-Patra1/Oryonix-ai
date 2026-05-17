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

  // Track the last function name called so tool responses can mirror it.
  // OpenAI tool messages carry tool_call_id but not always `name`.
  // Gemini requires functionResponse.name === functionCall.name exactly.
  let lastFnName = 'tool'
  // Build a lookup: tool_call_id → function name from assistant messages
  const toolCallIdToName: Record<string, string> = {}
  for (const msg of messages) {
    if (msg.role === 'assistant' && msg.tool_calls?.length) {
      for (const tc of msg.tool_calls) {
        if (tc.id && tc.function?.name) toolCallIdToName[tc.id] = tc.function.name
      }
    }
  }

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
        const parts = msg.tool_calls.map((tc: any) => {
          lastFnName = tc.function.name
          return {
            functionCall: {
              name: tc.function.name,
              args: (() => { try { return JSON.parse(tc.function.arguments) } catch { return {} } })(),
            },
          }
        })
        contents.push({ role: 'model', parts })
      } else {
        contents.push({ role: 'model', parts: [{ text: msg.content ?? '' }] })
      }
      continue
    }

    if (msg.role === 'tool') {
      // Resolve name: prefer id→name map, then msg.name, then lastFnName
      const fnName = (msg.tool_call_id && toolCallIdToName[msg.tool_call_id])
        || msg.name
        || lastFnName
      let output: any
      try { output = JSON.parse(msg.content) } catch { output = { result: msg.content } }
      contents.push({
        role: 'user',
        parts: [{ functionResponse: { name: fnName, response: { output } } }],
      })
    }
  }

  return { systemInstruction, contents }
}

// Gemini only accepts a strict subset of JSON Schema — strip anything it rejects
const GEMINI_UNSUPPORTED_KEYS = new Set([
  'additionalProperties', '$schema', '$id', '$ref', '$defs',
  'default', 'examples', 'if', 'then', 'else', 'not',
  'unevaluatedProperties', 'unevaluatedItems', 'contentEncoding',
  'contentMediaType', 'readOnly', 'writeOnly', 'deprecated',
])

function sanitizeSchema(schema: any): any {
  if (Array.isArray(schema)) return schema.map(sanitizeSchema)
  if (typeof schema !== 'object' || schema === null) return schema

  const out: any = {}
  for (const [k, v] of Object.entries(schema)) {
    if (GEMINI_UNSUPPORTED_KEYS.has(k)) continue
    out[k] = sanitizeSchema(v)
  }
  return out
}

function openAIToolsToGemini(tools: any[]) {
  if (!tools?.length) return undefined
  return [{
    functionDeclarations: tools.map((t: any) => ({
      name: t.function.name,
      description: t.function.description ?? '',
      parameters: sanitizeSchema(t.function.parameters),
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
  return async (_input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const body = JSON.parse((init?.body as string) ?? '{}')
    const { messages, tools, temperature } = body

    const { systemInstruction, contents } = openAIMessagesToGemini(messages ?? [])
    const geminiTools = openAIToolsToGemini(tools)

    const geminiBody: any = {
      contents,
      ...(systemInstruction && { systemInstruction }),
      ...(geminiTools && { tools: geminiTools, toolConfig: { functionCallingConfig: { mode: 'AUTO' } } }),
      generationConfig: { temperature: temperature ?? 0 },
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
