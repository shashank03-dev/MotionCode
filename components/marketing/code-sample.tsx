import { ArrowRight, Braces, Code2 } from "lucide-react";

export const motionSpec = `{
  "intent": "button hover lift",
  "element": ".primary-action",
  "durationMs": 280,
  "easing": "cubic-bezier(.2,.8,.2,1)",
  "framesReviewed": 8
}`;

export const cssStarter = `.primary-action {
  transition:
    transform 280ms cubic-bezier(.2,.8,.2,1),
    box-shadow 280ms cubic-bezier(.2,.8,.2,1);
}

.primary-action:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 14px 32px rgba(20, 23, 18, .24);
}`;

export function MotionSpecPreview() {
  return (
    <div className="relative overflow-hidden rounded-[8px] border border-white/10 bg-elevated shadow-2xl shadow-black/30">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-accent">
          <Braces className="size-4" aria-hidden="true" />
          Motion spec
        </div>
        <span className="rounded-[6px] bg-[#ffd166]/15 px-2 py-1 font-mono text-[11px] text-[#ffd166]">
          sample
        </span>
      </div>

      <div className="grid min-w-0 gap-0 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="min-w-0 border-b border-white/10 p-4 lg:border-b-0 lg:border-r">
          <pre className="max-w-full overflow-x-auto text-sm leading-6 text-ink">
            <code>{motionSpec}</code>
          </pre>
        </div>
        <div className="min-w-0 bg-[#0f1115] p-4">
          <div className="mb-3 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-[#f58f7c]">
            <Code2 className="size-4" aria-hidden="true" />
            CSS starter
          </div>
          <pre className="max-w-full overflow-x-auto text-sm leading-6 text-ink-2">
            <code>{cssStarter}</code>
          </pre>
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-white/10 bg-[#0f1115] px-4 py-3 text-sm text-ink-2/70">
        <span className="size-2 rounded-full bg-accent" aria-hidden="true" />
        Review the spec, adjust the code, then paste it into your project.
        <ArrowRight className="ml-auto size-4 text-accent" aria-hidden="true" />
      </div>
    </div>
  );
}
