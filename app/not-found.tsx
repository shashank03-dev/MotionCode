import Link from "next/link";

export default function NotFound() {
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
      <section style={{ maxWidth: "640px" }}>
        <div
          style={{
            color: "var(--muted)",
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            letterSpacing: "2px",
            textTransform: "uppercase",
          }}
        >
          MotionCode / 404
        </div>
        <h1
          style={{
            color: "var(--text)",
            fontFamily: "var(--font-mono)",
            fontSize: "clamp(44px, 7vw, 96px)",
            lineHeight: 1,
            margin: "20px 0",
          }}
        >
          Page not found.
        </h1>
        <p
          style={{
            color: "var(--muted)",
            fontFamily: "var(--font-body)",
            fontSize: "15px",
            lineHeight: 1.7,
            marginBottom: "32px",
          }}
        >
          The route you requested does not exist in MotionCode.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
          <Link
            href="/"
            style={{
              background: "var(--accent)",
              color: "var(--bg)",
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
              fontWeight: 700,
              padding: "14px 28px",
              textDecoration: "none",
            }}
          >
            Back home
          </Link>
          <Link
            href="/app"
            style={{
              border: "1px solid var(--accent)",
              color: "var(--accent)",
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
              padding: "14px 28px",
              textDecoration: "none",
            }}
          >
            Open converter
          </Link>
        </div>
      </section>
    </main>
  );
}
