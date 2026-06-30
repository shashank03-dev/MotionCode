"use client";

import { Check, Copy, Download, Lock, Play, RotateCcw, Wand2 } from "lucide-react";
import Link from "next/link";

import type { CodeTab } from "@/lib/generatedCode";
import { cn } from "@/lib/utils";

import { CodeMirrorEditor, type EditorLanguage } from "./CodeMirrorEditor";

type EditorPaneProps = {
  tabs: readonly CodeTab[];
  activeTab: CodeTab;
  onTabChange: (tab: CodeTab) => void;
  value: string;
  language: EditorLanguage;
  dirty: boolean;
  copied: boolean;
  /** When false (free tier) the editor is read-only: Copy only, no edit/export. */
  editable: boolean;
  onChange: (value: string) => void;
  onRun: () => void;
  onFormat: () => void;
  onReset: () => void;
  onCopy: () => void;
  onDownload: () => void;
};

function fileLabel(tab: CodeTab): string {
  switch (tab) {
    case "CSS":
      return "animation.css";
    case "GSAP":
      return "animation.gsap.js";
    default:
      return "AnimatedComponent.tsx";
  }
}

export function EditorPane({
  tabs,
  activeTab,
  onTabChange,
  value,
  language,
  dirty,
  copied,
  editable,
  onChange,
  onRun,
  onFormat,
  onReset,
  onCopy,
  onDownload,
}: EditorPaneProps) {
  return (
    <section
      className="flex h-full min-h-0 min-w-0 flex-col bg-[#0d0f0b]/70"
      aria-label="Generated code editor"
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] px-3 py-2">
        <div className="flex min-w-0 items-center gap-2 font-mono text-[11px] text-[var(--muted)]">
          <span className="truncate text-[var(--accent)]">{fileLabel(activeTab)}</span>
          {editable && dirty ? (
            <span className="inline-flex size-1.5 shrink-0 rounded-full bg-[#00ff88]" title="Unsaved edits" />
          ) : null}
          {!editable ? (
            <span className="inline-flex shrink-0 items-center gap-1 text-[var(--muted)]">
              <Lock className="size-3" aria-hidden="true" />
              Read-only
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-1">
          {editable ? (
            <>
              <ToolbarButton label="Format" onClick={onFormat} icon={Wand2} />
              <ToolbarButton
                label={copied ? "Copied" : "Copy"}
                onClick={onCopy}
                icon={copied ? Check : Copy}
                active={copied}
              />
              <ToolbarButton label="Download" onClick={onDownload} icon={Download} />
              <ToolbarButton label="Reset" onClick={onReset} icon={RotateCcw} disabled={!dirty} />
              <button
                type="button"
                onClick={onRun}
                className="ml-1 inline-flex h-7 items-center gap-1.5 rounded-md border border-[var(--accent-border)] bg-[var(--accent-dim)] px-2.5 font-mono text-[11px] text-[var(--text)] transition hover:border-[#00ff88] hover:bg-[#00ff88]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                title="Run (Cmd/Ctrl+Enter)"
              >
                <Play className="size-3.5" />
                Run
              </button>
            </>
          ) : (
            <>
              <Link
                href="/pricing"
                className="inline-flex h-7 items-center gap-1.5 rounded-md border border-transparent px-2 font-mono text-[11px] text-[var(--muted)] transition hover:text-[var(--text)]"
                title="Upgrade to edit & export"
              >
                Upgrade to edit
              </Link>
              <ToolbarButton
                label={copied ? "Copied" : "Copy"}
                onClick={onCopy}
                icon={copied ? Check : Copy}
                active={copied}
              />
            </>
          )}
        </div>
      </div>

      {/* Framework tabs */}
      <div
        className="flex items-center gap-0.5 overflow-x-auto border-b border-[var(--border)] px-2"
        role="tablist"
        aria-label="Output framework"
      >
        {tabs.map((tab) => {
          const isActive = tab === activeTab;
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(tab)}
              className={cn(
                "relative shrink-0 px-3 py-2 font-mono text-[11px] transition-colors",
                isActive
                  ? "text-[var(--text)]"
                  : "text-[var(--muted)] hover:text-[var(--accent)]",
              )}
            >
              {tab}
              {isActive ? (
                <span className="absolute inset-x-2 bottom-0 h-px bg-[#00ff88]" />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Editor */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <CodeMirrorEditor
          value={value}
          language={language}
          editable={editable}
          onChange={onChange}
          onRun={onRun}
        />
      </div>
    </section>
  );
}

function ToolbarButton({
  label,
  onClick,
  icon: Icon,
  active,
  disabled,
}: {
  label: string;
  onClick: () => void;
  icon: typeof Copy;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-md border border-transparent px-2 font-mono text-[11px] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]",
        active
          ? "text-[#00ff88]"
          : "text-[var(--muted)] hover:border-[var(--border)] hover:text-[var(--text)]",
        disabled ? "cursor-not-allowed opacity-40 hover:border-transparent hover:text-[var(--muted)]" : "",
      )}
    >
      <Icon className="size-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
