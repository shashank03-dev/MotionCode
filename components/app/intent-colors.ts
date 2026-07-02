export const INTENT_COLORS: Record<string, string> = {
  entrance: "#9ef0c0",
  exit: "#f58f7c",
  hover: "#ffd166",
  loading: "#d8cfbc",
  loop: "#82e6a0",
  morph: "#00ff88",
};

export const DEFAULT_INTENT_COLOR = "#00ff88";

export function intentColorFor(intent: string) {
  return INTENT_COLORS[intent.toLowerCase()] ?? DEFAULT_INTENT_COLOR;
}
