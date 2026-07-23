"use client";

import * as React from "react";
import { Renderer, Program, Mesh, Triangle, Texture } from "ogl";
import { cn } from "@/lib/utils";

/**
 * MetalText — real animated WebGL chrome. The visible text is rendered to an
 * offscreen 2D canvas (using the element's own computed font) and uploaded as an
 * alpha mask; a full-quad chrome fragment shader is multiplied by that mask so
 * the metal only appears inside the glyphs. The DOM text stays in place (kept
 * transparent) so it remains selectable and accessible to screen readers.
 */

const VERT = /* glsl */ `
  attribute vec2 uv;
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  uniform sampler2D uMask;
  uniform float uTime;
  uniform float uMouse;   // -1 when idle, else 0..1 highlight x
  uniform float uHover;   // 0..1 hover intensity
  uniform float uBlue;    // 0..1 blue tint in highlights
  varying vec2 vUv;

  float hash(vec2 p){ return fract(sin(dot(p, vec2(41.31, 289.17))) * 43758.5453); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    float a = hash(i), b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  void main() {
    // mask canvas is drawn top-down; flip Y to match GL uv
    float mask = texture2D(uMask, vec2(vUv.x, 1.0 - vUv.y)).a;
    if (mask < 0.008) { gl_FragColor = vec4(0.0); return; }

    vec2 uv = vUv;

    // flowing coordinate — the chrome slowly drifts across the glyphs
    float flow = uv.x * 1.15 + sin(uv.y * 2.0 + uTime * 0.18) * 0.12 + uTime * 0.05;

    // fine brushed-metal streaks
    float streak = (noise(vec2(uv.x * 220.0, uv.y * 7.0)) - 0.5) * 0.10;

    // vertical chrome bands: dark steel -> bright -> dark, warped by flow
    float g = uv.y + streak + sin(flow * 3.1415) * 0.10;
    float bands = 0.5 + 0.5 * sin(g * 6.2831 + sin(flow * 2.4) * 1.6);
    float lum = mix(0.16, 0.98, pow(bands, 1.25));

    // travelling specular sweep
    float sweep = smoothstep(0.14, 0.0, abs(fract(flow) - 0.5));
    lum += sweep * 0.55;

    // pointer-driven highlight
    if (uMouse >= 0.0) {
      float mh = smoothstep(0.22, 0.0, abs(uv.x - uMouse));
      lum += mh * 0.45 * uHover;
    }

    lum = clamp(lum, 0.0, 1.25);

    // blue tint rides the brightest highlights only
    vec3 tint = mix(vec3(1.0), vec3(0.62, 0.79, 1.0), uBlue);
    vec3 col = vec3(lum) * mix(vec3(1.0), tint, smoothstep(0.62, 1.05, lum));

    // premultiplied output
    gl_FragColor = vec4(col * mask, mask);
  }
`;

type Props = {
  text: string;
  className?: string;
  /** enable pointer-tracked highlight */
  interactive?: boolean;
  /** 0..1 blue tint strength on highlights */
  blue?: number;
};

export function MetalText({ text, className, interactive = false, blue = 0.5 }: Props) {
  const wrapRef = React.useRef<HTMLSpanElement>(null);
  const textRef = React.useRef<HTMLSpanElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const mouse = React.useRef({ x: -1, hover: 0 });
  // Only true once a WebGL context exists AND has painted a frame. Until then
  // (and again if the context is lost) the DOM text stays visible as CSS chrome,
  // so the wordmark is never an invisible or half-painted box.
  const [glReady, setGlReady] = React.useState(false);

  React.useEffect(() => {
    const wrap = wrapRef.current;
    const textEl = textRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !textEl || !canvas) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    // Browsers cap simultaneous WebGL contexts (and some have none at all).
    // ogl throws from its constructor when getContext() returns null, so this
    // must be guarded or the throw escapes to the route error boundary and
    // takes the whole page down.
    let renderer: Renderer;
    try {
      renderer = new Renderer({
        canvas,
        alpha: true,
        premultipliedAlpha: true,
        dpr: Math.min(window.devicePixelRatio || 1, 2),
      });
    } catch {
      return; // CSS chrome fallback stays visible
    }

    const gl = renderer.gl;
    if (!gl) return;
    gl.clearColor(0, 0, 0, 0);

    const maskCanvas = document.createElement("canvas");
    const mctx = maskCanvas.getContext("2d")!;

    const maskTex = new Texture(gl, {
      generateMipmaps: false,
      flipY: false,
      minFilter: gl.LINEAR,
      magFilter: gl.LINEAR,
      wrapS: gl.CLAMP_TO_EDGE,
      wrapT: gl.CLAMP_TO_EDGE,
    });

    const program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uMask: { value: maskTex },
        uTime: { value: 0 },
        uMouse: { value: -1 },
        uHover: { value: 0 },
        uBlue: { value: blue },
      },
    });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    let w = 0;
    let h = 0;

    function buildMask() {
      const rect = wrap!.getBoundingClientRect();
      w = Math.max(1, Math.ceil(rect.width));
      h = Math.max(1, Math.ceil(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      maskCanvas.width = Math.ceil(w * dpr);
      maskCanvas.height = Math.ceil(h * dpr);

      const cs = getComputedStyle(textEl!);
      mctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      mctx.clearRect(0, 0, w, h);
      mctx.fillStyle = "#fff";
      mctx.textBaseline = "alphabetic";
      mctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      // letterSpacing is supported on modern 2D contexts; harmless if ignored
      try {
        (mctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing =
          cs.letterSpacing === "normal" ? "0px" : cs.letterSpacing;
      } catch {
        /* older engines */
      }

      const m = mctx.measureText(text);
      const ascent = m.actualBoundingBoxAscent || parseFloat(cs.fontSize) * 0.8;
      const descent = m.actualBoundingBoxDescent || parseFloat(cs.fontSize) * 0.2;
      const glyphH = ascent + descent;
      // vertically centre the ink within the box
      const y = (h - glyphH) / 2 + ascent;
      const x = m.actualBoundingBoxLeft || 0;
      mctx.fillText(text, x, y);

      maskTex.image = maskCanvas;
      maskTex.needsUpdate = true;

      renderer.setSize(w, h);
    }

    let raf = 0;
    let visible = true;
    let dead = false;
    const start = performance.now();

    // Drop back to the CSS fallback and stop touching GL for good.
    function retire() {
      if (dead) return;
      dead = true;
      cancelAnimationFrame(raf);
      setGlReady(false);
    }

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      if (dead) return;
      if (!visible) return;
      // A context evicted by the browser makes ogl read undefined internals
      // ("Cannot read properties of undefined (reading 'forEach')").
      if (gl.isContextLost?.()) return retire();

      program.uniforms.uTime.value = reduce ? 0.6 : (now - start) / 1000;
      // ease pointer highlight in/out
      const target = mouse.current.x;
      program.uniforms.uMouse.value = target;
      mouse.current.hover += ((target >= 0 ? 1 : 0) - mouse.current.hover) * 0.12;
      program.uniforms.uHover.value = mouse.current.hover;

      try {
        renderer.render({ scene: mesh });
      } catch {
        return retire();
      }
      setGlReady(true);
    }

    const onContextLost = (event: Event) => {
      event.preventDefault();
      retire();
    };
    canvas.addEventListener("webglcontextlost", onContextLost);

    buildMask();
    raf = requestAnimationFrame(frame);

    const ro = new ResizeObserver(() => buildMask());
    ro.observe(wrap);

    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? true;
      },
      { rootMargin: "120px" },
    );
    io.observe(wrap);

    const onVis = () => {
      if (document.hidden) visible = false;
    };
    document.addEventListener("visibilitychange", onVis);

    // fonts may swap in after first paint — rebuild the mask when they land
    document.fonts?.ready
      .then(() => {
        if (!dead) buildMask();
      })
      .catch(() => {});

    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("webglcontextlost", onContextLost);
      document.removeEventListener("visibilitychange", onVis);
      // Hand the context back to the browser so the page stays under the
      // per-tab WebGL context cap.
      const ext = gl.getExtension("WEBGL_lose_context");
      ext?.loseContext();
    };
  }, [text, blue]);

  const onMove = (e: React.MouseEvent) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouse.current.x = (e.clientX - rect.left) / rect.width;
  };
  const onLeave = () => {
    mouse.current.x = -1;
  };

  return (
    <span
      ref={wrapRef}
      className={cn("relative inline-block align-baseline", className)}
      onMouseMove={interactive ? onMove : undefined}
      onMouseLeave={interactive ? onLeave : undefined}
    >
      {/* Visible text. While GL is unavailable/lost this carries the CSS chrome
          gradient so the wordmark still reads as brushed metal; once the shader
          is confirmed painting it goes transparent and the canvas takes over. */}
      <span
        ref={textRef}
        className={cn(!glReady && "lm-text", !glReady && interactive && "lm-interactive")}
        style={glReady ? { color: "transparent" } : undefined}
      >
        {text}
      </span>
      <canvas
        ref={canvasRef}
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 h-full w-full transition-opacity duration-300",
          glReady ? "opacity-100" : "opacity-0",
        )}
      />
    </span>
  );
}
