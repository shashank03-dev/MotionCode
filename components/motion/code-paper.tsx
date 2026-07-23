"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Token = { text: string; cls: string };

const TOKEN_RE = new RegExp(
  [
    "(?<comment>\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)",
    "(?<string>\"[^\"]*\"|'[^']*'|`[^`]*`)",
    "(?<number>\\b\\d+(?:\\.\\d+)?(?:ms|s|px|%|em|rem|deg)?\\b)",
    "(?<func>\\b[A-Za-z_$][\\w$]*(?=\\s*\\())",
    "(?<key>\\b(?:const|let|var|import|from|export|return|function|new|to|fromTo|gsap|timeline|duration|ease|delay|stagger|transform|opacity|animate|initial|whileInView|transition)\\b)",
    "(?<prop>\\b[a-zA-Z-]+(?=\\s*:))",
    "(?<punct>[{}()\\[\\];,.:])",
  ].join("|"),
  "g",
);

const CLS: Record<string, string> = {
  comment: "text-ink-3 italic",
  string: "text-[#9fb98f]",
  number: "text-[#e0b877]",
  func: "text-accent",
  key: "text-[#e6e1d7] font-medium",
  prop: "text-[#8ab4f8]",
  punct: "text-ink-3",
};

function tokenizeLine(line: string): Token[] {
  const out: Token[] = [];
  let last = 0;
  TOKEN_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = TOKEN_RE.exec(line)) !== null) {
    if (m.index > last) out.push({ text: line.slice(last, m.index), cls: "" });
    const groups = m.groups ?? {};
    const cls = Object.keys(groups).find((k) => groups[k] != null) ?? "";
    out.push({ text: m[0], cls: CLS[cls] ?? "" });
    last = m.index + m[0].length;
    if (m[0].length === 0) TOKEN_RE.lastIndex++;
  }
  if (last < line.length) out.push({ text: line.slice(last), cls: "" });
  return out;
}

export function CodePaper({
  code,
  filename,
  className,
  animateLines = true,
}: {
  code: string;
  filename?: string;
  className?: string;
  animateLines?: boolean;
}) {
  const lines = React.useMemo(() => code.replace(/\n$/, "").split("\n"), [code]);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-[#060708] shadow-lift",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-hairline px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
        {filename && (
          <span className="ml-2 font-mono text-[11px] tracking-wide text-ink-3">
            {filename}
          </span>
        )}
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-[1.7]">
        <code className="block">
          {lines.map((line, i) => (
            <motion.span
              key={i}
              className="grid grid-cols-[2ch_1fr] gap-4"
              initial={animateLines ? { opacity: 0, x: -6 } : false}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.045, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <span className="select-none text-right text-ink-3/50">{i + 1}</span>
              <span className="whitespace-pre">
                {tokenizeLine(line).map((tok, j) => (
                  <span key={j} className={tok.cls}>
                    {tok.text}
                  </span>
                ))}
                {line.length === 0 ? " " : ""}
              </span>
            </motion.span>
          ))}
        </code>
      </pre>
    </div>
  );
}
