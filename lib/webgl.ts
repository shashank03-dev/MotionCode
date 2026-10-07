"use client";

let webglSupport: boolean | null = null;

/**
 * Whether this browser can create a WebGL context at all (GPU blocklisted,
 * WebGL disabled for privacy, headless without GL...). ogl's Renderer logs a
 * console error before throwing when getContext() returns null, so the WebGL
 * visuals check this first and keep their static fallback quietly.
 *
 * The probe runs once per page and releases its context immediately, so it
 * doesn't count against the browser's per-page context cap.
 */
export function canUseWebGL(): boolean {
  if (webglSupport !== null) return webglSupport;
  if (typeof document === "undefined") return false;

  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl2") ??
      canvas.getContext("webgl")) as WebGLRenderingContext | null;
    webglSupport = gl !== null;
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    webglSupport = false;
  }

  return webglSupport;
}
