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

/**
 * Lightweight, syntax-aware formatter for generated snippets. It only inserts
 * line breaks after `{` / `;` and before `}` at statement level, then
 * re-indents by bracket depth. Strings, template literals, comments and regex
 * literals are never touched, so formatting can't change what the code does,
 * and running it twice yields the same output.
 */
export function prettifyCode(code: string, tab: CodeTab): string {
  if (!code) {
    return "";
  }

  const isJs = tab !== "CSS";
  try {
    // Hand-structured JS (multi-line, readable widths) only gets re-indented;
    // re-breaking it would mangle JSX and import lists. Minified one-liners
    // and all CSS get statement breaks first.
    const lines = code.split("\n");
    const minified = lines.length <= 2 || lines.some((line) => line.length > 160);
    const broken = !isJs || minified ? breakStatements(code, isJs) : code;
    return reindent(broken, isJs);
  } catch {
    return code;
  }
}

type ScanState = "code" | "single" | "double" | "template" | "block" | "line" | "regex";

/**
 * Walk `code` once, calling `visit` for every character that sits in plain
 * code (outside strings/comments/regex) along with the current paren depth.
 */
function scanCode(
  code: string,
  isJs: boolean,
  visit: (char: string, index: number, parenDepth: number) => void,
  onLineStart?: (index: number, state: ScanState) => void,
) {
  let state: ScanState = "code";
  let parenDepth = 0;
  let lastSignificant = "";
  onLineStart?.(0, state);

  for (let i = 0; i < code.length; i += 1) {
    const char = code[i];
    const next = code[i + 1];
    if (char === "\n") onLineStart?.(i + 1, state === "line" ? "code" : state);

    switch (state) {
      case "single":
      case "double":
      case "template": {
        const quote = state === "single" ? "'" : state === "double" ? '"' : "`";
        if (char === "\\") i += 1;
        else if (char === quote || (char === "\n" && state !== "template")) state = "code";
        continue;
      }
      case "regex":
        if (char === "\\") i += 1;
        else if (char === "/" || char === "\n") state = "code";
        continue;
      case "block":
        if (char === "*" && next === "/") {
          state = "code";
          i += 1;
        }
        continue;
      case "line":
        if (char === "\n") state = "code";
        continue;
      default:
        break;
    }

    if (char === "/" && next === "*") {
      state = "block";
      i += 1;
      continue;
    }
    if (isJs && char === "/" && next === "/") {
      state = "line";
      i += 1;
      continue;
    }
    if (isJs && char === "/" && (lastSignificant === "" || /[(,=:[!&|?{};+\-*%<>~^]/.test(lastSignificant))) {
      state = "regex";
      continue;
    }
    if (char === "'") state = "single";
    else if (char === '"') state = "double";
    else if (isJs && char === "`") state = "template";

    if (state !== "code") {
      lastSignificant = char;
      continue;
    }
    if (char === "(") parenDepth += 1;
    if (char === ")") parenDepth = Math.max(0, parenDepth - 1);
    visit(char, i, parenDepth);
    if (!/\s/.test(char)) lastSignificant = char;
  }
}

function breakStatements(code: string, isJs: boolean): string {
  const breakAfter = new Set<number>();
  const breakBefore = new Set<number>();
  const spaceBefore = new Set<number>();

  // Short, flat brace pairs ({ opacity: 0 }, import { motion }) stay inline.
  const inline = new Set<number>();
  const stack: number[] = [];
  scanCode(code, isJs, (char, index) => {
    if (char === "{") stack.push(index);
    else if (char === "}") {
      const open = stack.pop();
      if (open === undefined) return;
      const inner = code.slice(open + 1, index);
      if (isJs && inner.length <= 60 && !/[{};\n]/.test(inner)) {
        inline.add(open);
        inline.add(index);
      }
    }
  });

  scanCode(code, isJs, (char, index, parenDepth) => {
    if (!isJs && char === "{" && /\S/.test(code[index - 1] ?? "")) {
      spaceBefore.add(index);
    }
    if (parenDepth > 0 || inline.has(index)) return;
    if (char === "{" || char === ";") {
      const rest = code.slice(index + 1).match(/^[ \t]*(.)/);
      // Keep `{}` together and leave already-broken lines alone.
      if (rest && rest[1] !== "\n" && !(char === "{" && rest[1] === "}")) {
        breakAfter.add(index);
      }
    } else if (char === "}") {
      const lineSoFar = code.slice(code.lastIndexOf("\n", index - 1) + 1, index);
      if (lineSoFar.trim() && !/\{[ \t]*$/.test(lineSoFar)) breakBefore.add(index);
      const rest = code.slice(index + 1).match(/^[ \t]*(.*)/);
      const following = rest?.[1] ?? "";
      // `} else`, `});`, `},` and friends stay on the closing line.
      if (following && !/^([;,).\]}]|else\b|catch\b|finally\b|while\b)/.test(following)) {
        breakAfter.add(index);
      }
    }
  });

  let out = "";
  for (let i = 0; i < code.length; i += 1) {
    if (breakBefore.has(i)) out = `${out.replace(/[ \t]+$/, "")}\n`;
    else if (spaceBefore.has(i)) out += " ";
    out += code[i];
    if (breakAfter.has(i)) {
      out += "\n";
      while (code[i + 1] === " " || code[i + 1] === "\t") i += 1;
    }
  }
  return out;
}

function reindent(code: string, isJs: boolean): string {
  // Which lines start inside a string/comment (and must keep their text).
  const lineStarts: Array<{ index: number; preserve: boolean }> = [];
  scanCode(
    code,
    isJs,
    () => undefined,
    (index, state) => {
      lineStarts.push({ index, preserve: state === "template" || state === "block" });
    },
  );

  // Net bracket depth change contributed by each character, outside strings.
  const depthAt = new Map<number, number>();
  scanCode(code, isJs, (char, index) => {
    if (char === "{" || char === "[" || char === "(") depthAt.set(index, 1);
    else if (char === "}" || char === "]" || char === ")") depthAt.set(index, -1);
  });

  const lines = code.split("\n");
  const out: string[] = [];
  let depth = 0;
  let offset = 0;
  lines.forEach((line, lineIndex) => {
    const start = offset;
    offset += line.length + 1;
    const preserve = lineStarts[lineIndex]?.preserve ?? false;
    const trimmed = line.trim();

    let leadingClosers = 0;
    for (let i = 0; i < line.length; i += 1) {
      const delta = depthAt.get(start + i);
      if (/\s/.test(line[i])) continue;
      if (delta === -1) leadingClosers += 1;
      else break;
    }

    if (preserve) out.push(line.replace(/[ \t]+$/, ""));
    else if (!trimmed) out.push("");
    else out.push(`${"  ".repeat(Math.max(0, depth - leadingClosers))}${trimmed}`);

    for (let i = 0; i < line.length; i += 1) {
      depth = Math.max(0, depth + (depthAt.get(start + i) ?? 0));
    }
  });

  return out
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
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
      return `<span style="color: #ff8a5c">${escaped}</span>`;
    case "string":
      return `<span style="color: #ff8a5c">${escaped}</span>`;
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
