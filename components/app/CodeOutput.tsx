import { useState } from "react";
import type { AnimationAnalysisResult } from "@/lib/animationResult";
import { escapeCodeForDisplay, fileNameForTab, type CodeTab } from "@/lib/generatedCode";

const codeTabs: CodeTab[] = ["CSS", "GSAP", "Framer Motion", "React Spring"];

type CodeOutputProps = {
  result: AnimationAnalysisResult;
  activeTab: CodeTab;
  onTabChange: (tab: CodeTab) => void;
};

function prettifyCode(code: string, tab: CodeTab): string {
  if (!code) return "";

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

function getCodeContent(result: AnimationAnalysisResult, activeTab: CodeTab) {
  switch (activeTab) {
    case "CSS":
      return result.css;
    case "GSAP":
      return result.gsap;
    case "Framer Motion":
      return result.framer_motion;
    case "React Spring":
      return result.react_spring;
    default:
      return "";
  }
}

function highlightCode(code: string) {
  if (!code) return "";
  const tokens: { type: string; value: string }[] = [];
  const regex = /(".*?"|'.*?'|\/\/.*|\/\*[\s\S]*?\*\/|\b(?:\d+\.?\d*(?:ms|s|px|%|vw|vh|rem)?)\b|\b(?:const|let|var|return|import|from|export|function|async|await|new|true|false)\b|\b(?:duration|ease|transform|opacity|scale)\b)/g;

  let match;
  let lastIndex = 0;
  while ((match = regex.exec(code)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: "text", value: code.slice(lastIndex, match.index) });
    }

    const val = match[0];
    let type = "text";
    if (val.startsWith("\"") || val.startsWith("'")) type = "string";
    else if (val.startsWith("//") || val.startsWith("/*")) type = "comment";
    else if (/^\d/.test(val)) type = "number";
    else if (/^(const|let|var|return|import|from|export|function|async|await|new|true|false)$/.test(val)) type = "keyword";
    else if (/^(duration|ease|transform|opacity|scale)$/.test(val)) type = "property";

    tokens.push({ type, value: val });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < code.length) {
    tokens.push({ type: "text", value: code.slice(lastIndex) });
  }

  return tokens.map((token) => {
    const escaped = escapeCodeForDisplay(token.value);
    switch (token.type) {
      case "string":
        return `<span style="color: #a3e635">${escaped}</span>`;
      case "comment":
        return `<span style="color: #3a3a4a">${escaped}</span>`;
      case "number":
        return `<span style="color: #fb923c">${escaped}</span>`;
      case "keyword":
        return `<span style="color: #c084fc">${escaped}</span>`;
      case "property":
        return `<span style="color: #38bdf8">${escaped}</span>`;
      default:
        return escaped;
    }
  }).join("");
}

export function CodeOutput({ result, activeTab, onTabChange }: CodeOutputProps) {
  const [copied, setCopied] = useState(false);
  const codeContent = getCodeContent(result, activeTab);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([codeContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileNameForTab(activeTab);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div style={{ borderBottom: "1px solid #1a1a1a", padding: "0 24px", display: "flex", gap: 4 }}>
        {codeTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            style={{
              fontFamily: "Space Mono, monospace", fontSize: 12, padding: "12px 16px",
              backgroundColor: "transparent", cursor: "pointer", border: "none",
              borderBottom: `2px solid ${activeTab === tab ? "#00ff88" : "transparent"}`,
              color: activeTab === tab ? "#00ff88" : "#3a3a4a",
              transition: "color 0.2s"
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: "auto", position: "relative", backgroundColor: "#050505", padding: 24 }}>
        <div style={{ position: "absolute", top: 16, right: 16, display: "flex", gap: 8 }}>
          <button
            className="copy-btn"
            onClick={handleDownload}
            style={{
              fontFamily: "Space Mono, monospace", fontSize: 10,
              color: "#fcfcffff", border: "1px solid #1a1a1a", padding: "5px 12px",
              backgroundColor: "transparent", cursor: "pointer", transition: "all 0.2s"
            }}
          >
            Download
          </button>
          <button
            className="copy-btn"
            onClick={handleCopy}
            style={{
              fontFamily: "Space Mono, monospace", fontSize: 10,
              color: copied ? "#47bbedff" : "#fcfcffff", border: "1px solid #1a1a1a", padding: "5px 12px",
              backgroundColor: "transparent", cursor: "pointer", transition: "all 0.2s"
            }}
          >
            {copied ? "✓ Copied" : "Copy Code"}
          </button>
        </div>
        <pre style={{
          margin: 0, fontFamily: "Space Mono, monospace", fontSize: 12.5, lineHeight: 1.9,
          color: "#e2e8f0", whiteSpace: "pre-wrap", wordBreak: "break-all"
        }} dangerouslySetInnerHTML={{ __html: highlightCode(prettifyCode(codeContent, activeTab)) }} />
      </div>
    </>
  );
}
