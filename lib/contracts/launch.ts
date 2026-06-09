export const LAUNCH_PHASES = ["beta", "paid"] as const;

export type LaunchPhase = (typeof LAUNCH_PHASES)[number];

type EnvLike = Record<string, string | undefined>;

export function getLaunchPhase(env: EnvLike = process.env): LaunchPhase {
  return env.MOTIONCODE_LAUNCH_PHASE === "paid" ? "paid" : "beta";
}

export function isEarlyAccessEnabled(env: EnvLike = process.env) {
  return getLaunchPhase(env) === "beta";
}

export function isPaidCheckoutEnabled(env: EnvLike = process.env) {
  return (
    getLaunchPhase(env) === "paid" &&
    env.MOTIONCODE_ENABLE_PAID_CHECKOUT === "true"
  );
}

export function isOpenAiAnalysisEnabled(env: EnvLike = process.env) {
  return (
    getLaunchPhase(env) === "paid" &&
    env.MOTIONCODE_ENABLE_OPENAI_ANALYSIS === "true"
  );
}
