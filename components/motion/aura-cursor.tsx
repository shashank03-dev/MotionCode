"use client";

import * as React from "react";
import { Renderer, Program, Mesh, Triangle, Vec2, RenderTarget } from "ogl";

/**
 * AuraCursor — a real-time incompressible fluid simulation (Navier–Stokes,
 * stable-fluids / Jacobi-pressure method) driven by the pointer. Moving the
 * cursor injects velocity + electric-blue dye; the solver advects, applies
 * vorticity confinement for the characteristic swirl, projects the velocity
 * field divergence-free, and fades the dye. Composited over the contour grid
 * with CSS `mix-blend-mode: screen`, so black areas read as transparent.
 *
 * Monochrome blue to match the site accent (#0099ff). Dark-only, no toggle.
 */

const VERT = /* glsl */ `
  precision highp float;
  attribute vec2 position;
  attribute vec2 uv;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

// Semi-Lagrangian advection: trace back along the velocity field and sample.
const ADVECT = /* glsl */ `
  precision highp float;
  uniform sampler2D uVelocity;
  uniform sampler2D uSource;
  uniform vec2 texelSize;
  uniform float dt;
  uniform float dissipation;
  varying vec2 vUv;
  void main() {
    vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
    vec4 result = texture2D(uSource, coord);
    float decay = 1.0 + dissipation * dt;
    gl_FragColor = result / decay;
  }
`;

// Divergence of the velocity field (how much is flowing in/out of each cell).
const DIVERGENCE = /* glsl */ `
  precision highp float;
  uniform sampler2D uVelocity;
  uniform vec2 texelSize;
  varying vec2 vUv;
  void main() {
    float L = texture2D(uVelocity, vUv - vec2(texelSize.x, 0.0)).x;
    float R = texture2D(uVelocity, vUv + vec2(texelSize.x, 0.0)).x;
    float T = texture2D(uVelocity, vUv + vec2(0.0, texelSize.y)).y;
    float B = texture2D(uVelocity, vUv - vec2(0.0, texelSize.y)).y;
    float div = 0.5 * (R - L + T - B);
    gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
  }
`;

// Curl (scalar vorticity) of the velocity field.
const CURL = /* glsl */ `
  precision highp float;
  uniform sampler2D uVelocity;
  uniform vec2 texelSize;
  varying vec2 vUv;
  void main() {
    float L = texture2D(uVelocity, vUv - vec2(texelSize.x, 0.0)).y;
    float R = texture2D(uVelocity, vUv + vec2(texelSize.x, 0.0)).y;
    float T = texture2D(uVelocity, vUv + vec2(0.0, texelSize.y)).x;
    float B = texture2D(uVelocity, vUv - vec2(0.0, texelSize.y)).x;
    float vorticity = R - L - T + B;
    gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
  }
`;

// Vorticity confinement: re-inject the small-scale swirl the solver damps out.
const VORTICITY = /* glsl */ `
  precision highp float;
  uniform sampler2D uVelocity;
  uniform sampler2D uCurl;
  uniform float curl;
  uniform float dt;
  uniform vec2 texelSize;
  varying vec2 vUv;
  void main() {
    float L = texture2D(uCurl, vUv - vec2(texelSize.x, 0.0)).x;
    float R = texture2D(uCurl, vUv + vec2(texelSize.x, 0.0)).x;
    float T = texture2D(uCurl, vUv + vec2(0.0, texelSize.y)).x;
    float B = texture2D(uCurl, vUv - vec2(0.0, texelSize.y)).x;
    float C = texture2D(uCurl, vUv).x;
    vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
    force /= length(force) + 0.0001;
    force *= curl * C;
    force.y *= -1.0;
    vec2 velocity = texture2D(uVelocity, vUv).xy;
    velocity += force * dt;
    velocity = clamp(velocity, -1000.0, 1000.0);
    gl_FragColor = vec4(velocity, 0.0, 1.0);
  }
`;

// Jacobi iteration of the pressure Poisson equation.
const PRESSURE = /* glsl */ `
  precision highp float;
  uniform sampler2D uPressure;
  uniform sampler2D uDivergence;
  uniform vec2 texelSize;
  varying vec2 vUv;
  void main() {
    float L = texture2D(uPressure, vUv - vec2(texelSize.x, 0.0)).x;
    float R = texture2D(uPressure, vUv + vec2(texelSize.x, 0.0)).x;
    float T = texture2D(uPressure, vUv + vec2(0.0, texelSize.y)).x;
    float B = texture2D(uPressure, vUv - vec2(0.0, texelSize.y)).x;
    float divergence = texture2D(uDivergence, vUv).x;
    float pressure = (L + R + B + T - divergence) * 0.25;
    gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
  }
`;

// Subtract the pressure gradient → velocity becomes (near) divergence-free.
const GRADIENT = /* glsl */ `
  precision highp float;
  uniform sampler2D uPressure;
  uniform sampler2D uVelocity;
  uniform vec2 texelSize;
  varying vec2 vUv;
  void main() {
    float L = texture2D(uPressure, vUv - vec2(texelSize.x, 0.0)).x;
    float R = texture2D(uPressure, vUv + vec2(texelSize.x, 0.0)).x;
    float T = texture2D(uPressure, vUv + vec2(0.0, texelSize.y)).x;
    float B = texture2D(uPressure, vUv - vec2(0.0, texelSize.y)).x;
    vec2 velocity = texture2D(uVelocity, vUv).xy;
    velocity -= vec2(R - L, T - B);
    gl_FragColor = vec4(velocity, 0.0, 1.0);
  }
`;

// Gaussian splat added to whatever target (velocity or dye) is bound.
const SPLAT = /* glsl */ `
  precision highp float;
  uniform sampler2D uTarget;
  uniform float aspectRatio;
  uniform vec3 color;
  uniform vec2 point;
  uniform float radius;
  varying vec2 vUv;
  void main() {
    vec2 p = vUv - point.xy;
    p.x *= aspectRatio;
    vec3 splat = exp(-dot(p, p) / radius) * color;
    vec3 base = texture2D(uTarget, vUv).xyz;
    gl_FragColor = vec4(base + splat, 1.0);
  }
`;

// Scale a texture by a constant (used to decay the pressure seed each frame).
const CLEAR = /* glsl */ `
  precision highp float;
  uniform sampler2D uTexture;
  uniform float value;
  varying vec2 vUv;
  void main() {
    gl_FragColor = value * texture2D(uTexture, vUv);
  }
`;

// Present the dye. Gentle tone curve + a touch of accent bias so thin wisps
// still read as electric blue rather than washing toward white.
const DISPLAY = /* glsl */ `
  precision highp float;
  uniform sampler2D uTexture;
  varying vec2 vUv;
  void main() {
    vec3 c = texture2D(uTexture, vUv).rgb;
    // soft shoulder so bright cores glow without clipping harshly
    c = c / (c + vec3(0.75)) * 1.22;
    gl_FragColor = vec4(c, 1.0);
  }
`;

// Simulation tuning.
const SIM_RESOLUTION = 128;
const DYE_RESOLUTION = 512;
const DENSITY_DISSIPATION = 3.3; // how fast the blue fades after you stop
const VELOCITY_DISSIPATION = 0.3;
const PRESSURE_VALUE = 0.8;
const PRESSURE_ITERATIONS = 20;
const CURL_STRENGTH = 24;
const SPLAT_RADIUS = 0.17; // fraction of the smaller screen dimension
const SPLAT_FORCE = 4200;
const ACCENT = [0.0, 0.6, 1.0]; // #0099ff, the site accent

type FBO = { rt: RenderTarget; texelSize: Vec2 };
type DoubleFBO = {
  read: FBO;
  write: FBO;
  swap: () => void;
  texelSize: Vec2;
};

export function AuraCursor() {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Scaled-down (not disabled) on coarse pointers: smaller sim buffers and
    // fewer pressure solves keep the fluid alive on mobile GPUs.
    const isCoarse =
      window.matchMedia("(pointer: coarse)").matches ||
      window.matchMedia("(pointer:coarse)").matches;
    const simRes = isCoarse ? 64 : SIM_RESOLUTION;
    const dyeRes = isCoarse ? 256 : DYE_RESOLUTION;
    const pressureIters = isCoarse ? 10 : PRESSURE_ITERATIONS;

    let renderer: Renderer;
    try {
      renderer = new Renderer({
        alpha: false,
        depth: false,
        stencil: false,
        dpr: 1, // sim runs in its own low-res buffers; display is upsampled
      });
    } catch (err) {
      console.warn("[webgl] renderer init failed, using static fallback", err);
      return;
    }

    const gl = renderer.gl;
    // Float render targets need these extensions (WebGL2 has half-float linear
    // filtering in core, but rendering to it still needs the color-buffer ext).
    const isWebgl2 = (renderer as unknown as { isWebgl2: boolean }).isWebgl2;
    if (isWebgl2) {
      gl.getExtension("EXT_color_buffer_float");
    } else {
      // WebGL1 fallback path: half-float via extension, linear filtering ext.
      gl.getExtension("OES_texture_half_float");
      gl.getExtension("OES_texture_half_float_linear");
    }

    const HALF_FLOAT = isWebgl2
      ? (gl as WebGL2RenderingContext).HALF_FLOAT
      : (gl.getExtension("OES_texture_half_float")?.HALF_FLOAT_OES ??
        gl.UNSIGNED_BYTE);

    // GL constants for the packed float formats (WebGL2 named internalFormats).
    const gl2 = gl as WebGL2RenderingContext;
    const FMT = isWebgl2
      ? {
          rgba: { internalFormat: gl2.RGBA16F, format: gl.RGBA },
          rg: { internalFormat: gl2.RG16F, format: gl2.RG },
          r: { internalFormat: gl2.R16F, format: gl2.RED },
        }
      : {
          rgba: { internalFormat: gl.RGBA, format: gl.RGBA },
          rg: { internalFormat: gl.RGBA, format: gl.RGBA },
          r: { internalFormat: gl.RGBA, format: gl.RGBA },
        };

    gl.clearColor(0, 0, 0, 1);
    el.appendChild(gl.canvas);
    gl.canvas.style.width = "100%";
    gl.canvas.style.height = "100%";
    gl.canvas.style.display = "block";

    const geometry = new Triangle(gl);

    function makeFBO(
      w: number,
      h: number,
      fmt: { internalFormat: number; format: number },
      filter: number,
    ): FBO {
      const rt = new RenderTarget(gl, {
        width: w,
        height: h,
        type: HALF_FLOAT,
        format: fmt.format,
        internalFormat: fmt.internalFormat,
        minFilter: filter,
        magFilter: filter,
        depth: false,
        wrapS: gl.CLAMP_TO_EDGE,
        wrapT: gl.CLAMP_TO_EDGE,
      });
      return { rt, texelSize: new Vec2(1 / w, 1 / h) };
    }

    function makeDoubleFBO(
      w: number,
      h: number,
      fmt: { internalFormat: number; format: number },
      filter: number,
    ): DoubleFBO {
      let a = makeFBO(w, h, fmt, filter);
      let b = makeFBO(w, h, fmt, filter);
      return {
        get read() {
          return a;
        },
        get write() {
          return b;
        },
        swap() {
          const t = a;
          a = b;
          b = t;
        },
        texelSize: a.texelSize,
      } as DoubleFBO;
    }

    // Resolution helpers — keep sim buffers proportional to the viewport.
    function dims(res: number) {
      let aspect = gl.drawingBufferWidth / gl.drawingBufferHeight;
      if (aspect < 1) aspect = 1 / aspect;
      const min = Math.round(res);
      const max = Math.round(res * aspect);
      return gl.drawingBufferWidth > gl.drawingBufferHeight
        ? { w: max, h: min }
        : { w: min, h: max };
    }

    let velocity: DoubleFBO;
    let dye: DoubleFBO;
    let divergence: FBO;
    let curl: FBO;
    let pressure: DoubleFBO;

    function disposeFBO(f: FBO | undefined) {
      if (!f) return;
      gl.deleteFramebuffer(f.rt.buffer);
      for (const t of f.rt.textures) gl.deleteTexture(t.texture);
    }
    function disposeDouble(d: DoubleFBO | undefined) {
      if (!d) return;
      disposeFBO(d.read);
      disposeFBO(d.write);
    }

    function initFramebuffers() {
      // free the previous generation so a resize doesn't leak GPU memory
      disposeDouble(velocity);
      disposeDouble(dye);
      disposeDouble(pressure);
      disposeFBO(divergence);
      disposeFBO(curl);

      const sim = dims(simRes);
      const dyeD = dims(dyeRes);
      const L = gl.LINEAR;
      const N = gl.NEAREST;
      velocity = makeDoubleFBO(sim.w, sim.h, FMT.rg, L);
      dye = makeDoubleFBO(dyeD.w, dyeD.h, FMT.rgba, L);
      divergence = makeFBO(sim.w, sim.h, FMT.r, N);
      curl = makeFBO(sim.w, sim.h, FMT.r, N);
      pressure = makeDoubleFBO(sim.w, sim.h, FMT.r, N);
    }

    // Programs.
    const advect = new Program(gl, {
      vertex: VERT,
      fragment: ADVECT,
      depthTest: false,
      uniforms: {
        uVelocity: { value: null },
        uSource: { value: null },
        texelSize: { value: new Vec2() },
        dt: { value: 0 },
        dissipation: { value: 0 },
      },
    });
    const divergenceProg = new Program(gl, {
      vertex: VERT,
      fragment: DIVERGENCE,
      depthTest: false,
      uniforms: { uVelocity: { value: null }, texelSize: { value: new Vec2() } },
    });
    const curlProg = new Program(gl, {
      vertex: VERT,
      fragment: CURL,
      depthTest: false,
      uniforms: { uVelocity: { value: null }, texelSize: { value: new Vec2() } },
    });
    const vorticityProg = new Program(gl, {
      vertex: VERT,
      fragment: VORTICITY,
      depthTest: false,
      uniforms: {
        uVelocity: { value: null },
        uCurl: { value: null },
        curl: { value: CURL_STRENGTH },
        dt: { value: 0 },
        texelSize: { value: new Vec2() },
      },
    });
    const pressureProg = new Program(gl, {
      vertex: VERT,
      fragment: PRESSURE,
      depthTest: false,
      uniforms: {
        uPressure: { value: null },
        uDivergence: { value: null },
        texelSize: { value: new Vec2() },
      },
    });
    const gradientProg = new Program(gl, {
      vertex: VERT,
      fragment: GRADIENT,
      depthTest: false,
      uniforms: {
        uPressure: { value: null },
        uVelocity: { value: null },
        texelSize: { value: new Vec2() },
      },
    });
    const splatProg = new Program(gl, {
      vertex: VERT,
      fragment: SPLAT,
      depthTest: false,
      uniforms: {
        uTarget: { value: null },
        aspectRatio: { value: 1 },
        color: { value: [0, 0, 0] },
        point: { value: new Vec2() },
        radius: { value: 0.0001 },
      },
    });
    const clearProg = new Program(gl, {
      vertex: VERT,
      fragment: CLEAR,
      depthTest: false,
      uniforms: { uTexture: { value: null }, value: { value: PRESSURE_VALUE } },
    });
    const displayProg = new Program(gl, {
      vertex: VERT,
      fragment: DISPLAY,
      depthTest: false,
      uniforms: { uTexture: { value: null } },
    });

    const mesh = new Mesh(gl, { geometry, program: advect });
    // Render a program into a target (or screen if target is null).
    function pass(program: Program, target: RenderTarget | null) {
      mesh.program = program;
      renderer.render({ scene: mesh, target: target ?? undefined, clear: false });
    }

    let lastW = 0;
    let lastH = 0;
    function resize() {
      const w = el!.clientWidth;
      const h = el!.clientHeight;
      // Skip no-op resizes (e.g. mobile URL-bar show/hide fires the observer
      // without a real width change) so the sim state isn't wiped mid-flow.
      if (w === lastW && h === lastH) return;
      lastW = w;
      lastH = h;
      renderer.setSize(w, h);
      initFramebuffers();
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    // Pointer → queued splats.
    type Splat = { x: number; y: number; dx: number; dy: number; touch: boolean };
    const queue: Splat[] = [];
    let lastX = -1;
    let lastY = -1;
    let hasLast = false;

    function onMove(e: PointerEvent) {
      // Map the pointer into the canvas's own box via its live screen rect, so
      // coordinates stay correct no matter how far the page is scrolled.
      const rect = el!.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1 - (e.clientY - rect.top) / rect.height; // uv, y-up
      const inside = x >= 0 && x <= 1 && y >= 0 && y <= 1;
      if (!inside) {
        // Leaving the region: drop the trail so re-entry doesn't draw a streak
        // across the whole field from the last inside point.
        hasLast = false;
        return;
      }
      if (!hasLast) {
        lastX = x;
        lastY = y;
        hasLast = true;
        return;
      }
      const dx = (x - lastX) * SPLAT_FORCE;
      const dy = (y - lastY) * SPLAT_FORCE;
      lastX = x;
      lastY = y;
      queue.push({ x, y, dx, dy, touch: e.pointerType === "touch" });
    }
    window.addEventListener("pointermove", onMove, { passive: true });

    function applySplat(s: Splat) {
      const aspect = gl.drawingBufferWidth / gl.drawingBufferHeight;
      let radius = SPLAT_RADIUS * 0.01;
      if (aspect > 1) radius *= aspect;
      // velocity splat
      splatProg.uniforms.uTarget.value = velocity.read.rt.texture;
      splatProg.uniforms.aspectRatio.value = aspect;
      splatProg.uniforms.point.value.set(s.x, s.y);
      (splatProg.uniforms.color.value as number[])[0] = s.dx;
      (splatProg.uniforms.color.value as number[])[1] = s.dy;
      (splatProg.uniforms.color.value as number[])[2] = 0;
      splatProg.uniforms.radius.value = radius;
      pass(splatProg, velocity.write.rt);
      velocity.swap();

      // Skip dye on touch scroll: a touch pointermove usually means the page
      // is scrolling, and smearing dye across the hero reads as a glitch.
      // Velocity still advects so the sim stays alive (never fully disabled).
      if (s.touch) return;

      // dye splat — electric blue, strength scaled by pointer speed
      const speed = Math.hypot(s.dx, s.dy) / SPLAT_FORCE;
      const strength = Math.min(0.55, 0.12 + speed * 3.2);
      splatProg.uniforms.uTarget.value = dye.read.rt.texture;
      (splatProg.uniforms.color.value as number[])[0] = ACCENT[0] * strength;
      (splatProg.uniforms.color.value as number[])[1] = ACCENT[1] * strength;
      (splatProg.uniforms.color.value as number[])[2] = ACCENT[2] * strength;
      pass(splatProg, dye.write.rt);
      dye.swap();
    }

    function step(dt: number) {
      const vTexel = velocity.texelSize;

      // curl
      curlProg.uniforms.uVelocity.value = velocity.read.rt.texture;
      curlProg.uniforms.texelSize.value.copy(vTexel);
      pass(curlProg, curl.rt);

      // vorticity confinement
      vorticityProg.uniforms.uVelocity.value = velocity.read.rt.texture;
      vorticityProg.uniforms.uCurl.value = curl.rt.texture;
      vorticityProg.uniforms.dt.value = dt;
      vorticityProg.uniforms.texelSize.value.copy(vTexel);
      pass(vorticityProg, velocity.write.rt);
      velocity.swap();

      // divergence
      divergenceProg.uniforms.uVelocity.value = velocity.read.rt.texture;
      divergenceProg.uniforms.texelSize.value.copy(vTexel);
      pass(divergenceProg, divergence.rt);

      // seed pressure with a decayed copy of the previous solve
      clearProg.uniforms.uTexture.value = pressure.read.rt.texture;
      pass(clearProg, pressure.write.rt);
      pressure.swap();

      // pressure Jacobi iterations
      pressureProg.uniforms.uDivergence.value = divergence.rt.texture;
      pressureProg.uniforms.texelSize.value.copy(vTexel);
      for (let i = 0; i < pressureIters; i++) {
        pressureProg.uniforms.uPressure.value = pressure.read.rt.texture;
        pass(pressureProg, pressure.write.rt);
        pressure.swap();
      }

      // subtract pressure gradient
      gradientProg.uniforms.uPressure.value = pressure.read.rt.texture;
      gradientProg.uniforms.uVelocity.value = velocity.read.rt.texture;
      gradientProg.uniforms.texelSize.value.copy(vTexel);
      pass(gradientProg, velocity.write.rt);
      velocity.swap();

      // advect velocity
      advect.uniforms.texelSize.value.copy(vTexel);
      advect.uniforms.dt.value = dt;
      advect.uniforms.uVelocity.value = velocity.read.rt.texture;
      advect.uniforms.uSource.value = velocity.read.rt.texture;
      advect.uniforms.dissipation.value = VELOCITY_DISSIPATION;
      pass(advect, velocity.write.rt);
      velocity.swap();

      // advect dye
      advect.uniforms.uVelocity.value = velocity.read.rt.texture;
      advect.uniforms.uSource.value = dye.read.rt.texture;
      advect.uniforms.dissipation.value = DENSITY_DISSIPATION;
      pass(advect, dye.write.rt);
      dye.swap();
    }

    let raf = 0;
    let running = true;
    let last = performance.now();

    function loop(now: number) {
      if (!running) return;
      // A context evicted by the browser (per-tab WebGL cap) makes ogl read
      // undefined internals and throw. Stop the loop instead.
      if (gl.isContextLost?.()) {
        running = false;
        return;
      }
      let dt = (now - last) / 1000;
      dt = Math.min(dt, 0.0166); // clamp for stability on slow frames
      last = now;

      // drain a bounded number of splats per frame
      let n = Math.min(queue.length, 8);
      while (n-- > 0) applySplat(queue.shift()!);

      step(dt);

      displayProg.uniforms.uTexture.value = dye.read.rt.texture;
      pass(displayProg, null);

      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    function onVisibility() {
      running = document.visibilityState === "visible";
      if (running) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVisibility);
      gl.canvas.remove();
      const ext = gl.getExtension("WEBGL_lose_context");
      ext?.loseContext();
    };
  }, []);

  return (
    <div
      ref={ref}
      className="pointer-events-none absolute inset-0 opacity-40 [mix-blend-mode:screen] sm:opacity-[0.62]"
      aria-hidden
    />
  );
}
