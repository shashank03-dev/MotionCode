/**
 * Categorical palette for animation intent — these are a legend, not the brand
 * accent, so the hues stay distinguishable from each other rather than all
 * collapsing to the safelight accent. Tuned for the near-black canvas: entrance and
 * exit sit opposite (arriving cool / leaving warm), and every value clears
 * 4.5:1 against the panel background.
 */
export const INTENT_COLORS: Record<string, string> = {
  entrance: "#7cc4ff",
  exit: "#e9a3c9",
  hover: "#ffd166",
  loading: "#a5a297",
  loop: "#7fd6c9",
  morph: "#b9a6ff",
};

export const DEFAULT_INTENT_COLOR = "#ff5b1f";

export function intentColorFor(intent: string) {
  return INTENT_COLORS[intent.toLowerCase()] ?? DEFAULT_INTENT_COLOR;
}
