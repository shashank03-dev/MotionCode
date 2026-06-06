export type CodeTab = "CSS" | "GSAP" | "Framer Motion" | "React Spring";

export function escapeCodeForDisplay(code: string): string {
  return code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function fileNameForTab(tab: CodeTab): string {
  const extensions: Record<CodeTab, string> = {
    CSS: "animation.css",
    GSAP: "animation.gsap.js",
    "Framer Motion": "AnimatedComponent.tsx",
    "React Spring": "AnimatedComponent.tsx",
  };

  return extensions[tab];
}
