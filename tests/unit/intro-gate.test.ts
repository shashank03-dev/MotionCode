import { afterEach, describe, expect, it, vi } from "vitest";

import { INTRO_GATE_SCRIPT, INTRO_STORAGE_KEY } from "@/lib/intro-gate";

/**
 * These run the exact string that ships inside the inline <script> in
 * app/layout.tsx, rather than a re-implementation of it, so the tests fail if
 * the shipped gate changes behaviour.
 */
function runGate() {
  new Function(INTRO_GATE_SCRIPT)();
}

afterEach(() => {
  document.documentElement.removeAttribute("data-intro");
  vi.unstubAllGlobals();
  try {
    sessionStorage.clear();
  } catch {
    /* storage may be stubbed out by a test */
  }
});

describe("landing intro gate", () => {
  it("plays on the first landing of a session", () => {
    runGate();

    expect(document.documentElement.getAttribute("data-intro")).toBe("play");
  });

  it("records the visit so the decision survives a reload mid-animation", () => {
    runGate();

    expect(sessionStorage.getItem(INTRO_STORAGE_KEY)).toBe("1");
  });

  it("skips on every later navigation in the same session", () => {
    runGate();
    document.documentElement.removeAttribute("data-intro");

    runGate();

    expect(document.documentElement.getAttribute("data-intro")).toBe("seen");
  });

  it("skips rather than trapping the page when storage throws", () => {
    // Safari private mode and similar: touching sessionStorage raises.
    vi.stubGlobal("sessionStorage", {
      getItem() {
        throw new Error("storage disabled");
      },
      setItem() {
        throw new Error("storage disabled");
      },
    });

    runGate();

    expect(document.documentElement.getAttribute("data-intro")).toBe("seen");
  });

  it("never leaves the attribute unset, which CSS treats as hidden", () => {
    runGate();

    expect(document.documentElement.hasAttribute("data-intro")).toBe(true);
  });
});
