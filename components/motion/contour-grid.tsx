"use client";

import * as React from "react";
import { Renderer, Program, Mesh, Triangle, Vec2 } from "ogl";

const VERT = /* glsl */ `
  attribute vec2 uv;
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

// Topographic dot field: a drifting height field drives dot size + brightness,
// giving contour-map "blooms". Click pulses ripple outward through the field.
const FRAG = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec2  uResolution;
  uniform vec2  uMouse;       // top-left px
  uniform float uScrollPx;    // window.scrollY
  uniform float uHeroPx;      // first-screen height
  uniform vec2  uRevive;      // page-Y band [top, bottom] to relight; <0 = inactive
  uniform vec2  uPulse0;
  uniform vec2  uPulse1;
  uniform vec2  uPulse2;
  uniform float uAge0;        // seconds since fired; <0 = inactive
  uniform float uAge1;
  uniform float uAge2;

  varying vec2 vUv;

  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p){
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++){ v += a * noise(p); p *= 2.0; a *= 0.5; }
    return v;
  }
  float pulseH(vec2 fc, vec2 o, float age){
    if (age < 0.0) return 0.0;
    float dpx = length(fc - o);
    float radius = age * 560.0;
    float ring = sin((dpx - radius) * 0.028);
    float env = exp(-abs(dpx - radius) * 0.006) * exp(-age * 1.5);
    return ring * env;
  }

  void main(){
    // top-left origin so mouse / scroll math is intuitive
    vec2 fc = vec2(vUv.x, 1.0 - vUv.y) * uResolution;
    float pageY = fc.y + uScrollPx;

    // drifting height field
    vec2 fp = fc / 340.0;
    float h = fbm(fp + vec2(uTime * 0.06, uTime * 0.045));
    h += 0.5 * fbm(fp * 2.0 - vec2(uTime * 0.03, uTime * 0.02));
    h /= 1.5;

    // interactive pulses
    h += 0.7 * (pulseH(fc, uPulse0, uAge0) + pulseH(fc, uPulse1, uAge1) + pulseH(fc, uPulse2, uAge2));

    // contour banding + filled blooms
    float bands = abs(fract(h * 6.0) - 0.5) * 2.0;
    float contour = smoothstep(0.5, 0.0, bands);
    float bloom = smoothstep(0.45, 0.95, h);
    float level = max(bloom, contour * 0.55);

    // dot mask on a regular grid; radius grows with level
    float cell = 26.0;
    vec2 g = mod(fc, cell) - cell * 0.5;
    float d = length(g);
    float r = mix(0.55, 2.5, level);
    float dot = smoothstep(r + 0.6, r - 0.6, d);

    // hero-strong, subtle-elsewhere (scroll-aware)
    float heroMask = smoothstep(uHeroPx * 1.15, uHeroPx * 0.35, pageY);
    float strength = mix(0.12, 1.0, heroMask);

    // revival band: relight the field behind the pinned "how it works" stage,
    // fading softly in/out at the band edges so there's no hard seam. Inactive
    // when uRevive.x < 0 (band not on screen / not rendered).
    if (uRevive.x >= 0.0) {
      float fade = 220.0; // px of soft ramp at each edge
      float reviveMask = smoothstep(uRevive.x - fade, uRevive.x + fade, pageY)
                       * smoothstep(uRevive.y + fade, uRevive.y - fade, pageY);
      strength = max(strength, mix(0.12, 0.5, reviveMask));
    }

    // horizontal edge fade keeps the field off the extreme margins
    vec2 np = fc / uResolution;
    float edge = smoothstep(0.0, 0.14, np.x) * smoothstep(1.0, 0.86, np.x);

    // cursor emphasis
    float md = length(fc - uMouse) / uResolution.y;
    float mouse = smoothstep(0.30, 0.0, md);

    float intensity = dot * (0.18 + level * 1.0) * strength * edge;
    intensity += dot * mouse * 0.55 * strength * edge;

    vec3 silver = vec3(0.66, 0.70, 0.78);
    vec3 accent = vec3(0.0, 0.6, 1.0);
    vec3 col = mix(silver, accent, smoothstep(0.55, 1.0, level)) * intensity;

    gl_FragColor = vec4(col, intensity);
  }
`;

// Mobile variant: 3 fbm octaves instead of 4 to cut fragment cost on small
// GPUs. Same look, fewer noise taps — scaled down, not disabled.
const FRAG_MOBILE = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec2  uResolution;
  uniform vec2  uMouse;       // top-left px
  uniform float uScrollPx;    // window.scrollY
  uniform float uHeroPx;      // first-screen height
  uniform vec2  uRevive;      // page-Y band [top, bottom] to relight; <0 = inactive
  uniform vec2  uPulse0;
  uniform vec2  uPulse1;
  uniform vec2  uPulse2;
  uniform float uAge0;        // seconds since fired; <0 = inactive
  uniform float uAge1;
  uniform float uAge2;

  varying vec2 vUv;

  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p){
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 3; i++){ v += a * noise(p); p *= 2.0; a *= 0.5; }
    return v;
  }
  float pulseH(vec2 fc, vec2 o, float age){
    if (age < 0.0) return 0.0;
    float dpx = length(fc - o);
    float radius = age * 560.0;
    float ring = sin((dpx - radius) * 0.028);
    float env = exp(-abs(dpx - radius) * 0.006) * exp(-age * 1.5);
    return ring * env;
  }

  void main(){
    // top-left origin so mouse / scroll math is intuitive
    vec2 fc = vec2(vUv.x, 1.0 - vUv.y) * uResolution;
    float pageY = fc.y + uScrollPx;

    // drifting height field
    vec2 fp = fc / 340.0;
    float h = fbm(fp + vec2(uTime * 0.06, uTime * 0.045));
    h += 0.5 * fbm(fp * 2.0 - vec2(uTime * 0.03, uTime * 0.02));
    h /= 1.5;

    // interactive pulses
    h += 0.7 * (pulseH(fc, uPulse0, uAge0) + pulseH(fc, uPulse1, uAge1) + pulseH(fc, uPulse2, uAge2));

    // contour banding + filled blooms
    float bands = abs(fract(h * 6.0) - 0.5) * 2.0;
    float contour = smoothstep(0.5, 0.0, bands);
    float bloom = smoothstep(0.45, 0.95, h);
    float level = max(bloom, contour * 0.55);

    // dot mask on a regular grid; radius grows with level
    float cell = 26.0;
    vec2 g = mod(fc, cell) - cell * 0.5;
    float d = length(g);
    float r = mix(0.55, 2.5, level);
    float dot = smoothstep(r + 0.6, r - 0.6, d);

    // hero-strong, subtle-elsewhere (scroll-aware)
    float heroMask = smoothstep(uHeroPx * 1.15, uHeroPx * 0.35, pageY);
    float strength = mix(0.12, 1.0, heroMask);

    // revival band: relight the field behind the pinned "how it works" stage,
    // fading softly in/out at the band edges so there's no hard seam. Inactive
    // when uRevive.x < 0 (band not on screen / not rendered).
    if (uRevive.x >= 0.0) {
      float fade = 220.0; // px of soft ramp at each edge
      float reviveMask = smoothstep(uRevive.x - fade, uRevive.x + fade, pageY)
                       * smoothstep(uRevive.y + fade, uRevive.y - fade, pageY);
      strength = max(strength, mix(0.12, 0.5, reviveMask));
    }

    // horizontal edge fade keeps the field off the extreme margins
    vec2 np = fc / uResolution;
    float edge = smoothstep(0.0, 0.14, np.x) * smoothstep(1.0, 0.86, np.x);

    // cursor emphasis
    float md = length(fc - uMouse) / uResolution.y;
    float mouse = smoothstep(0.30, 0.0, md);

    float intensity = dot * (0.18 + level * 1.0) * strength * edge;
    intensity += dot * mouse * 0.55 * strength * edge;

    vec3 silver = vec3(0.66, 0.70, 0.78);
    vec3 accent = vec3(0.0, 0.6, 1.0);
    vec3 col = mix(silver, accent, smoothstep(0.55, 1.0, level)) * intensity;

    gl_FragColor = vec4(col, intensity);
  }
`;

const MAX_PULSES = 3;

export function ContourGrid() {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let renderer: Renderer;
    // Scaled-down on mobile: cap DPR to 1.0 under 768px width.
    const isMobileWidth = window.innerWidth < 768;
    try {
      renderer = new Renderer({
        alpha: true,
        dpr: isMobileWidth
          ? Math.min(window.devicePixelRatio || 1, 1.0)
          : Math.min(window.devicePixelRatio || 1, 1.6),
      });
    } catch (err) {
      console.warn("[webgl] renderer init failed, using static fallback", err);
      return; // CSS fallback stays visible
    }

    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    el.appendChild(gl.canvas);
    gl.canvas.style.width = "100%";
    gl.canvas.style.height = "100%";
    gl.canvas.style.display = "block";
    // This component arrives in a lazy chunk, so it mounts after the static
    // grid-fade fallback is already on screen. Fade the canvas in over it
    // instead of snapping, which would read as a pop-in.
    gl.canvas.style.opacity = "0";
    gl.canvas.style.transition = "opacity 600ms cubic-bezier(.2,.8,.2,1)";

    const program = new Program(gl, {
      vertex: VERT,
      fragment: isMobileWidth ? FRAG_MOBILE : FRAG,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new Vec2(1, 1) },
        uMouse: { value: new Vec2(-999, -999) },
        uScrollPx: { value: 0 },
        uHeroPx: { value: window.innerHeight },
        uRevive: { value: new Vec2(-1, -1) },
        uPulse0: { value: new Vec2(0, 0) },
        uPulse1: { value: new Vec2(0, 0) },
        uPulse2: { value: new Vec2(0, 0) },
        uAge0: { value: -1 },
        uAge1: { value: -1 },
        uAge2: { value: -1 },
      },
    });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    function resize() {
      const w = el!.clientWidth;
      const h = el!.clientHeight;
      renderer.setSize(w, h);
      program.uniforms.uResolution.value.set(w, h);
      program.uniforms.uHeroPx.value = window.innerHeight;
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    function onMove(e: PointerEvent) {
      program.uniforms.uMouse.value.set(e.clientX, e.clientY);
    }
    window.addEventListener("pointermove", onMove, { passive: true });

    // ring buffer of click pulses
    const pulseVecs = [
      program.uniforms.uPulse0.value,
      program.uniforms.uPulse1.value,
      program.uniforms.uPulse2.value,
    ];
    const pulseUniforms = [
      program.uniforms.uAge0,
      program.uniforms.uAge1,
      program.uniforms.uAge2,
    ];
    const pulseStart = new Array(MAX_PULSES).fill(-1);
    let pulseIdx = 0;
    function onDown(e: PointerEvent) {
      const i = pulseIdx % MAX_PULSES;
      pulseVecs[i].set(e.clientX, e.clientY);
      pulseStart[i] = performance.now();
      pulseIdx++;
    }
    window.addEventListener("pointerdown", onDown, { passive: true });

    let raf = 0;
    let running = true;
    let revealed = false;
    const start = performance.now();
    function loop(now: number) {
      if (!running) return;
      // A context evicted by the browser (per-tab WebGL cap) makes ogl read
      // undefined internals and throw. Stop instead; the CSS grid stays.
      if (gl.isContextLost?.()) {
        running = false;
        return;
      }
      const t = (now - start) / 1000;
      program.uniforms.uTime.value = t;
      program.uniforms.uScrollPx.value = window.scrollY;

      // Relight the field behind the pinned "how it works" stage. Only the
      // desktop layout renders #how; when absent the band stays inactive.
      const how = document.getElementById("how");
      if (how) {
        const rect = how.getBoundingClientRect();
        const top = rect.top + window.scrollY;
        program.uniforms.uRevive.value.set(top, top + rect.height);
      } else {
        program.uniforms.uRevive.value.set(-1, -1);
      }

      for (let i = 0; i < MAX_PULSES; i++) {
        const s = pulseStart[i];
        const age = s < 0 ? -1 : (now - s) / 1000;
        pulseUniforms[i].value = age > 4 ? -1 : age; // expire after 4s
      }
      renderer.render({ scene: mesh });
      // Reveal only once there's a real frame on the canvas, so the fade goes
      // fallback → grid rather than fallback → blank → grid.
      if (!revealed) {
        revealed = true;
        gl.canvas.style.opacity = "1";
      }
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    function onVisibility() {
      running = document.visibilityState === "visible";
      if (running) raf = requestAnimationFrame(loop);
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      document.removeEventListener("visibilitychange", onVisibility);
      gl.canvas.remove();
      const ext = gl.getExtension("WEBGL_lose_context");
      ext?.loseContext();
    };
  }, []);

  // Only the WebGL canvas mount. The static `grid-fade` fallback lives in
  // SiteBackground so it paints on first frame — this component is loaded
  // lazily, and a fallback that arrived with it would defeat the purpose.
  return <div ref={ref} className="absolute inset-0" aria-hidden />;
}
