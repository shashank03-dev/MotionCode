import Link from "next/link";
import { ArrowRight, Code2, MousePointer2, PanelTop, Sparkles } from "lucide-react";

export const examples = [
  {
    title: "Button hover lift",
    intent: "Micro-interaction",
    icon: MousePointer2,
    description:
      "A compact hover state with translate, scale, and shadow changes.",
    spec: "duration 280ms | cubic-bezier(.2,.8,.2,1) | transform + shadow",
    code: `.primary-action:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 14px 32px rgba(20,23,18,.24);
}`,
  },
  {
    title: "Modal entrance",
    intent: "Entrance motion",
    icon: PanelTop,
    description:
      "A panel rises from the page while opacity and scale settle together.",
    spec: "duration 320ms | power2.out | opacity + y + scale",
    code: `gsap.fromTo(".panel",
  { opacity: 0, y: 16, scale: .98 },
  { opacity: 1, y: 0, scale: 1, duration: .32 }
);`,
  },
  {
    title: "Toast slide",
    intent: "Interface feedback",
    icon: Sparkles,
    description:
      "A notification slides in, pauses, and exits without blocking layout.",
    spec: "duration 240ms | easeOut | x + opacity",
    code: `const toast = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 24 }
};`,
  },
];

type ExampleGalleryProps = {
  compact?: boolean;
};

export function ExampleGallery({ compact = false }: ExampleGalleryProps) {
  const visibleExamples = compact ? examples.slice(0, 2) : examples;

  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-3">
      {visibleExamples.map((example) => {
        const Icon = example.icon;

        return (
          <article
            key={example.title}
            className="min-w-0 rounded-[8px] border border-white/10 bg-[#151811] p-5 shadow-xl shadow-black/10"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="flex size-10 items-center justify-center rounded-[8px] bg-[#9ef0c0]/10 text-[#9ef0c0]">
                <Icon className="size-5" aria-hidden="true" />
              </div>
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#ffd166]">
                {example.intent}
              </span>
            </div>
            <h3 className="font-mono text-xl text-[#fffbf4]">{example.title}</h3>
            <p className="mt-3 text-sm leading-6 text-[#d8cfbc]/75">
              {example.description}
            </p>
            <p className="mt-4 border-t border-white/10 pt-4 font-mono text-xs leading-5 text-[#9ef0c0]">
              {example.spec}
            </p>
            <pre className="mt-4 max-w-full overflow-x-auto rounded-[8px] bg-[#0d100b] p-4 text-xs leading-5 text-[#d8cfbc]">
              <code>{example.code}</code>
            </pre>
          </article>
        );
      })}

      {compact ? (
        <Link
          href="/examples"
          className="flex min-h-64 min-w-0 flex-col justify-between rounded-[8px] border border-dashed border-[#9ef0c0]/40 bg-[#9ef0c0]/10 p-5 text-[#fffbf4] hover:bg-[#9ef0c0]/15"
        >
          <Code2 className="size-8 text-[#9ef0c0]" aria-hidden="true" />
          <span className="font-mono text-2xl">View the examples route</span>
          <span className="inline-flex items-center gap-2 text-sm text-[#d8cfbc]/75">
            Open examples
            <ArrowRight className="size-4" aria-hidden="true" />
          </span>
        </Link>
      ) : null}
    </div>
  );
}
