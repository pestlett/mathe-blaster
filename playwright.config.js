import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:5500',
    headless: true,
    // Keep viewport consistent across tests
    viewport: { width: 1280, height: 800 },
  },
  // Fail fast to save CI time
  reporter: [['list'], ['html', { open: 'never' }]],
  webServer: {
    command: 'npx serve . --listen 5500 --no-clipboard',
    url: 'http://localhost:5500',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
