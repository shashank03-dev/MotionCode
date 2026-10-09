import { ImageResponse } from "next/og";

import { bezierAt } from "@/lib/chrono/bezier";

export const runtime = "edge";
export const alt = "MotionCode — motion, decoded.";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const CARBON = "#0b0b0a";
const BONE = "#edebe4";
const SAFELIGHT = "#ff5b1f";
const EXPOSURES = 12;

/** Plate 01 as a still: the chronophotograph from the hero, frozen at rest. */
export default function Image() {
  const box = 54;
  const x0 = 560;
  const x1 = 1110;
  const y0 = 130;
  const y1 = 470;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: CARBON,
          color: BONE,
          position: "relative",
          overflow: "hidden",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 520,
            height: 520,
            borderRadius: 520,
            background: "radial-gradient(circle, rgba(255,91,31,0.22), rgba(255,91,31,0) 70%)",
            right: -180,
            top: -200,
          }}
        />
        {Array.from({ length: EXPOSURES }, (_, i) => {
          const t = i / (EXPOSURES - 1);
          const u = bezierAt([0.16, 1, 0.3, 1], t);
          const x = x0 + (x1 - x0) * u;
          const y = y1 + (y0 - y1) * u - Math.sin(u * Math.PI) * 50;
          const last = i === EXPOSURES - 1;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x - box / 2,
                top: y - box / 2,
                width: box,
                height: box,
                borderRadius: 14,
                border: last ? "none" : `1.5px solid rgba(237,235,228,${0.25 + t * 0.45})`,
                background: last ? SAFELIGHT : "transparent",
              }}
            />
          );
        })}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: 72,
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 26 }}>
            <div style={{ width: 12, height: 12, borderRadius: 12, background: SAFELIGHT }} />
            MotionCode
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 132, letterSpacing: -7, lineHeight: 0.9 }}>Motion,</div>
            <div style={{ fontSize: 132, letterSpacing: -6, lineHeight: 0.95, fontStyle: "italic" }}>
              decoded.
            </div>
            <div
              style={{
                marginTop: 28,
                fontSize: 22,
                letterSpacing: 4,
                textTransform: "uppercase",
                color: "rgba(237,235,228,0.6)",
                fontFamily: "monospace",
              }}
            >
              Video → spec → CSS · GSAP · Framer Motion
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
