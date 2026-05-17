# Oryonix AI — Privacy Policy (Draft)
**Last Updated: May 2026**

This document outlines how **Oryonix AI** ("the Software," including the core JavaScript library and browser extension) collects, stores, uses, and safeguards user data. 

In strict adherence to the principles of **Data Minimization**, **User Sovereignty**, and **Regulatory Compliance** (such as GDPR and the EU AI Act), Oryonix AI operates under a **local-first** security model.

---

## 1. Executive Summary: Core Privacy Philosophy
* **Zero Telemetry:** We do not track, aggregate, or sell your personal information, browsing history, or AI search queries. We have no centralized database or cloud logging system.
* **100% Data Sovereignty:** Your credentials, task configurations, execution history, and AI configurations are stored securely inside your browser's private local sandbox.
* **Direct Connections:** When cloud-based AI providers are configured, Oryonix AI connects directly to their respective endpoints (e.g., OpenAI, Gemini, Anthropic). Your keys and prompts never pass through any intermediate server managed by us.

---

## 2. Chrome Extension Permissions & Data Access Audit
To provide autonomous multi-tab browser automation, the extension requires specific Chromium permissions. Here is exactly what data is accessed and why:

| Permission | Scope of Access | Purpose & Data Handling |
| :--- | :--- | :--- |
| **`storage`** | Local browser storage APIs | Persists your settings, session history, configured LLM endpoints, and API credentials securely inside `chrome.storage.local`. |
| **`tabs`** | Browser tabs & window attributes | Allows the agent to open new tabs, switch active tabs, group tabs, and navigate URLs to fulfill tasks. |
| **`activeTab`** | Current tab DOM & page structure | Allows the agent to perceive the current web structure, click elements, and enter text *only* on the page you trigger it on. |
| **`scripting`** | Injecting scripts | Executes safe client-side actions (like simulating mouse clicks, scrolls, or keystrokes) directly on the tab DOM. |
| **`sidePanel`** | UI side panel display | Displays the extension panel interface where you type commands, read active execution logs, and manage history. |
| **`tabGroups`** | Tab organization properties | Groups related task tabs dynamically to keep your workspace structured and neat. |
| **`alarms`** | Periodic event alarms | Coordinates minor heartbeat events and periodic task checking. |

---

## 3. Local Storage Schema & Data Control
Oryonix AI stores all task records and AI configs directly in your browser's private sandbox:

1. **`local:oryonix_history`:** Stores your search queries, completed tasks, and execution logs.
2. **`local:oryonix_live_session`:** Manages transient, real-time runtime state and active agent coordinates.
3. **`llmConfig` & `advancedConfig`:** Stores your configured API key credentials, Ollama endpoints, and preference tokens.
4. **`language`:** Persists your interface and speech recognition settings.

### Your Right to Deletion (GDPR Article 17)
Because all data is stored locally on your machine, you have absolute control over your digital footprint. You can instantly wipe all local data, configuration details, and execution logs at any time:
1. By clicking **"Clear History"** inside the sidepanel settings.
2. Or by standard Chrome extension options (removing the extension completely purges its local database).

---

## 4. AI Prompt Routing & Security Architecture

### A. Local LLM / Ollama (Offline Mode - Planned Future Feature)
* **How it works:** When configured to use Ollama in the future (e.g., `http://localhost:11434`), Oryonix AI will operate entirely offline inside your local network.
* **Privacy Impact:** Zero internet routing. 100% of your prompts, dynamic page snapshots, and action logic will be processed locally on your machine.

### B. Bring Your Own Key (BYOK) Cloud Routing (Planned Future Feature)
* **How it works:** **Once the BYOK feature is active**, when cloud APIs (OpenAI, Gemini, Anthropic, Groq, Mistral) are selected, Oryonix AI will issue direct HTTPS queries to the respective official APIs.
* **Privacy Impact:** Your configured API credentials will be saved only in `chrome.storage.local`. We will not log, intercept, or proxy your prompts. Prompts will be subject to the third-party providers' respective data privacy policies (e.g., enterprise APIs usually exempt your prompts from training).

### C. Public Testing API (Web Demo & Sandbox Only)
* **How it works:** In the rapid web evaluation sandbox or demo CDN scripts, Oryonix AI leverages a public testing API for research.
* **Privacy Impact:** **Do not enter confidential data.** The testing API processes queries on temporary instances located in Mainland China. PII, passwords, medical logs, or secure portal pages must never be processed using this public evaluation API.

---

## 5. GDPR & Compliance Guardrails
* **Data Minimization:** Oryonix AI reads *only* the web structures necessary to achieve the task. It does not scan background tabs or collect general browsing behavior.
* **Mandatory Consent:** The agent remains idle until you explicitly trigger a task or direct it to read a page.
* **Emergency Halt:** You maintain physical control. You can sever connections and stop execution immediately by closing the side panel or active tab.
