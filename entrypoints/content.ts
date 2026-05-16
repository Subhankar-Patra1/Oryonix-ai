import { initPageController } from '../agent/RemotePageController.content';
import './content-overlay.css';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_end',

  main() {
    console.debug('[Content] Loaded on', window.location.href);
    injectCursorOverrides();
    initPageController();
  },
});

function injectCursorOverrides() {
  const editUrl = browser.runtime.getURL('/icon/edit.svg');
  const style = document.createElement('style');
  style.textContent = `
    #page-agent-runtime_simulator-mask div[class*="_clicking_"]:has(> [class*="_cursorRipple_"]) {
      background-image: url("${editUrl}") !important;
      background-size: contain !important;
      background-repeat: no-repeat !important;
      width: 38px !important;
      height: 38px !important;
      margin-left: -19px !important;
      margin-top: -1px !important;
      filter:
        drop-shadow(0 0 1px rgba(0,0,0,0.6))
        drop-shadow(0 2px 8px rgba(249,115,22,0.75))
        drop-shadow(0 0 18px rgba(249,115,22,0.55)) !important;
      transform: scale(0.92) !important;
    }
  `;
  document.head.appendChild(style);
}
