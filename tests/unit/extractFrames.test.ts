import { afterEach, describe, expect, it, vi } from "vitest";

import { extractFrames } from "@/lib/extractFrames";
import { PLAN_ENTITLEMENTS } from "@/lib/contracts/plans";

const jpegDataUrl = "data:image/jpeg;base64,/9j/AA==";

function makeFile(type: string, name = "clip.mp4", size = 4) {
  const file = new File(["data"], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

function mockCanvas() {
  const originalCreateElement = document.createElement.bind(document);
  return vi.spyOn(document, "createElement").mockImplementation((tagName) => {
    if (tagName === "canvas") {
      return {
        getContext: () => ({ drawImage: vi.fn() }),
        height: 0,
        toDataURL: () => jpegDataUrl,
        width: 0,
      } as unknown as HTMLCanvasElement;
    }

    return originalCreateElement(tagName);
  });
}

function mockVideoElement(video: Record<string, unknown>) {
  const originalCreateElement = document.createElement.bind(document);
  return vi.spyOn(document, "createElement").mockImplementation((tagName) => {
    if (tagName === "video") {
      return video as unknown as HTMLVideoElement;
    }

    if (tagName === "canvas") {
      return {
        getContext: () => ({ drawImage: vi.fn() }),
        height: 0,
        toDataURL: () => jpegDataUrl,
        width: 0,
      } as unknown as HTMLCanvasElement;
    }

    return originalCreateElement(tagName);
  });
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("extractFrames", () => {
  it("rejects unsupported media types", async () => {
    await expect(extractFrames(makeFile("video/ogg", "clip.ogv"))).rejects
      .toThrow("Unsupported format. Use MP4, WebM, MOV, or GIF.");
  });

  it("rejects files larger than the configured max bytes", async () => {
    const maxBytes = PLAN_ENTITLEMENTS.free.maxUploadBytes;

    await expect(
      extractFrames(makeFile("video/mp4", "clip.mp4", maxBytes + 1)),
    ).rejects.toThrow("File is too large.");
  });

  it("rejects frame counts outside the configured limit", async () => {
    await expect(extractFrames(makeFile("video/mp4"), 0)).rejects.toThrow(
      "Frame count must be between 1 and 6.",
    );
    await expect(
      extractFrames(makeFile("video/mp4"), PLAN_ENTITLEMENTS.free.maxFramesPerAnalysis + 1),
    ).rejects.toThrow("Frame count must be between 1 and 6.");
  });

  it("revokes GIF object URLs after extraction", async () => {
    const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:gif");
    mockCanvas();

    vi.stubGlobal(
      "Image",
      class {
        naturalHeight = 120;
        naturalWidth = 160;
        onerror: (() => void) | null = null;
        onload: (() => void) | null = null;

        set src(_value: string) {
          queueMicrotask(() => this.onload?.());
        }
      },
    );

    await expect(extractFrames(makeFile("image/gif", "clip.gif"))).resolves
      .toEqual(["/9j/AA=="]);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:gif");
  });

  it("rejects non-finite video durations and revokes object URLs", async () => {
    const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:video");
    const listeners = new Map<string, EventListener>();
    mockVideoElement({
      addEventListener: vi.fn((event: string, listener: EventListener) => {
        listeners.set(event, listener);
      }),
      crossOrigin: "",
      duration: Infinity,
      load: vi.fn(() => {
        queueMicrotask(() => listeners.get("loadedmetadata")?.(new Event("loadedmetadata")));
      }),
      muted: false,
      preload: "",
      removeEventListener: vi.fn(),
      src: "",
    });

    await expect(extractFrames(makeFile("video/mp4"))).rejects.toThrow(
      "Cannot determine video duration.",
    );
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:video");
  });

  it("rejects and revokes object URLs when seeking times out", async () => {
    vi.useFakeTimers();
    const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:slow-video");
    const listeners = new Map<string, EventListener>();
    mockVideoElement({
      addEventListener: vi.fn((event: string, listener: EventListener) => {
        listeners.set(event, listener);
      }),
      crossOrigin: "",
      duration: 1,
      load: vi.fn(() => {
        queueMicrotask(() => listeners.get("loadedmetadata")?.(new Event("loadedmetadata")));
      }),
      muted: false,
      preload: "",
      removeEventListener: vi.fn(),
      src: "",
      videoHeight: 100,
      videoWidth: 100,
      set currentTime(_value: number) {
        // Keep the video pending until the seek timeout fires.
      },
    });

    const pending = expect(
      extractFrames(makeFile("video/mp4"), 1, { seekTimeoutMs: 10 }),
    ).rejects.toThrow("Timed out seeking video frame.");
    await vi.runAllTimersAsync();

    await pending;
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:slow-video");
  });
});
