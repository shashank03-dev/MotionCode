import type {
  AnalysisResult,
  GeneratedOutput,
  OutputFramework,
} from "@/lib/contracts/motion";

export type ExportFramework = OutputFramework | "markdown";

export type ExportArtifact = {
  framework: ExportFramework;
  filename: string;
  language: "css" | "markdown" | "ts" | "tsx";
  code: string;
  dependencies: string[];
  setupNotes: string[];
  accessibilityNotes: string[];
  warnings: string[];
};

export type ExportOptions = {
  projectTitle?: string;
  versionLabel?: string | null;
  versionNumber?: number | null;
};

const FRAMEWORK_ORDER: OutputFramework[] = [
  "css",
  "gsap",
  "framer-motion",
  "react-spring",
];

const FRAMEWORK_LABELS: Record<OutputFramework, string> = {
  css: "CSS",
  "framer-motion": "Framer Motion",
  gsap: "GSAP",
  "react-spring": "React Spring",
};

const FRAMEWORK_LANGUAGES: Record<
  OutputFramework,
  ExportArtifact["language"]
> = {
  css: "css",
  "framer-motion": "tsx",
  gsap: "ts",
  "react-spring": "tsx",
};

const DEFAULT_DEPENDENCIES: Record<OutputFramework, string[]> = {
  css: [],
  "framer-motion": ["framer-motion"],
  gsap: ["gsap"],
  "react-spring": ["@react-spring/web"],
};

const DEFAULT_SETUP_NOTES: Record<OutputFramework, string[]> = {
  css: [
    "Paste the helper into a stylesheet loaded by the page.",
    "Apply the target selector to the animated element.",
  ],
  "framer-motion": [
    "Wrap the target element in a motion component.",
    "Keep transform and opacity animations on the compositor.",
  ],
  gsap: [
    "Create the animation after the target element is mounted.",
    "Kill timelines during component cleanup.",
  ],
  "react-spring": [
    "Render an animated element from @react-spring/web.",
    "Keep spring state close to the component that owns the interaction.",
  ],
};

const REDUCED_MOTION_NOTE =
  "Disable or reduce the animation when prefers-reduced-motion is enabled.";

export function createMarkdownImplementationBrief(
  analysis: AnalysisResult,
  options: ExportOptions = {},
): ExportArtifact {
  const title = options.projectTitle?.trim() || "MotionCode";
  const frameworkExports = FRAMEWORK_ORDER.map((framework) =>
    createFrameworkExport(analysis, framework),
  );
  const dependencies = unique(
    frameworkExports.flatMap((item) => item.dependencies),
  );
  const setupNotes = unique(
    frameworkExports.flatMap((item) => item.setupNotes),
  );
  const accessibilityNotes = unique(
    frameworkExports.flatMap((item) => item.accessibilityNotes),
  );
  const warnings = unique(frameworkExports.flatMap((item) => item.warnings));

  const versionParts = [
    options.versionNumber ? String(options.versionNumber) : null,
    options.versionLabel?.trim() || null,
  ].filter(Boolean);

  const lines = [
    `# ${title} Implementation Brief`,
    "",
    "## Summary",
    `- Intent: ${analysis.spec.intent}`,
    `- Element: ${analysis.spec.element}`,
    `- Description: ${analysis.spec.description}`,
    `- Duration: ${analysis.spec.durationMs}ms`,
    `- Delay: ${analysis.spec.delayMs}ms`,
    `- Easing: ${analysis.spec.easing}`,
    `- Loops: ${analysis.spec.loops ? "yes" : "no"}`,
    `- GPU accelerated: ${analysis.spec.gpuAccelerated ? "yes" : "no"}`,
    `- Performance score: ${analysis.spec.performanceScore}`,
    `- Frames analyzed: ${analysis.frameCount}`,
    `- Model: ${analysis.model}`,
    `- Created: ${analysis.createdAt}`,
  ];

  if (versionParts.length > 0) {
    lines.push(`- Version: ${versionParts.join(" - ")}`);
  }

  lines.push(
    "",
    "## Dependencies",
    ...(dependencies.length > 0
      ? dependencies.map((dependency) => `- \`${dependency}\``)
      : ["- None"]),
    "",
    "## Setup Notes",
    ...toList(setupNotes),
    "",
    "## Accessibility",
    ...toList(accessibilityNotes),
  );

  if (warnings.length > 0) {
    lines.push("", "## Warnings", ...toList(warnings));
  }

  for (const item of frameworkExports) {
    lines.push(
      "",
      `## ${FRAMEWORK_LABELS[item.framework as OutputFramework]}`,
      fencedCode(item.language, item.code),
    );
  }

  return {
    accessibilityNotes,
    code: `${lines.join("\n").trim()}\n`,
    dependencies,
    filename: `${slugify(title)}-implementation-brief.md`,
    framework: "markdown",
    language: "markdown",
    setupNotes,
    warnings,
  };
}

export function createCssExport(analysis: AnalysisResult): ExportArtifact {
  return createFrameworkExport(analysis, "css");
}

export function createGsapExport(analysis: AnalysisResult): ExportArtifact {
  return createFrameworkExport(analysis, "gsap");
}

export function createFramerMotionExport(
  analysis: AnalysisResult,
): ExportArtifact {
  return createFrameworkExport(analysis, "framer-motion");
}

export function createReactSpringExport(
  analysis: AnalysisResult,
): ExportArtifact {
  return createFrameworkExport(analysis, "react-spring");
}

export function createExportBundle(
  analysis: AnalysisResult,
  options: ExportOptions = {},
): ExportArtifact[] {
  return [
    createMarkdownImplementationBrief(analysis, options),
    createCssExport(analysis),
    createGsapExport(analysis),
    createFramerMotionExport(analysis),
    createReactSpringExport(analysis),
  ];
}

function createFrameworkExport(
  analysis: AnalysisResult,
  framework: OutputFramework,
): ExportArtifact {
  const generated = findOutput(analysis, framework);
  const dependencies = unique([
    ...DEFAULT_DEPENDENCIES[framework],
    ...(generated?.dependencies ?? []),
  ]);
  const setupNotes = unique([
    ...installNotes(dependencies),
    ...(generated?.setupNotes ?? []),
    ...DEFAULT_SETUP_NOTES[framework],
  ]);
  const accessibilityNotes = unique([
    analysis.spec.accessibilityNote,
    REDUCED_MOTION_NOTE,
  ]);

  return {
    accessibilityNotes,
    code: generated?.code ?? fallbackCode(framework),
    dependencies,
    filename: helperFilename(framework),
    framework,
    language: FRAMEWORK_LANGUAGES[framework],
    setupNotes,
    warnings: unique(generated?.warnings ?? []),
  };
}

function findOutput(
  analysis: AnalysisResult,
  framework: OutputFramework,
): GeneratedOutput | undefined {
  return analysis.outputs.find((output) => output.framework === framework);
}

function helperFilename(framework: OutputFramework) {
  if (framework === "css") {
    return "motioncode-css-helper.css";
  }

  if (framework === "gsap") {
    return "motioncode-gsap-helper.ts";
  }

  return `motioncode-${framework}-helper.tsx`;
}

function installNotes(dependencies: string[]) {
  if (dependencies.length === 0) {
    return [];
  }

  return [`Install with: npm install ${dependencies.join(" ")}`];
}

function fallbackCode(framework: OutputFramework) {
  if (framework === "css") {
    return [
      ".motioncode-target {",
      "  transition: transform 300ms ease, opacity 300ms ease;",
      "}",
      "",
      "@media (prefers-reduced-motion: reduce) {",
      "  .motioncode-target {",
      "    transition: none;",
      "  }",
      "}",
    ].join("\n");
  }

  if (framework === "gsap") {
    return [
      "import gsap from \"gsap\";",
      "",
      "export function animateMotionCodeTarget(target: gsap.TweenTarget) {",
      "  return gsap.to(target, { duration: 0.3, opacity: 1 });",
      "}",
    ].join("\n");
  }

  if (framework === "framer-motion") {
    return [
      "export const motionCodeVariants = {",
      "  initial: { opacity: 0 },",
      "  animate: { opacity: 1 },",
      "};",
    ].join("\n");
  }

  return [
    "import { useSpring } from \"@react-spring/web\";",
    "",
    "export function useMotionCodeSpring() {",
    "  return useSpring({ from: { opacity: 0 }, to: { opacity: 1 } });",
    "}",
  ].join("\n");
}

function fencedCode(language: ExportArtifact["language"], code: string) {
  return [`\`\`\`${language}`, code.trim(), "```"].join("\n");
}

function toList(items: string[]) {
  return items.length > 0 ? items.map((item) => `- ${item}`) : ["- None"];
}

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "motioncode";
}

function unique(values: string[]) {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean)),
  );
}
