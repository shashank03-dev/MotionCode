"use client";

import { CornerDownLeft, Folder, Loader2, type LucideIcon } from "lucide-react";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import { useEffect } from "react";

import { cn } from "@/lib/utils";

type InlineCreateResult = { ok: true } | { ok: false; message: string };

type InlineCreateProps = {
  placeholder: string;
  onSubmit: (value: string) => Promise<InlineCreateResult>;
  onClose: () => void;
  /** Leading glyph, so the field reads as the row it is about to become. */
  icon?: LucideIcon;
  /** Visual indent (px) so nested project inputs line up under their workspace. */
  indent?: number;
};

/**
 * A single-line inline editor used to create a workspace or a project from
 * inside the explorer tree. It mirrors a tree row (leading icon, row height,
 * type scale) so the field reads as the item it is about to become. Enter
 * submits, Escape cancels, blur cancels when empty; errors surface on the field
 * and clear as soon as the user edits.
 */
export function InlineCreate({
  placeholder,
  onSubmit,
  onClose,
  icon: Icon = Folder,
  indent = 0,
}: InlineCreateProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const errorId = useId();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function submit() {
    const trimmed = value.trim();
    if (!trimmed || submitting) {
      if (!trimmed) onClose();
      return;
    }

    setSubmitting(true);
    setError(null);
    const result = await onSubmit(trimmed);
    if (result.ok) {
      onClose();
      return;
    }

    setSubmitting(false);
    setError(result.message);
    inputRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      void submit();
    } else if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
  }

  const hasValue = value.trim().length > 0;

  return (
    <div style={{ paddingLeft: indent }} className="px-2 py-1">
      <div
        className={cn(
          "flex min-h-[44px] items-center gap-2 rounded-[3px] border bg-[#0a0b0d] pl-2 pr-1.5 transition-colors",
          "focus-within:shadow-[0_0_0_3px_var(--accent-dim)]",
          error
            ? "border-[var(--danger-border)] focus-within:border-[var(--danger)]"
            : "border-hairline focus-within:border-[var(--accent-border)]",
        )}
      >
        <Icon
          aria-hidden="true"
          className={cn(
            "size-3.5 shrink-0 transition-colors",
            error ? "text-[var(--danger)]" : "text-ink-3",
          )}
        />
        <input
          ref={inputRef}
          value={value}
          disabled={submitting}
          aria-label={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => {
            setValue(event.target.value);
            if (error) setError(null);
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (!value.trim()) onClose();
          }}
          placeholder={placeholder}
          className="h-full min-w-0 flex-1 bg-transparent font-sans text-[13px] text-ink outline-none placeholder:text-ink-3 disabled:opacity-60"
        />
        {submitting ? (
          <Loader2
            className="size-3.5 shrink-0 animate-spin text-ink-3"
            aria-hidden="true"
          />
        ) : hasValue ? (
          <button
            type="button"
            onClick={() => void submit()}
            aria-label={`Create ${placeholder}`}
            title="Create"
            className="flex size-9 shrink-0 items-center justify-center rounded-[3px] text-ink-2 transition hover:bg-white/[0.04] hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-border)]"
          >
            <CornerDownLeft className="size-4" aria-hidden="true" />
          </button>
        ) : (
          <kbd className="shrink-0 rounded-[2px] border border-hairline px-1 py-px font-mono text-[10px] leading-none text-ink-3">
            esc
          </kbd>
        )}
      </div>
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="mt-1.5 pl-1 font-sans text-[11px] leading-4 text-[var(--danger)]"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
