import { ClipboardCheck, FileVideo2, ScanSearch, Wand2 } from "lucide-react";

const onboardingSteps = [
  {
    title: "Choose a short reference",
    description:
      "Start with a compact clip of the motion you want to understand.",
    icon: FileVideo2,
  },
  {
    title: "Sample key frames",
    description:
      "The app captures a small frame set so the motion can be described.",
    icon: ScanSearch,
  },
  {
    title: "Generate a motion note",
    description:
      "Review intent, duration, easing, and starter snippets before copying.",
    icon: Wand2,
  },
  {
    title: "Adapt in your codebase",
    description:
      "Treat the output as a draft and tune selectors, timing, and fallbacks.",
    icon: ClipboardCheck,
  },
];

export function OnboardingSteps() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {onboardingSteps.map((step, index) => {
        const Icon = step.icon;

        return (
          <article
            key={step.title}
            className="rounded-[8px] border border-white/10 bg-[#151811] p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex size-10 items-center justify-center rounded-[8px] bg-[#f58f7c]/10 text-[#f58f7c]">
                <Icon className="size-5" aria-hidden="true" />
              </div>
              <span className="font-mono text-xs text-[#ffd166]">
                {String(index + 1).padStart(2, "0")}
              </span>
            </div>
            <h3 className="mt-5 font-mono text-lg text-[#fffbf4]">
              {step.title}
            </h3>
            <p className="mt-3 text-sm leading-6 text-[#d8cfbc]/75">
              {step.description}
            </p>
          </article>
        );
      })}
    </div>
  );
}
