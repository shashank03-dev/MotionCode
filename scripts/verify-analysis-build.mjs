import { spawnSync } from "node:child_process";

// Opt-in release check. Uses the deployment environment's own provider key;
// no credentials are exported and the test adapters do not write user data.
if (process.env.MOTIONCODE_VERIFY_ANALYSIS_ON_BUILD === "true") {
  if (!process.env.GEMINI_API_KEY) throw new Error("Missing Gemini key for release verification.");
  const result = spawnSync(process.execPath, [
    "node_modules/vitest/vitest.mjs", "run", "tests/integration/live-analysis.test.ts", "--reporter=verbose",
  ], {
    stdio: "inherit",
    env: { ...process.env, MOTIONCODE_LIVE_ANALYSIS: "1" },
    timeout: 360_000,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
