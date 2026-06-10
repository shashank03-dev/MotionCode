import { Check, Copy, Download } from "lucide-react";

import type { AnalysisResult } from "@/lib/contracts/motion";
import {
  CODE_TABS,
  type CodeTab,
  getCodeContent,
  highlightCode,
  prettifyCode,
} from "@/lib/generatedCode";

import styles from "./CodeOutput.module.css";

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
  const formattedCode = prettifyCode(code, activeTab);
  const activePanelId = `code-panel-${getTabSlug(activeTab)}`;

  return (
    <section className={styles.output} aria-label="Generated code">
      <div className={styles.tabs} role="tablist" aria-label="Output framework">
        {CODE_TABS.map((tab) => (
          <button
            aria-controls={`code-panel-${getTabSlug(tab)}`}
            aria-selected={activeTab === tab}
            className={activeTab === tab ? styles.tabActive : undefined}
            id={`code-tab-${getTabSlug(tab)}`}
            key={tab}
            onClick={() => onTabChange(tab)}
            role="tab"
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>

      <div
        aria-labelledby={`code-tab-${getTabSlug(activeTab)}`}
        className={styles.codePanel}
        id={activePanelId}
        role="tabpanel"
      >
        <div className={styles.actions}>
          <button aria-label="Download code" onClick={onDownload} type="button">
            <Download aria-hidden="true" size={14} />
            Download code
          </button>
          <button
            aria-label="Copy code"
            className={copied ? styles.copied : undefined}
            onClick={onCopy}
            type="button"
          >
            {copied ? (
              <Check aria-hidden="true" size={14} />
            ) : (
              <Copy aria-hidden="true" size={14} />
            )}
            Copy code
          </button>
        </div>
        <pre
          dangerouslySetInnerHTML={{
            __html: highlightCode(formattedCode),
          }}
        />
        <span aria-live="polite" className={styles.srOnly}>
          {copied ? "Code copied" : ""}
        </span>
      </div>
    </section>
  );
}

function getTabSlug(tab: CodeTab) {
  return tab.toLowerCase().replace(/\s+/g, "-");
}
