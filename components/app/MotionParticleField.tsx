"use client";

import * as React from "react";
import { Geometry, Mesh, Program, Renderer } from "ogl";

/**
 * GPU particle field that *is* the analysis progress indicator.
 *
 * Rather than a row of animated blocks, a single cloud of particles morphs
 * through the six stages of the MotionCode pipeline as the run advances:
 *
 *   0 scatter   — raw media, unstructured
 *   1 filmstrip — frames sampled out of the source
 *   2 flow      — motion vectors resolved into lanes
 *   3 curve     — the easing curve is detected (the signature beat)
 *   4 code      — particles settle into lines of generated code
 *   5 lattice   — compiled, ordered output
 *
 * `progress` (0–100) drives a continuous morph across those formations, so the
 * visual is a literal read-out of where the analysis is, not decoration.
 * Falls back to a static grid under reduced-motion or when WebGL is missing.
 */

const COUNT = 6000;

const VERT = /* glsl */ `
  attribute vec3 position;   // scatter seed, already in unit space
  attribute vec4 aRandom;
  attribute float aId;
  attribute vec2 aTextTarget; // per-particle glyph position (clip space)

  uniform float uTime;
  uniform float uMorph;      // 0..5, continuous across formations
  uniform float uAspect;
  uniform float uCount;
  uniform float uDpr;
  uniform float uTextBlend;  // 0..1 pull of text particles toward the word
  uniform float uTextValid;  // 1 when aTextTarget holds a sampled word

  varying float vGlow;
  varying float vAccent;
  varying float vText;

  const float PI = 3.14159265;

  float hash11(float p){ return fract(sin(p * 127.1) * 43758.5453); }

  // ---- formation 0: drifting scatter (raw media) -------------------------
  vec3 fScatter(float t, vec4 r){
    float a = uTime * 0.25 + r.x * PI * 2.0;
    return vec3(
      position.x + sin(a) * 0.05,
      position.y + cos(a * 0.8) * 0.05,
      0.0
    );
  }

  // ---- formation 1: filmstrip (frames extracted) -------------------------
  vec3 fFilmstrip(float t, vec4 r){
    float frames = 8.0;
    float fi = floor(t * frames);
    float cx = (fi / (frames - 1.0) - 0.5) * 1.68;
    // pack particles into a small tile per frame
    float tw = 0.085, th = 0.20;
    return vec3(cx + (r.x - 0.5) * tw * 2.0, (r.y - 0.5) * th * 2.0, 0.0);
  }

  // ---- formation 2: motion-vector lanes ----------------------------------
  vec3 fFlow(float t, vec4 r){
    float lanes = 7.0;
    float li = floor(r.z * lanes);
    float ly = (li / (lanes - 1.0) - 0.5) * 1.1;
    float x = (t - 0.5) * 1.85;
    float y = ly + sin(x * 3.0 + uTime * 1.6 + li * 0.7) * 0.055;
    return vec3(x, y, 0.0);
  }

  // ---- formation 3: the detected easing curve ----------------------------
  vec3 fCurve(float t, vec4 r){
    // cubic bezier ~ ease(.2,.8,.2,1) mapped into view space
    vec2 p0 = vec2(-0.86, -0.52);
    vec2 p1 = vec2(-0.42, -0.52);
    vec2 p2 = vec2(-0.10,  0.52);
    vec2 p3 = vec2( 0.86,  0.52);
    float u = 1.0 - t;
    vec2 b = u*u*u*p0 + 3.0*u*u*t*p1 + 3.0*u*t*t*p2 + t*t*t*p3;
    // tight halo around the path so the curve reads as a dense line
    float spread = 0.012 + r.w * 0.05;
    float ang = r.x * PI * 2.0;
    return vec3(b.x + cos(ang) * spread * 0.6, b.y + sin(ang) * spread, 0.0);
  }

  // ---- formation 4: generated code lines ---------------------------------
  vec3 fCode(float t, vec4 r){
    float rows = 13.0;
    float ri = floor(t * rows);
    float y = (0.5 - ri / (rows - 1.0)) * 1.12;
    float indent = step(0.45, hash11(ri)) * 0.12;
    float len = 0.5 + hash11(ri + 9.0) * 1.15;
    // a token "types out" per row — a travelling caret keeps the plateau alive
    // while the API is still working instead of a frozen block of text.
    float caret = fract(uTime * 0.35 + hash11(ri + 3.0));
    float x = -0.86 + indent + r.y * len * (0.35 + caret * 0.65);
    return vec3(x, y, 0.0);
  }

  // ---- formation 5: compiled lattice -------------------------------------
  vec3 fLattice(float t, vec4 r){
    float cols = 96.0;
    float i = floor(t * uCount);
    float cx = mod(i, cols);
    float cy = floor(i / cols);
    float rowsN = ceil(uCount / cols);
    return vec3(
      (cx / (cols - 1.0) - 0.5) * 1.75,
      (cy / max(rowsN - 1.0, 1.0) - 0.5) * 1.05,
      0.0
    );
  }

  void main(){
    float t = aId / uCount;
    vec4 r = aRandom;

    vec3 p0 = fScatter(t, r);
    vec3 p1 = fFilmstrip(t, r);
    vec3 p2 = fFlow(t, r);
    vec3 p3 = fCurve(t, r);
    vec3 p4 = fCode(t, r);
    vec3 p5 = fLattice(t, r);

    // Progressive chain: each stage eases into the next. Per-particle offset
    // (r.z) staggers the transition so the cloud reorganizes, not teleports.
    float m = uMorph;
    float stagger = (r.z - 0.5) * 0.35;
    float k0 = smoothstep(0.0, 1.0, clamp(m - 0.0 + stagger, 0.0, 1.0));
    float k1 = smoothstep(0.0, 1.0, clamp(m - 1.0 + stagger, 0.0, 1.0));
    float k2 = smoothstep(0.0, 1.0, clamp(m - 2.0 + stagger, 0.0, 1.0));
    float k3 = smoothstep(0.0, 1.0, clamp(m - 3.0 + stagger, 0.0, 1.0));
    float k4 = smoothstep(0.0, 1.0, clamp(m - 4.0 + stagger, 0.0, 1.0));

    vec3 p = mix(p0, p1, k0);
    p = mix(p, p2, k1);
    p = mix(p, p3, k2);
    p = mix(p, p4, k3);
    p = mix(p, p5, k4);

    // breathe slightly so the field never looks frozen
    p.xy += vec2(sin(uTime * 0.6 + r.x * 6.28), cos(uTime * 0.5 + r.y * 6.28)) * 0.004;

    // ---- text morph -------------------------------------------------------
    // A subset of particles (r.z gate) peels out of the formation to spell the
    // active phase word, then dissolves back as the phase changes. The pull is
    // eased per-particle so the word assembles like a swarm settling, not a cut.
    float textElig = step(0.52, r.z);          // ~48% of the cloud is text-eligible
    float pull = uTextBlend * uTextValid * textElig;
    float ease = smoothstep(0.0, 1.0, clamp(uTextBlend * 1.35 - r.w * 0.3, 0.0, 1.0));
    vec3 textPos = vec3(aTextTarget, 0.0);
    // gentle shimmer on settled glyph particles keeps the word alive
    textPos.xy += vec2(sin(uTime * 1.6 + r.x * 30.0), cos(uTime * 1.4 + r.y * 30.0)) * 0.003 * pull;
    p = mix(p, textPos, pull * ease);
    vText = pull * ease;

    // accent peaks while the easing curve is being resolved
    float curveFocus = k2 * (1.0 - k3);
    vAccent = clamp(curveFocus * 1.25 + k4 * 0.4 + vText * 0.9, 0.0, 1.0);
    // Keep a visible floor so the raw scatter still reads as a living cloud,
    // then let the resolved formations bloom brighter as the story lands.
    vGlow = 0.46 + r.w * 0.5 + curveFocus * 0.65 + vText * 0.7;

    vec2 clip = vec2(p.x / uAspect, p.y);
    gl_Position = vec4(clip, 0.0, 1.0);
    gl_PointSize = (1.3 + r.w * 1.5 + curveFocus * 1.5 + vText * 1.6) * uDpr;
  }
`;

const FRAG = /* glsl */ `
  precision highp float;

  varying float vGlow;
  varying float vAccent;

  void main(){
    // soft round sprite
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float a = smoothstep(0.5, 0.0, d);
    if (a <= 0.001) discard;

    vec3 silver = vec3(0.62, 0.66, 0.72);
    vec3 accent = vec3(0.0, 0.6, 1.0);
    vec3 col = mix(silver, accent, vAccent);

    gl_FragColor = vec4(col * vGlow, a * vGlow);
  }
`;

type MotionParticleFieldProps = {
  /** Analysis progress, 0–100. Drives the morph across formations. */
  progress: number;
  /**
   * The word the field should spell out of its particles right now (e.g. the
   * active phase: "FRAMES", "VECTORS", "EASING", "CODE"). `null` dissolves any
   * word back into the formation. Changing it re-forms the swarm into the new
   * word.
   */
  label?: string | null;
  className?: string;
};

export function MotionParticleField({
  progress,
  label = null,
  className,
}: MotionParticleFieldProps) {
  const hostRef = React.useRef<HTMLDivElement>(null);
  // Live progress read by the render loop without re-running the GL effect.
  const progressRef = React.useRef(progress);
  React.useEffect(() => {
    progressRef.current = progress;
  }, [progress]);
  // Live label read by the render loop; changing it triggers a re-form.
  const labelRef = React.useRef(label);
  React.useEffect(() => {
    labelRef.current = label;
  }, [label]);

  React.useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Scaled-down (not disabled) on mobile / Save-Data: fewer particles and
    // DPR capped to 1.0. Keeps the morph readable on small GPUs.
    const isMobileWidth = window.innerWidth < 768;
    const saveData =
      (navigator as Navigator & { connection?: { saveData?: boolean } })
        .connection?.saveData === true;
    const count = isMobileWidth || saveData ? 1500 : COUNT;
    const dprCap = isMobileWidth ? 1.0 : 1.75;
    const dpr = Math.min(window.devicePixelRatio || 1, dprCap);

    let renderer: Renderer;
    try {
      renderer = new Renderer({
        alpha: true,
        dpr,
      });
    } catch (err) {
      console.warn("[webgl] renderer init failed, using static fallback", err);
      return; // static fallback stays visible
    }

    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    // additive blending — overlapping particles bloom instead of occluding
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    el.appendChild(gl.canvas);
    gl.canvas.style.width = "100%";
    gl.canvas.style.height = "100%";
    gl.canvas.style.display = "block";

    const positions = new Float32Array(count * 3);
    const randoms = new Float32Array(count * 4);
    const ids = new Float32Array(count);
    // Per-particle glyph target, filled on demand from the active word. Starts
    // zeroed; uTextValid gates the pull so particles don't collapse to origin.
    const textTargets = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      // seed scatter inside an ellipse so stage 0 reads as a soft cloud
      const a = Math.random() * Math.PI * 2;
      const rad = Math.sqrt(Math.random());
      positions[i * 3 + 0] = Math.cos(a) * rad * 0.9;
      positions[i * 3 + 1] = Math.sin(a) * rad * 0.55;
      positions[i * 3 + 2] = 0;
      randoms[i * 4 + 0] = Math.random();
      randoms[i * 4 + 1] = Math.random();
      randoms[i * 4 + 2] = Math.random();
      randoms[i * 4 + 3] = Math.random();
      ids[i] = i;
    }

    const textAttr: { size: number; data: Float32Array; needsUpdate?: boolean } = {
      size: 2,
      data: textTargets,
    };
    const geometry = new Geometry(gl, {
      position: { size: 3, data: positions },
      aRandom: { size: 4, data: randoms },
      aId: { size: 1, data: ids },
      aTextTarget: textAttr,
    });

    const program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      transparent: true,
      depthTest: false,
      uniforms: {
        uTime: { value: 0 },
        uMorph: { value: 0 },
        uAspect: { value: 1 },
        uCount: { value: count },
        uDpr: { value: dpr },
        uTextBlend: { value: 0 },
        uTextValid: { value: 0 },
      },
    });

    const mesh = new Mesh(gl, { mode: gl.POINTS, geometry, program });

    function resize() {
      const w = el!.clientWidth || 1;
      const h = el!.clientHeight || 1;
      renderer.setSize(w, h);
      program.uniforms.uAspect.value = w / h;
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    // Fill the glyph targets for the text-eligible particles (same r.z gate as
    // the shader) from a rasterized word, and flag the attribute for re-upload.
    function applyWord(word: string) {
      const pts = sampleWordPoints(word);
      if (pts.length === 0) {
        console.warn("[particles] word rasterized to zero points", word);
        program.uniforms.uTextValid.value = 0;
        return;
      }
      for (let i = 0; i < count; i++) {
        if (randoms[i * 4 + 2] > 0.52) {
          const point = pts[(Math.random() * pts.length) | 0];
          textTargets[i * 2] = point[0];
          textTargets[i * 2 + 1] = point[1];
        }
      }
      textAttr.needsUpdate = true;
      program.uniforms.uTextValid.value = 1;
    }

    let raf = 0;
    let disposed = false;
    let inViewport = true;
    let documentVisible = document.visibilityState === "visible";
    let morph = 0;
    let elapsed = 0;
    let last = performance.now();

    // Text morph transition state: dissolve the old word (blend → 0), swap the
    // glyph targets, then re-form the new word (blend → 1).
    let textBlend = 0;
    let currentLabel: string | null = null;
    let textPhase: "idle" | "out" | "in" = "idle";

    // Time to close ~63% of the gap to the target formation. Tuned so a step
    // (progress advances every ~0.6s) largely settles before the next one,
    // giving each formation a readable beat while the morph stays fluid.
    const MORPH_TAU = 0.34;

    function stopLoop() {
      if (raf !== 0) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    }

    function startLoop() {
      if (disposed || !documentVisible || !inViewport || raf !== 0) return;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    }

    function loop(now: number) {
      raf = 0;
      if (disposed || !documentVisible || !inViewport) return;
      // A context evicted by the browser (per-tab WebGL cap) makes ogl read
      // undefined internals and throw. Stop instead; the static grid stays.
      if (gl.isContextLost?.()) {
        disposed = true;
        return;
      }

      // Frame-rate-independent easing so the morph settles at the same pace on
      // 60Hz and 120Hz displays; clamp dt so a backgrounded tab doesn't snap.
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      elapsed += dt;
      program.uniforms.uTime.value = elapsed;

      // 0–100% maps across the five transitions; ease toward the target so
      // progress jumps glide through the formations instead of snapping.
      const target = (Math.min(Math.max(progressRef.current, 0), 100) / 100) * 5;
      morph += (target - morph) * (1 - Math.exp(-dt / MORPH_TAU));
      program.uniforms.uMorph.value = morph;

      // Text morph: when the active word changes, dissolve the current one,
      // swap glyph targets, then re-form. When it clears, dissolve to nothing.
      const wanted = labelRef.current;
      if (wanted !== currentLabel && textPhase !== "out") {
        textPhase = "out";
      }
      if (textPhase === "out") {
        textBlend += (0 - textBlend) * (1 - Math.exp(-dt / 0.16));
        if (textBlend < 0.04) {
          textBlend = 0;
          if (wanted) {
            applyWord(wanted);
            currentLabel = wanted;
            textPhase = "in";
          } else {
            currentLabel = null;
            program.uniforms.uTextValid.value = 0;
            textPhase = "idle";
          }
        }
      } else if (textPhase === "in") {
        textBlend += (1 - textBlend) * (1 - Math.exp(-dt / 0.5));
      }
      program.uniforms.uTextBlend.value = textBlend;

      renderer.render({ scene: mesh });
      startLoop();
    }

    function onVisibility() {
      documentVisible = document.visibilityState === "visible";
      if (documentVisible) startLoop();
      else stopLoop();
    }

    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(([entry]) => {
            inViewport = entry?.isIntersecting ?? false;
            if (inViewport) startLoop();
            else stopLoop();
          });

    function onContextLost(event: Event) {
      event.preventDefault();
      stopLoop();
      disposed = true;
    }

    gl.canvas.addEventListener("webglcontextlost", onContextLost, false);
    document.addEventListener("visibilitychange", onVisibility);
    observer?.observe(el);
    startLoop();

    return () => {
      disposed = true;
      stopLoop();
      ro.disconnect();
      observer?.disconnect();
      gl.canvas.removeEventListener("webglcontextlost", onContextLost);
      document.removeEventListener("visibilitychange", onVisibility);
      gl.canvas.remove();
      const ext = gl.getExtension("WEBGL_lose_context");
      ext?.loseContext();
    };
  }, []);

  return (
    <div className={className} aria-hidden="true">
      {/* static fallback for reduced-motion / no-WebGL */}
      <div className="absolute inset-0 grid-fade opacity-50" />
      <div ref={hostRef} className="absolute inset-0" />
    </div>
  );
}

/**
 * Rasterize a word and return the filled pixels as clip-space points, so the
 * particle field can pull a subset of its cloud into the shape of the word.
 * Uses a system monospace (no async font load) and auto-fits the width.
 */
function sampleWordPoints(word: string): Array<[number, number]> {
  const cw = 512;
  const ch = 128;
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];

  const fontStack = `ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace`;
  let fontSize = 108;
  ctx.font = `700 ${fontSize}px ${fontStack}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.letterSpacing = "6px";
  while (fontSize > 16 && ctx.measureText(word).width > cw * 0.9) {
    fontSize -= 6;
    ctx.font = `700 ${fontSize}px ${fontStack}`;
  }

  ctx.clearRect(0, 0, cw, ch);
  ctx.fillStyle = "#fff";
  ctx.fillText(word, cw / 2, ch / 2);

  const { data } = ctx.getImageData(0, 0, cw, ch);
  const points: Array<[number, number]> = [];
  // Sample every few pixels — enough density for a legible word without
  // over-sampling beyond the ~2900 text-eligible particles.
  const stride = 3;
  for (let y = 0; y < ch; y += stride) {
    for (let x = 0; x < cw; x += stride) {
      if (data[(y * cw + x) * 4 + 3] > 128) {
        // Map into the field's pre-aspect space. x is widened because the
        // shader divides x by the (wide) aspect before projecting to clip.
        points.push([(x / cw - 0.5) * 1.9, -(y / ch - 0.5) * 0.42]);
      }
    }
  }
  return points;
}
