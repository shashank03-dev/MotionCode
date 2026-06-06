export const OUTPUT_FRAMEWORKS = [
  "css",
  "gsap",
  "framer-motion",
  "react-spring",
] as const;

export type OutputFramework = (typeof OUTPUT_FRAMEWORKS)[number];

export type MotionIntent =
  | "entrance"
  | "exit"
  | "hover"
  | "morph"
  | "loading"
  | "loop"
  | "scroll"
  | "unknown";

export type MotionSpec = {
  intent: MotionIntent;
  element: string;
  durationMs: number;
  delayMs: number;
  easing: string;
  loops: boolean;
  description: string;
  keyframesDetected: number;
  performanceScore: number;
  gpuAccelerated: boolean;
  accessibilityNote: string;
  implementationNotes: string[];
};

export type GeneratedOutput = {
  framework: OutputFramework;
  code: string;
  dependencies: string[];
  setupNotes: string[];
  warnings: string[];
};

export type AnalysisResult = {
  id: string;
  assetId: string;
  projectId: string;
  versionId: string;
  model: "gemini-2.5-flash" | "gemini-2.5-pro";
  frameCount: number;
  spec: MotionSpec;
  outputs: GeneratedOutput[];
  createdAt: string;
};
