"use client";

import { Trash2 } from "lucide-react";
import { useEffect, useRef } from "react";

import type { ConsoleEntry } from "@/lib/preview/types";
import { cn } from "@/lib/utils";

const LEVEL_STYLES: Record<ConsoleEntry["level"], string> = {
  log: "text-ink",
  info: "text-accent",
  warn: "text-[#ffd166]",
  error: "text-[#f58f7c]",
};

const LEVEL_LABEL: Record<ConsoleEntry["level"], string> = {
  log: "›",
  info: "i",
  warn: "!",
  error: "✕",
};

export function ConsolePanel({
  entries,
  onClear,
}: {
  entries: ConsoleEntry[];
  onClear: () => void;
}) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [entries.length]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#0a0b0d]">
      <div className="flex items-center justify-between border-b border-hairline px-3 py-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3">
          {entries.length} message{entries.length === 1 ? "" : "s"}
        </span>
        <button
          type="button"
          onClick={onClear}
          disabled={entries.length === 0}
          className="inline-flex items-center gap-1 font-mono text-[10px] text-ink-3 transition hover:text-ink disabled:opacity-40"
        >
          <Trash2 className="size-3" />
          Clear
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto px-3 py-2 font-mono text-[11px] leading-relaxed">
        {entries.length === 0 ? (
          <p className="text-ink-3">No console output. Logs and errors from the preview appear here.</p>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="flex gap-2 border-b border-hairline/40 py-1">
              <span className={cn("select-none", LEVEL_STYLES[entry.level])}>
                {LEVEL_LABEL[entry.level]}
              </span>
              <pre className={cn("m-0 whitespace-pre-wrap break-words", LEVEL_STYLES[entry.level])}>
                {entry.text}
              </pre>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
