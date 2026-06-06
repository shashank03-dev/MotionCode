import { afterEach, describe, expect, it, vi } from "vitest";
import { extractFrames, validateFrameRequest } from "@/lib/extractFrames";

const originalCreateObjectURL = Object.getOwnPropertyDescriptor(
  URL,
  "createObjectURL",
);
const originalRevokeObjectURL = Object.getOwnPropertyDescriptor(
  URL,
  "revokeObjectURL",
);

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();

  if (originalCreateObjectURL) {
    Object.defineProperty(URL, "createObjectURL", originalCreateObjectURL);
  } else {
    Reflect.deleteProperty(URL, "createObjectURL");
  }

  if (originalRevokeObjectURL) {
    Object.defineProperty(URL, "revokeObjectURL", originalRevokeObjectURL);
  } else {
    Reflect.deleteProperty(URL, "revokeObjectURL");
  }
});

describe("validateFrameRequest", () => {
  it("accepts supported video files under size limit", () => {
    const file = new File(["x"], "motion.mp4", { type: "video/mp4" });

    expect(validateFrameRequest(file, 8)).toEqual({
      ok: true,
      normalizedCount: 8,
    });
  });

  it("rejects unsupported file types", () => {
    const file = new File(["x"], "motion.json", { type: "application/json" });

    expect(validateFrameRequest(file, 8)).toEqual({
      ok: false,
      error: "Unsupported format. Use MP4, WebM, MOV, or GIF.",
    });
  });

  it("rejects unsupported video file types", () => {
    const unsupportedFiles = [
      new File(["x"], "motion.ogv", { type: "video/ogg" }),
      new File(["x"], "motion.avi", { type: "video/x-msvideo" }),
    ];

    for (const file of unsupportedFiles) {
      expect(validateFrameRequest(file, 8)).toEqual({
        ok: false,
        error: "Unsupported format. Use MP4, WebM, MOV, or GIF.",
      });
    }
  });

  it("rejects oversized files", () => {
    const file = new File([new Uint8Array(51 * 1024 * 1024)], "large.mp4", {
      type: "video/mp4",
    });

    expect(validateFrameRequest(file, 8)).toEqual({
      ok: false,
      error: "File is too large. Maximum size is 50 MB.",
    });
  });

  it("clamps frame counts to supported range", () => {
    const file = new File(["x"], "motion.mp4", { type: "video/mp4" });

    expect(validateFrameRequest(file, 99)).toEqual({
      ok: true,
      normalizedCount: 12,
    });
  });

  it("normalizes non-finite and fractional frame counts before clamping", () => {
    const file = new File(["x"], "motion.mp4", { type: "video/mp4" });

    expect(validateFrameRequest(file, Number.NaN)).toEqual({
      ok: true,
      normalizedCount: 8,
    });
    expect(validateFrameRequest(file, Infinity)).toEqual({
      ok: true,
      normalizedCount: 8,
    });
    expect(validateFrameRequest(file, 4.9)).toEqual({
      ok: true,
      normalizedCount: 4,
    });
    expect(validateFrameRequest(file, 0)).toEqual({
      ok: true,
      normalizedCount: 1,
    });
    expect(validateFrameRequest(file, -3)).toEqual({
      ok: true,
      normalizedCount: 1,
    });
  });
});

describe("extractFrames", () => {
  it("revokes the GIF object URL when image loading fails", async () => {
    const createObjectURL = vi.fn(() => "blob:motion-gif");
    const revokeObjectURL = vi.fn();
    const file = new File(["x"], "motion.gif", { type: "image/gif" });

    class FailingImage {
      onerror: ((event: Event) => void) | null = null;

      set src(_value: string) {
        queueMicrotask(() => {
          this.onerror?.(new Event("error"));
        });
      }
    }

    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURL,
    });
    vi.stubGlobal("Image", FailingImage);

    await expect(extractFrames(file, 8)).rejects.toMatchObject({
      message: "Failed to extract GIF frame",
    });
    expect(createObjectURL).toHaveBeenCalledWith(file);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:motion-gif");
  });
});
