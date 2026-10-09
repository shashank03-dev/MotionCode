import { describe, expect, it } from "vitest";

import { getGridLayout } from "@/lib/contactSheet";

describe("contact sheet grid layout", () => {
  it.each([
    [2, 2, 1],
    [6, 3, 2],
    [12, 4, 3],
    [16, 4, 4],
  ])("tiles %i frames into %i columns by %i rows", (frameCount, columns, rows) => {
    expect(getGridLayout(frameCount)).toEqual({ columns, frameCount, rows });
  });
});
