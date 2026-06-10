import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDir = fileURLToPath(new URL(".", import.meta.url));
const serverOnlyMock = fileURLToPath(
  new URL("./tests/mocks/server-only.ts", import.meta.url),
);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": rootDir,
      "server-only": serverOnlyMock,
    },
  },
  test: {
    environment: "jsdom",
    exclude: ["**/node_modules/**", "**/e2e/**", "**/tests/e2e/**"],
  },
});
