{
  "architecture": "Oryonix AI is a Hybrid Edge-Agent architecture. It splits execution between a lightweight WXT Chrome Extension (using WASM for low-latency DOM processing) and a robust Local Daemon (utilizing CUDA for Gemma 4 Multimodal Vision inference). Communication occurs over local WebSockets to ensure zero external network data transmission. Background task orchestration relies on the `chrome.offscreen` API to bypass Chrome tab throttling.",
  "microservices": [
    {
      "name": "Oryonix Local Daemon",
      "responsibility": "Hosts Gemma 4 in VRAM using CUDA. Provides Vision analysis endpoints via local WebSockets.",
      "stack": "Python/Go, CUDA, PyTorch/ONNX, WebSockets"
    },
    {
      "name": "Extension Core (WXT + React)",
      "responsibility": "Executes CDP commands, manages Auth contexts, runs the Pentarchy multi-agent MAS logic.",
      "stack": "WXT, TypeScript, WASM"
    },
    {
      "name": "Background Orchestrator",
      "responsibility": "Spawns hidden offscreen documents to process multi-tab parallel operations.",
      "stack": "chrome.offscreen API, Web Workers"
    },
    {
      "name": "MacroRecorder",
      "responsibility": "Intercepts user events (clicks/scrolls) and compiles them into reusable `.gsd` scripts.",
      "stack": "Chrome Event Listeners, WASM AST Compiler"
    }
  ],
  "api_contracts": [
    {
      "endpoint": "WS /v1/vision/perceive",
      "method": "SEND",
      "payload": {
        "screenshot_base64": "string",
        "viewport_bounds": "object",
        "dom_fallback": "string"
      },
      "response": {
        "elements": "array",
        "suggested_action": "object"
      }
    },
    {
      "endpoint": "POST /v1/orchestrator/dispatch",
      "method": "POST",
      "payload": {
        "task_id": "string",
        "url": "string",
        "macro_script": "string"
      },
      "response": {
        "worker_id": "string",
        "status": "string"
      }
    }
  ],
  "db_schema": {
    "local_storage": {
      "macros": {
        "macro_id": "string",
        "name": "string",
        "actions": "array"
      },
      "agent_memory": {
        "session_id": "string",
        "history": "array"
      }
    }
  },
  "failure_points": [
    {
      "point": "WebSocket disconnection between Extension and Local Daemon",
      "mitigation": "Exponential backoff auto-reconnect; fallback to pure DOM interaction if Vision is offline."
    },
    {
      "point": "CUDA Out-Of-Memory (OOM) on local Daemon",
      "mitigation": "Dynamic KV cache limits; queue vision tasks instead of parallel processing on the GPU."
    },
    {
      "point": "WASM module memory leaks in extension",
      "mitigation": "Force WebWorker termination and respawn after every 10 macro executions."
    }
  ]
}
