import { describe, expect, it } from "vitest";
import { escapeCodeForDisplay, fileNameForTab } from "@/lib/generatedCode";

describe("generated code helpers", () => {
  it("escapes HTML-significant characters", () => {
    expect(escapeCodeForDisplay("<script>alert('&')</script>")).toBe(
      "&lt;script&gt;alert(&#39;&amp;&#39;)&lt;/script&gt;"
    );
  });

  it("returns stable file names per tab", () => {
    expect(fileNameForTab("CSS")).toBe("animation.css");
    expect(fileNameForTab("GSAP")).toBe("animation.gsap.js");
    expect(fileNameForTab("Framer Motion")).toBe("AnimatedComponent.tsx");
    expect(fileNameForTab("React Spring")).toBe("AnimatedComponent.tsx");
  });
});
