"use client";

import { Loader2 } from "lucide-react";
import { useRef, useState, type KeyboardEvent } from "react";
import { useEffect } from "react";

import { cn } from "@/lib/utils";

type InlineCreateResult = { ok: true } | { ok: false; message: string };

type InlineCreateProps = {
  placeholder: string;
  onSubmit: (value: string) => Promise<InlineCreateResult>;
  onClose: () => void;
  /** Visual indent (px) so nested project inputs line up under their workspace. */
  indent?: number;
};

/**
 * A single-line inline editor used to create a workspace or a project from
 * inside the explorer tree. Enter submits, Escape cancels, blur cancels when
 * empty. Errors render inline beneath the field.
 */
export function InlineCreate({
  placeholder,
  onSubmit,
  onClose,
  indent = 0,
}: InlineCreateProps) {
  const inputRef = useRef<HTMLInputElement>(null);
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

  return (
    <div style={{ paddingLeft: indent }} className="px-2 py-1">
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          value={value}
          disabled={submitting}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (!value.trim()) onClose();
          }}
          placeholder={placeholder}
          className={cn(
            "h-8 w-full border border-[var(--accent-border)] bg-[#11120d] px-2 font-sans text-[13px] text-[var(--text)] outline-none placeholder:text-[var(--accent)]/50",
            "focus:shadow-[0_0_0_3px_rgba(216,207,188,0.08)]",
          )}
        />
        {submitting ? (
          <Loader2 className="absolute right-2 size-3.5 animate-spin text-[var(--muted)]" />
        ) : null}
      </div>
      {error ? (
        <p className="mt-1 font-sans text-[11px] leading-4 text-red-300">
          {error}
        </p>
      ) : null}
    </div>
  );
}
