import type { AnalysisResult } from "@/lib/contracts/motion";
import {
  CODE_TABS,
  type CodeTab,
  getCodeContent,
  highlightCode,
  prettifyCode,
} from "@/lib/generatedCode";

type CodeOutputProps = {
  activeTab: CodeTab;
  copied: boolean;
  onCopy: () => void;
  onDownload: () => void;
  onTabChange: (tab: CodeTab) => void;
  result: AnalysisResult;
};

export function CodeOutput({
  activeTab,
  copied,
  onCopy,
  onDownload,
  onTabChange,
  result,
}: CodeOutputProps) {
  const code = getCodeContent(result, activeTab);

  return (
    <>
      <div
        style={{
          borderBottom: "1px solid #1a1a1a",
          display: "flex",
          gap: 4,
          overflowX: "auto",
          padding: "0 24px",
        }}
      >
        {CODE_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            style={{
              backgroundColor: "transparent",
              border: "none",
              borderBottom: `2px solid ${activeTab === tab ? "#00ff88" : "transparent"}`,
              color: activeTab === tab ? "#00ff88" : "#3a3a4a",
              cursor: "pointer",
              fontFamily: "Space Mono, monospace",
              fontSize: 12,
              padding: "12px 16px",
              whiteSpace: "nowrap",
              transition: "color 0.2s",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div
        style={{
          backgroundColor: "#050505",
          flex: 1,
          overflow: "auto",
          padding: 24,
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 8,
            position: "absolute",
            right: 16,
            top: 16,
          }}
        >
          <OutputButton label="Download" onClick={onDownload} />
          <OutputButton
            label={copied ? "Copied" : "Copy Code"}
            onClick={onCopy}
            tone={copied ? "#47bbedff" : "#fcfcffff"}
          />
        </div>
        <pre
          dangerouslySetInnerHTML={{
            __html: highlightCode(prettifyCode(code, activeTab)),
          }}
          style={{
            color: "#e2e8f0",
            fontFamily: "Space Mono, monospace",
            fontSize: 12.5,
            lineHeight: 1.9,
            margin: 0,
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
          }}
        />
      </div>
    </>
  );
}

type OutputButtonProps = {
  label: string;
  onClick: () => void;
  tone?: string;
};

function OutputButton({ label, onClick, tone = "#fcfcffff" }: OutputButtonProps) {
  return (
    <button
      className="copy-btn"
      onClick={onClick}
      style={{
        backgroundColor: "transparent",
        border: "1px solid #1a1a1a",
        color: tone,
        cursor: "pointer",
        fontFamily: "Space Mono, monospace",
        fontSize: 10,
        padding: "5px 12px",
        transition: "all 0.2s",
      }}
    >
      {label}
    </button>
  );
}
