"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { intentColorFor } from "@/components/app/intent-colors";
import { AnalyzeStudio } from "@/components/app/studio/AnalyzeStudio";
import type { AnalysisResult } from "@/lib/contracts/motion";
import type { CodeTab } from "@/lib/generatedCode";

type SavedAnalysisViewerProps = {
  result: AnalysisResult;
  /** Where "New analysis" sends the user — carries workspace/project context. */
  newAnalysisHref: string;
};

/**
 * Renders a saved analysis exactly as the studio produced it: live preview plus
 * the generated code, read-only. Nothing here can start a new analysis — the
 * studio's "New analysis" button navigates to the analyzer instead.
 */
export function SavedAnalysisViewer({
  result,
  newAnalysisHref,
}: SavedAnalysisViewerProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<CodeTab>("CSS");

  return (
    <div className="h-[72vh] min-h-[480px] overflow-hidden border border-[var(--border)] bg-[#0d0f0b]/85 shadow-[0_18px_44px_rgba(0,0,0,0.22)]">
      <AnalyzeStudio
        key={result.id}
        activeTab={activeTab}
        editable={false}
        intentColor={intentColorFor(result.spec.intent)}
        onNewAnalysis={() => router.push(newAnalysisHref)}
        onSpecChange={() => {}}
        onTabChange={setActiveTab}
        result={result}
      />
    </div>
  );
}
