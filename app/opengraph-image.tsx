import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "MotionCode product preview";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#10120d",
          color: "#fffbf4",
          padding: "64px",
          fontFamily: "monospace",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 540,
            height: 540,
            borderRadius: 540,
            background: "rgba(158,240,192,.18)",
            right: -120,
            top: -160,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 460,
            height: 460,
            borderRadius: 460,
            background: "rgba(245,143,124,.16)",
            left: -120,
            bottom: -180,
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 54,
              height: 54,
              border: "2px solid rgba(158,240,192,.8)",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#9ef0c0",
              fontSize: 28,
            }}
          >
            {"{}"}
          </div>
          <div
            style={{
              fontSize: 28,
              letterSpacing: 5,
              color: "#9ef0c0",
              textTransform: "uppercase",
            }}
          >
            MotionCode
          </div>
        </div>

        <div style={{ maxWidth: 900, zIndex: 1 }}>
          <div
            style={{
              display: "inline-flex",
              color: "#ffd166",
              fontSize: 24,
              letterSpacing: 4,
              textTransform: "uppercase",
              marginBottom: 28,
            }}
          >
            Motion reference to starter code
          </div>
          <div style={{ fontSize: 76, lineHeight: 0.98, fontWeight: 700 }}>
            Reviewable motion specs and starter snippets.
          </div>
        </div>

        <div
          style={{
            zIndex: 1,
            display: "flex",
            gap: 20,
            color: "#d8cfbc",
            fontSize: 24,
          }}
        >
          <span>CSS</span>
          <span>GSAP</span>
          <span>Framer Motion</span>
        </div>
      </div>
    ),
    size,
  );
}
