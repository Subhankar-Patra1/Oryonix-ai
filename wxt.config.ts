import { defineConfig } from 'wxt';
import { existsSync } from 'fs';

const bravePath = 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe';
const hasBrave = existsSync(bravePath);

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    build: {
      rollupOptions: {
        onwarn: function (message, handler) {
          // Suppresses the annoying [EVAL] warning we were seeing in the terminal
          if (message.code === 'EVAL') return;
          handler(message);
        },
      },
    },
  }),
  manifest: {
    name: 'Oryonix AI',
    short_name: 'Oryonix',
    description: 'Your autonomous browser copilot.',
    permissions: ['tabs', 'storage', 'sidePanel', 'tabGroups'],
    host_permissions: ['<all_urls>'],
    side_panel: {
      default_path: 'sidepanel/index.html'
    }
  },
  ...(hasBrave ? {
    webExt: {
      binaries: {
        chrome: bravePath,
      },
    },
  } : {}),
});

