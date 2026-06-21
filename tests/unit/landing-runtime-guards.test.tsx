import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Aurora from "@/components/react-bits/Aurora/Aurora";
import { useHydratedReducedMotion } from "@/lib/hooks/use-hydrated-reduced-motion";

function ReducedMotionProbe() {
  const prefersReducedMotion = useHydratedReducedMotion();

  return (
    <div data-prefers-reduced-motion={prefersReducedMotion ? "true" : "false"} />
  );
}

describe("landing runtime guards", () => {
  let container: HTMLDivElement;
  let root: Root;
  let originalMatchMedia: typeof window.matchMedia | undefined;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let getContextSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    (
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT?: boolean;
      }
    ).IS_REACT_ACT_ENVIRONMENT = true;

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    getContextSpy = vi
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue(null);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    window.matchMedia = originalMatchMedia as typeof window.matchMedia;
    getContextSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it("does not throw when WebGL is unavailable for Aurora", async () => {
    await expect(
      act(async () => {
        root.render(
          <div style={{ width: "320px", height: "180px" }}>
            <Aurora />
          </div>,
        );
      }),
    ).resolves.not.toThrow();
  });

  it("keeps reduced motion disabled during SSR and first hydration render", async () => {
    const serverMarkup = renderToStaticMarkup(<ReducedMotionProbe />);
    expect(serverMarkup).toContain('data-prefers-reduced-motion="false"');

    await act(async () => {
      root.render(<ReducedMotionProbe />);
    });

    const probe = container.querySelector("[data-prefers-reduced-motion]");
    expect(probe?.getAttribute("data-prefers-reduced-motion")).toBe("true");
  });
});
