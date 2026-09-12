"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { RotateCw } from "lucide-react";
import { SNIPPETS } from "@/lib/snippets";
import { Tabs } from "@/components/ui/tabs";
import { CodePaper } from "@/components/motion/code-paper";
import { Reveal } from "@/components/motion/scroll-reveal";

const SPEC = [
  { k: "target", v: ".card" },
  { k: "duration", v: "420ms" },
  { k: "delay", v: "0ms" },
  { k: "easing", v: "cubic-bezier(.2,.8,.2,1)" },
  { k: "transform", v: "translateY(148 → 0)" },
  { k: "opacity", v: "0 → 1" },
];

export function SpecShowcase() {
  const [tab, setTab] = React.useState("css");
  const [replay, setReplay] = React.useState(0);
  const reduce = useReducedMotion();
  const snippet = SNIPPETS.find((s) => s.id === tab) ?? SNIPPETS[0];

  return (
    <section className="container-page py-24 sm:py-28">
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* spec + rendered preview */}
        <Reveal className="flex flex-col gap-6">
          <div>
            <div className="eyebrow mb-4">The output</div>
            <h2 className="text-4xl tracking-tight sm:text-5xl">
              One spec. Every format.
            </h2>
            <p className="mt-4 max-w-md text-[17px] text-ink-2">
              A normalized description of the motion — then the exact same motion
              rendered as code, wherever you build.
            </p>
          </div>

          {/* rendered preview */}
          <div className="relative overflow-hidden rounded-2xl border border-hairline bg-panel/50 p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-3">
                rendered
              </span>
              <button
                onClick={() => setReplay((r) => r + 1)}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-hairline px-4 font-mono text-xs text-ink-2 transition-colors hover:text-ink"
              >
                <RotateCw className="h-3 w-3" /> replay
              </button>
            </div>
            <div className="flex h-40 items-center justify-center overflow-hidden rounded-xl bg-black/50">
              <motion.div
                key={replay}
                initial={reduce ? false : { opacity: 0, y: 148 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.42, ease: [0.2, 0.8, 0.2, 1] }}
                className="flex h-20 w-32 items-center justify-center rounded-xl border border-[var(--accent-border)] bg-accent-dim font-mono text-[12px] text-ink"
              >
                .card
              </motion.div>
            </div>
          </div>

          {/* spec table */}
          <div className="overflow-hidden rounded-2xl border border-hairline bg-panel/50">
            {SPEC.map((row, i) => (
              <div
                key={row.k}
                className="flex items-center justify-between px-5 py-3"
                style={{ borderTop: i ? "1px solid var(--hairline)" : "none" }}
              >
                <span className="font-mono text-[12px] uppercase tracking-[0.12em] text-ink-3">
                  {row.k}
                </span>
                <span className="font-mono text-[13px] text-ink">{row.v}</span>
              </div>
            ))}
          </div>
        </Reveal>

        {/* code tabs */}
        <Reveal delay={0.1} className="lg:sticky lg:top-24 lg:self-start">
          <div className="mb-4 flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-3">
              export
            </span>
            <Tabs
              tabs={SNIPPETS.map((s) => ({ id: s.id, label: s.label }))}
              value={tab}
              onValueChange={setTab}
            />
          </div>
          <CodePaper
            key={snippet.id}
            code={snippet.code}
            filename={snippet.filename}
          />
        </Reveal>
      </div>
    </section>
  );
}
