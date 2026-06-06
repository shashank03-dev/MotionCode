const EMPTY_STEPS = [
  "Drop a video or GIF on the left panel",
  "Choose frame count",
  "Click Analyze",
  "Copy production code in CSS, GSAP, Framer Motion, or React Spring",
];

export function EmptyState() {
  return (
    <div
      style={{
        display: "flex",
        flex: 1,
        flexDirection: "column",
        justifyContent: "center",
        padding: "0 60px",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {EMPTY_STEPS.map((text, index) => (
          <div
            key={text}
            style={{ alignItems: "flex-start", display: "flex", gap: 20 }}
          >
            <span
              style={{
                color: "#00ff88",
                fontFamily: "Space Mono, monospace",
                fontSize: 12,
              }}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <span
              style={{
                color: "#3a3a4a",
                fontFamily: "Space Mono, monospace",
                fontSize: 12,
                lineHeight: 2.2,
              }}
            >
              {text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
