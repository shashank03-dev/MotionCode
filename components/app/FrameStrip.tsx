/* eslint-disable @next/next/no-img-element -- Frame thumbnails are local blob/data URLs that next/image cannot optimize. */

type FrameStripProps = {
  frameCount: number;
  scannerIndex?: number;
  thumbs: string[];
  variant?: "default" | "scanner";
};

export function FrameStrip({
  frameCount,
  scannerIndex,
  thumbs,
  variant = "default",
}: FrameStripProps) {
  if (thumbs.length === 0) {
    return null;
  }

  if (variant === "scanner") {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {thumbs.map((thumb, index) => (
          <div
            key={`${thumb}-${index}`}
            style={{
              alignItems: "center",
              backgroundColor: "#000",
              border:
                index === scannerIndex
                  ? "1px solid #00ff88"
                  : "1px solid #1a1a1a",
              boxShadow:
                index === scannerIndex ? "0 0 8px #00ff8840" : "none",
              display: "flex",
              height: 44,
              justifyContent: "center",
              overflow: "hidden",
              transition: "all 0.1s ease",
              width: 64,
            }}
          >
            <img
              alt={`Frame ${index}`}
              src={thumb}
              style={{ height: "100%", objectFit: "cover", width: "100%" }}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ borderTop: "1px solid #1a1a1a", marginTop: 20, padding: "16px 20px" }}>
      <div
        style={{
          color: "#3a3a4a",
          fontFamily: "Space Mono, monospace",
          fontSize: 9,
          letterSpacing: 2,
          marginBottom: 10,
        }}
      >
        EXTRACTED FRAMES ({frameCount})
      </div>
      <div id="frame-strip-container" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {thumbs.map((thumb, index) => (
          <img
            alt={`Frame ${index}`}
            key={`${thumb}-${index}`}
            src={thumb}
            style={{
              border: "1px solid #1a1a1a",
              flexShrink: 0,
              height: 38,
              objectFit: "cover",
              width: 54,
            }}
          />
        ))}
      </div>
    </div>
  );
}
