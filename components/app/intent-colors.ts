/**
 * Categorical palette for animation intent — these are a legend, not the brand
 * accent, so the hues stay distinguishable from each other rather than all
 * collapsing to the accent blue. Tuned for the near-black canvas: entrance and
 * exit sit opposite (arriving cool / leaving warm), and every value clears
 * 4.5:1 against the panel background.
 */
export const INTENT_COLORS: Record<string, string> = {
  entrance: "#7cc4ff",
  exit: "#f58f7c",
  hover: "#ffd166",
  loading: "#a6a6a6",
  loop: "#5ad6e0",
  morph: "#a78bfa",
};

export const DEFAULT_INTENT_COLOR = "#0099ff";

export function intentColorFor(intent: string) {
  return INTENT_COLORS[intent.toLowerCase()] ?? DEFAULT_INTENT_COLOR;
}
