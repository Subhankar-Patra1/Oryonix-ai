{
  "design_system": {
    "colors": {
      "primary": "hsl(210, 100%, 50%)", 
      "background": "hsl(220, 15%, 10%)",
      "surface": "hsl(220, 15%, 15%)",
      "text_primary": "hsl(220, 10%, 95%)",
      "success_glow": "hsla(150, 80%, 50%, 0.4)",
      "recording_red": "hsl(0, 80%, 55%)"
    },
    "typography": {
      "font_family": "Inter, system-ui, sans-serif",
      "base_size": "14px",
      "headings": {
        "h1": "20px font-bold tracking-tight",
        "h2": "16px font-semibold"
      }
    },
    "spacing": {
      "sm": "0.5rem",
      "md": "1rem",
      "lg": "1.5rem"
    }
  },
  "components": [
    {
      "component_name": "AgentStatusGlow",
      "states": ["idle", "thinking", "acting", "error"],
      "props": ["status: AgentState"],
      "accessibility": [
        "Uses aria-live='polite' to announce status changes",
        "Color blindness safe: Uses pulsing animation + text, not just color"
      ]
    },
    {
      "component_name": "MacroRecorderControl",
      "states": ["ready", "recording", "compiling", "playback"],
      "props": ["onStart: function", "onStop: function", "isRecording: boolean"],
      "accessibility": [
        "High contrast focus rings",
        "Keyboard shortcut support (Alt+R to record)"
      ]
    },
    {
      "component_name": "VisionFallbackToggle",
      "states": ["enabled", "disabled", "hardware_unsupported"],
      "props": ["isEnabled: boolean", "vramAvailable: number"],
      "accessibility": [
        "Standard switch role with aria-checked",
        "Clear warning text if hardware is insufficient"
      ]
    }
  ],
  "user_flows": [
    "User opens Side Panel -> Agent Status is Idle -> User clicks 'Record Macro' -> Component turns Red (Recording state) -> User interacts with web page -> User clicks 'Stop' -> Agent compiles `.gsd` JSON -> Displays saved macro in list.",
    "Agent fails DOM selection -> AgentStatus turns 'Thinking' (Vision processing) -> Fallback UI shows 'Gemma 4 processing vision...' -> Agent executes action -> Status returns to Idle."
  ]
}
