"use client";

import * as React from "react";

/**
 * The landing intro: scattered particles converge into the MotionCode mark,
 * hold, then disperse as the hero reveals underneath.
 *
 * ## Why canvas 2D and not ogl
 *
 * The rest of the site draws its particle work with `ogl`, but this one
 * deliberately does not. The preloader is the thing gating first paint — if it
 * imported the WebGL renderer, the loading screen would itself be waiting on a
 * ~30KB library to download and compile, which is exactly the cost
 * SiteBackground was just changed to avoid. Canvas 2D ships with the browser
 * and starts on the first frame.
 *
 * ## Session gate
 *
 * Whether this plays at all is decided *before* React runs, by the inline
 * script in app/layout.tsx, which stamps `data-intro="play" | "seen"` on
 * <html>. CSS hides the overlay instantly for `seen`, so a returning visitor
 * never sees a flash. This component always renders the same markup so server
 * and client hydration agree; only the animation is conditional.
 */

/**
 * Floor, measured from mount, so the intro reads as intentional rather than as
 * a glitch.
 */
const MIN_VISIBLE_MS = 1000;
/**
 * Ceiling, measured from NAVIGATION START rather than from mount.
 *
 * This distinction is the whole point. Anchoring the cap to mount meant
 * hydration time stacked on top of it: a production build measured 4.5-5.3s
 * before the overlay cleared, against a 2.5s budget, because the clock only
 * started once React ran. Measuring from navigation start makes the budget
 * mean what it says to the person waiting.
 *
 * Dispersal (400ms) and the CSS fade (380ms) run after this fires, so the
 * overlay is fully gone by roughly 2.6s worst case.
 */
const MAX_SINCE_NAV_MS = 1800;
/** Convergence phase — scattered → settled into the mark. */
const CONVERGE_MS = 900;
/** Dispersal phase — settled → flung outward while the overlay fades. */
const DISPERSE_MS = 400;
/** Upper bound on particles; the sample step adapts to hit roughly this. */
const MAX_PARTICLES = 2600;

type Particle = {
  x: number;
  y: number;
  tx: number;
  ty: number;
  sx: number;
  sy: number;
  vx: number;
  vy: number;
  delay: number;
  size: number;
};

/** easeOutExpo — fast arrival, long settle. Matches the site's motion feel. */
function easeOutExpo(t: number) {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function easeInCubic(t: number) {
  return t * t * t;
}

/**
 * Draws the MotionCode mark (easing-curve glyph + wordmark) into an offscreen
 * canvas and samples its opaque pixels into particle targets.
 */
function sampleMark(width: number, height: number): Particle[] {
  const off = document.createElement("canvas");
  off.width = width;
  off.height = height;
  const ctx = off.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];

  const scale = Math.min(width / 900, height / 420, 1.4);
  const cx = width / 2;
  const cy = height / 2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  // --- the glyph: rounded square + the easing curve, matching site/logo.tsx
  const box = 132;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.roundRect(-box / 2, -box / 2 - 26, box, box, 34);
  ctx.stroke();

  // The signature curve: 4,16 → 12,6 → 18,6 in logo space, scaled to the box.
  const u = box / 22;
  const ox = -box / 2;
  const oy = -box / 2 - 26;
  ctx.beginPath();
  ctx.lineWidth = 8;
  ctx.moveTo(ox + 4 * u, oy + 16 * u);
  ctx.bezierCurveTo(
    ox + 8 * u,
    oy + 16 * u,
    ox + 8 * u,
    oy + 6 * u,
    ox + 12 * u,
    oy + 6 * u,
  );
  ctx.bezierCurveTo(
    ox + 14 * u,
    oy + 6 * u,
    ox + 16 * u,
    oy + 10 * u,
    ox + 18 * u,
    oy + 6 * u,
  );
  ctx.stroke();

  // Endpoint dots — the sampled-frame metaphor.
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(ox + 4 * u, oy + 16 * u, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(ox + 18 * u, oy + 6 * u, 9, 0, Math.PI * 2);
  ctx.fill();

  // --- the wordmark, below the glyph
  ctx.font =
    '500 68px var(--font-ppnm), "PP Neue Montreal", system-ui, sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("MotionCode", 0, box / 2 + 42);
  ctx.restore();

  // --- sample opaque pixels into targets
  const { data } = ctx.getImageData(0, 0, width, height);
  const points: { x: number; y: number }[] = [];
  // Adaptive step: coarse enough on big viewports to stay under the cap.
  let step = 3;
  for (; step <= 8; step++) {
    points.length = 0;
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        if (data[(y * width + x) * 4 + 3] > 128) points.push({ x, y });
      }
    }
    if (points.length <= MAX_PARTICLES) break;
  }

  const diag = Math.hypot(width, height);
  return points.map(({ x, y }) => {
    // Start position: scattered on a ring well outside the mark, so the motion
    // reads as "converging inward" rather than "fading in place".
    const angle = Math.random() * Math.PI * 2;
    const radius = diag * (0.35 + Math.random() * 0.5);
    const sx = cx + Math.cos(angle) * radius;
    const sy = cy + Math.sin(angle) * radius;
    return {
      x: sx,
      y: sy,
      sx,
      sy,
      tx: x,
      ty: y,
      vx: 0,
      vy: 0,
      // Stagger arrival so the mark assembles rather than snapping.
      delay: Math.random() * 0.35,
      size: Math.random() < 0.12 ? 2 : 1.25,
    };
  });
}

export function Preloader() {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [ticker, setTicker] = React.useState(0);

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // The pre-paint script in layout.tsx already decided this. If it says the
    // intro was seen this session, there is nothing to run.
    if (document.documentElement.dataset.intro !== "play") return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let raf = 0;
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      root.dataset.state = "leaving";
      // Match the CSS fade before unmounting the overlay from the a11y tree.
      window.setTimeout(() => {
        document.documentElement.dataset.intro = "seen";
      }, 380);
    };

    // Reduced motion: no particles, no convergence — the mark is simply
    // present, then the overlay fades. Brand moment without the movement.
    if (reducedMotion) {
      root.dataset.reduced = "true";
      const t = window.setTimeout(finish, 420);
      return () => window.clearTimeout(t);
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      finish();
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      finish();
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = window.innerWidth;
    let height = window.innerHeight;
    let particles: Particle[] = [];

    const build = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = sampleMark(width, height);
    };

    // `ready` is the early-exit signal: fonts resolved (so the sampled wordmark
    // is the real face, not a fallback) and the hero has mounted underneath.
    let ready = false;
    const markReady = () => {
      ready = true;
    };
    if (document.fonts?.ready) {
      document.fonts.ready.then(markReady).catch(markReady);
    } else {
      markReady();
    }

    // Sample after fonts settle so the wordmark particles trace PP Neue
    // Montreal rather than the fallback metrics.
    const start = performance.now();
    if (document.fonts?.ready) {
      document.fonts.ready.then(build).catch(build);
    }
    build();

    let disperseAt = 0;

    const frame = (now: number) => {
      // `now` (the rAF timestamp) shares its time origin with performance.now(),
      // so it is already milliseconds since navigation start — which is what the
      // hard cap is measured against. `elapsed` stays relative to mount, since
      // the convergence animation should run its own length either way.
      const elapsed = now - start;
      ctx.clearRect(0, 0, width, height);

      const shouldLeave =
        now >= MAX_SINCE_NAV_MS || (ready && elapsed >= MIN_VISIBLE_MS);
      if (shouldLeave && !disperseAt) {
        disperseAt = now;
        for (const p of particles) {
          const dx = p.x - width / 2;
          const dy = p.y - height / 2;
          const d = Math.hypot(dx, dy) || 1;
          const speed = 2.2 + Math.random() * 3.4;
          p.vx = (dx / d) * speed;
          p.vy = (dy / d) * speed;
        }
      }

      if (disperseAt) {
        const dt = (now - disperseAt) / DISPERSE_MS;
        const fade = 1 - Math.min(dt, 1);
        ctx.fillStyle = `rgba(255,255,255,${0.9 * fade})`;
        for (const p of particles) {
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 1.012;
          p.vy *= 1.012;
          ctx.fillRect(p.x, p.y, p.size, p.size);
        }
        if (dt >= 1) {
          finish();
          return;
        }
      } else {
        // Convergence: each particle eases from its scatter point to its
        // target, on its own slightly staggered clock.
        const base = Math.min(elapsed / CONVERGE_MS, 1);
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        let settled = 0;
        for (const p of particles) {
          const local = Math.max(0, Math.min((base - p.delay) / (1 - p.delay), 1));
          const e = easeOutExpo(local);
          p.x = p.sx + (p.tx - p.sx) * e;
          p.y = p.sy + (p.ty - p.sy) * e;
          if (local >= 1) settled++;
          ctx.fillRect(p.x, p.y, p.size, p.size);
        }
        // A single accent pass over the settled mark once it has formed —
        // the one place colour appears, echoing the logo's accent endpoint.
        if (settled > particles.length * 0.6) {
          const sweep = easeInCubic(Math.min(base, 1));
          const bandX = width * (0.2 + sweep * 0.6);
          ctx.fillStyle = "rgba(0,153,255,0.85)";
          for (const p of particles) {
            if (Math.abs(p.x - bandX) < 26) ctx.fillRect(p.x, p.y, p.size, p.size);
          }
        }
      }

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    // Frame-sampling ticker under the mark — the product metaphor, not a %.
    const tick = window.setInterval(() => {
      setTicker((n) => (n >= 24 ? 24 : n + 1));
    }, 70);

    const onResize = () => {
      if (!disperseAt) build();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(tick);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="mc-preloader"
      role="status"
      aria-live="polite"
      aria-label="Loading MotionCode"
    >
      <canvas ref={canvasRef} className="mc-preloader__canvas" aria-hidden />
      {/* Static mark for the reduced-motion path, where no particles run. */}
      <div className="mc-preloader__fallback" aria-hidden>
        <span className="mc-preloader__wordmark">MotionCode</span>
      </div>
      <span className="mc-preloader__ticker" aria-hidden>
        {String(ticker).padStart(2, "0")} / 24
      </span>
    </div>
  );
}
