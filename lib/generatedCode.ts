import type {
  AnalysisResult,
  GeneratedOutput,
  OutputFramework,
} from "@/lib/contracts/motion";

export const CODE_TABS = [
  "CSS",
  "GSAP",
  "Framer Motion",
  "React Spring",
] as const;

export type CodeTab = (typeof CODE_TABS)[number];

const TAB_FRAMEWORKS: Record<CodeTab, OutputFramework> = {
  CSS: "css",
  "Framer Motion": "framer-motion",
  GSAP: "gsap",
  "React Spring": "react-spring",
};

const DOWNLOAD_FILENAMES: Record<CodeTab, string> = {
  CSS: "animation.css",
  "Framer Motion": "AnimatedComponent.tsx",
  GSAP: "animation.gsap.js",
  "React Spring": "AnimatedComponent.tsx",
};

export function getFrameworkForTab(tab: CodeTab) {
  return TAB_FRAMEWORKS[tab];
}

export function getDownloadFilename(tab: CodeTab) {
  return DOWNLOAD_FILENAMES[tab];
}

export function getGeneratedOutput(
  result: AnalysisResult | null,
  tab: CodeTab,
): GeneratedOutput | undefined {
  return result?.outputs.find((output) => output.framework === TAB_FRAMEWORKS[tab]);
}

export function getCodeContent(result: AnalysisResult | null, tab: CodeTab) {
  return getGeneratedOutput(result, tab)?.code ?? "";
}

export function prettifyCode(code: string, tab: CodeTab): string {
  if (!code) {
    return "";
  }

  try {
    if (tab === "CSS") {
      return code
        .replace(/\{/g, " {\n  ")
        .replace(/\}/g, "\n}\n")
        .replace(/;/g, ";\n  ")
        .replace(/  \n\}/g, "\n}")
        .replace(/@keyframes/g, "\n@keyframes")
        .replace(/@media/g, "\n@media")
        .trim();
    }

    if (tab === "GSAP") {
      return code
        .replace(/;/g, ";\n")
        .replace(/\{/g, "{\n  ")
        .replace(/\}/g, "\n}")
        .trim();
    }

    if (tab === "Framer Motion" || tab === "React Spring") {
      return code
        .replace(/;/g, ";\n")
        .replace(/\{/g, "{\n  ")
        .replace(/\}/g, "\n}")
        .replace(/,/g, ",\n  ")
        .trim();
    }

    return code;
  } catch {
    return code;
  }
}

export function highlightCode(code: string) {
  if (!code) {
    return "";
  }

  const tokens: Array<{ type: TokenType; value: string }> = [];
  const regex =
    /(".*?"|'.*?'|\/\/.*|\/\*[\s\S]*?\*\/|\b(?:\d+\.?\d*(?:ms|s|px|%|vw|vh|rem)?)\b|\b(?:const|let|var|return|import|from|export|function|async|await|new|true|false)\b|\b(?:duration|ease|transform|opacity|scale)\b)/g;

  let match: RegExpExecArray | null;
  let lastIndex = 0;

  while ((match = regex.exec(code)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: "text", value: code.slice(lastIndex, match.index) });
    }

    tokens.push({ type: classifyToken(match[0]), value: match[0] });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < code.length) {
    tokens.push({ type: "text", value: code.slice(lastIndex) });
  }

  return tokens.map(renderToken).join("");
}

type TokenType = "comment" | "keyword" | "number" | "property" | "string" | "text";

function classifyToken(value: string): TokenType {
  if (value.startsWith('"') || value.startsWith("'")) {
    return "string";
  }

  if (value.startsWith("//") || value.startsWith("/*")) {
    return "comment";
  }

  if (/^\d/.test(value)) {
    return "number";
  }

  if (/^(const|let|var|return|import|from|export|function|async|await|new|true|false)$/.test(value)) {
    return "keyword";
  }

  if (/^(duration|ease|transform|opacity|scale)$/.test(value)) {
    return "property";
  }

  return "text";
}

function renderToken(token: { type: TokenType; value: string }) {
  const escaped = escapeHtml(token.value);

  switch (token.type) {
    case "comment":
      return `<span style="color: #3a3a4a">${escaped}</span>`;
    case "keyword":
      return `<span style="color: #c084fc">${escaped}</span>`;
    case "number":
      return `<span style="color: #fb923c">${escaped}</span>`;
    case "property":
      return `<span style="color: #38bdf8">${escaped}</span>`;
    case "string":
      return `<span style="color: #a3e635">${escaped}</span>`;
    default:
      return escaped;
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
