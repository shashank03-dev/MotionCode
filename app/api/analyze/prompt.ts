export function buildAnimationPrompt(frameCount: number): string {
  return `
You are a frontend animation engineer analyzing ${frameCount} frames.

Analyze the motion and respond with Raw JSON only.
No markdown. No backticks. No explanation.

Return this exact JSON shape:
{
  "intent": "hover",
  "element": "button",
  "duration_ms": 400,
  "delay_ms": 0,
  "easing": "cubic-bezier(0.4, 0, 0.2, 1)",
  "loops": false,
  "description": "One sentence description.",
  "keyframes_detected": 4,
  "performance_score": 90,
  "gpu_accelerated": true,
  "accessibility_note": "Add prefers-reduced-motion fallback.",
  "css": ".el{transition:transform 400ms ease}",
  "gsap": "gsap.to('.el',{duration:0.4,scale:0.95})",
  "framer_motion": "const v={animate:{scale:0.95}}",
  "react_spring": "const s=useSpring({scale:0.95})"
}

Rules:
- Keep code strings concise.
- Prefer transform and opacity.
- Include reduced-motion guidance.
- Do not include unsafe script tags or event handlers.
`.trim();
}
