export type Snippet = { id: string; label: string; filename: string; code: string };

export const SNIPPETS: Snippet[] = [
  {
    id: "css",
    label: "CSS",
    filename: "reveal.css",
    code: `/* recovered from reference.mp4 */
@keyframes reveal {
  from {
    opacity: 0;
    transform: translateY(148px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card {
  animation: reveal 420ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

@media (prefers-reduced-motion: reduce) {
  .card { animation: none; }
}`,
  },
  {
    id: "gsap",
    label: "GSAP",
    filename: "reveal.js",
    code: `import gsap from "gsap";

// duration + easing detected from the source motion
gsap.from(".card", {
  y: 148,
  opacity: 0,
  duration: 0.42,
  ease: "expo.out",
  stagger: 0.06,
});`,
  },
  {
    id: "framer",
    label: "Framer Motion",
    filename: "Card.tsx",
    code: `import { motion } from "framer-motion";

export function Card() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 148 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.42,
        ease: [0.2, 0.8, 0.2, 1],
      }}
    />
  );
}`,
  },
];
