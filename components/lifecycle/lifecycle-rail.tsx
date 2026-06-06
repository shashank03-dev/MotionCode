const lifecycleItems = [
  {
    title: "Reference",
    detail: "A short clip that shows the motion clearly.",
  },
  {
    title: "Spec",
    detail: "Intent, element, duration, easing, and frame count.",
  },
  {
    title: "Snippet",
    detail: "CSS, GSAP, or Framer Motion starter code to inspect.",
  },
  {
    title: "Review",
    detail: "Human edits for selectors, states, and reduced motion.",
  },
];

export function LifecycleRail() {
  return (
    <div className="grid gap-3 md:grid-cols-4">
      {lifecycleItems.map((item, index) => (
        <article
          key={item.title}
          className="relative rounded-[8px] border border-white/10 bg-[#11140f] p-5"
        >
          <div className="mb-6 flex items-center gap-3">
            <span className="flex size-8 items-center justify-center rounded-full border border-[#9ef0c0]/40 font-mono text-xs text-[#9ef0c0]">
              {index + 1}
            </span>
            <span className="h-px flex-1 bg-white/10" aria-hidden="true" />
          </div>
          <h3 className="font-mono text-lg text-[#fffbf4]">{item.title}</h3>
          <p className="mt-3 text-sm leading-6 text-[#d8cfbc]/70">
            {item.detail}
          </p>
        </article>
      ))}
    </div>
  );
}
