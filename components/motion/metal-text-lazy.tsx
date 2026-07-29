"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Lazy wrapper around MetalText.
 *
 * MetalText drives a brushed-metal shader through `ogl`. Importing it directly
 * pulled the entire WebGL renderer into the landing page's initial bundle for a
 * decorative footer wordmark — the largest avoidable cost on first load.
 *
 * The fallback is not a placeholder box. It renders the same text with the same
 * `lm-text` CSS chrome treatment that MetalText itself falls back to when WebGL
 * is unavailable, so the wordmark is present and correctly sized on the very
 * first frame (including in the server-rendered HTML) and the shader merely
 * upgrades it once the chunk arrives. No layout shift, no missing content, and
 * no text hole for crawlers.
 *
 * React.lazy rather than next/dynamic here specifically because `dynamic`'s
 * `loading` component receives no props — it could not render the text.
 */

export type MetalTextProps = {
  text: string;
  className?: string;
  interactive?: boolean;
  blue?: number;
};

function MetalTextFallback({ text, className, interactive }: MetalTextProps) {
  return (
    <span className={cn("relative inline-block align-baseline", className)}>
      <span className={cn("lm-text", interactive && "lm-interactive")}>
        {text}
      </span>
    </span>
  );
}

const MetalTextImpl = React.lazy(() =>
  import("./metal-text").then((m) => ({ default: m.MetalText })),
);

/**
 * false while server-rendering, true on the client. `useSyncExternalStore` with
 * a no-op subscription is the sanctioned way to read that difference without
 * setting state from an effect.
 */
const subscribeNoop = () => () => {};
function useIsClient() {
  return React.useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
}

export function MetalText(props: MetalTextProps) {
  // Server render and first client frame both produce the CSS wordmark, so
  // hydration matches and the shader upgrade happens strictly afterwards.
  const mounted = useIsClient();

  if (!mounted) return <MetalTextFallback {...props} />;

  return (
    <React.Suspense fallback={<MetalTextFallback {...props} />}>
      <MetalTextImpl {...props} />
    </React.Suspense>
  );
}
