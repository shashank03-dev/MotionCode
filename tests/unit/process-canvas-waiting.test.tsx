import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";

vi.mock("next/dynamic", () => ({ default: () => () => null }));
import { ProcessCanvas } from "@/components/app/ProcessCanvas";

it("labels estimated progress as waiting rather than completed compilation", () => {
  const html = renderToStaticMarkup(
    <ProcessCanvas stage="analyzing" activeStep={10} progressWidth={94} />,
  );
  expect(html).toContain("Estimated progress");
  expect(html).toContain("Waiting for model response");
  expect(html).toContain("analysis · awaiting response");
  expect(html).not.toContain("compiled · stable");
  expect(html).not.toContain("6/6 phases");
});
