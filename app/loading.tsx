export default function Loading() {
  return (
    <main
      style={{
        alignItems: "center",
        background: "var(--bg)",
        color: "var(--text)",
        display: "flex",
        minHeight: "100vh",
        padding: "64px 10vw",
      }}
    >
      <section style={{ width: "min(520px, 100%)" }}>
        <div
          style={{
            color: "var(--muted)",
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            letterSpacing: "2px",
            marginBottom: "20px",
            textTransform: "uppercase",
          }}
        >
          MotionCode
        </div>
        <h1
          style={{
            color: "var(--text)",
            fontFamily: "var(--font-mono)",
            fontSize: "clamp(36px, 6vw, 72px)",
            lineHeight: 1,
            margin: "0 0 28px",
          }}
        >
          Loading motion.
        </h1>
        <div
          aria-label="Loading"
          role="status"
          style={{
            background: "var(--border)",
            height: "2px",
            overflow: "hidden",
            width: "100%",
          }}
        >
          <div
            className="animate-pulse"
            style={{
              background: "var(--accent)",
              height: "100%",
              width: "40%",
            }}
          />
        </div>
      </section>
    </main>
  );
}
