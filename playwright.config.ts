import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  webServer: {
    command: "npm run dev -- --port 3003",
    url: "http://localhost:3003",
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: "http://localhost:3003",
  },
});
