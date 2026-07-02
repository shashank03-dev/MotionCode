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
          "flex h-9 items-center gap-2 rounded-[3px] border bg-[#0d0e09] pl-2 pr-1.5 transition-colors",
          "focus-within:shadow-[0_0_0_3px_var(--accent-dim)]",
          error
            ? "border-[var(--danger-border)] focus-within:border-[var(--danger)]"
            : "border-[var(--border)] focus-within:border-[var(--accent-border)]",
        )}
      >
        <Icon
          aria-hidden="true"
          className={cn(
            "size-3.5 shrink-0 transition-colors",
            error ? "text-[var(--danger)]" : "text-[var(--accent)]/70",
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
          className="h-full min-w-0 flex-1 bg-transparent font-sans text-[13px] text-[var(--text)] outline-none placeholder:text-[var(--accent)]/60 disabled:opacity-60"
        />
        {submitting ? (
          <Loader2 className="size-3.5 shrink-0 animate-spin text-[var(--accent)]/70" />
        ) : hasValue ? (
          <span className="flex shrink-0 items-center gap-1 font-mono text-[10px] text-[var(--accent)]/45">
            <CornerDownLeft className="size-3" aria-hidden="true" />
            <span className="sr-only">Press Enter to create</span>
          </span>
        ) : (
          <kbd className="shrink-0 rounded-[2px] border border-[var(--border)] px-1 py-px font-mono text-[10px] leading-none text-[var(--accent)]/45">
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
