"use client";

import Link from "next/link";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
      <section style={{ maxWidth: "680px" }}>
        <div
          style={{
            color: "var(--muted)",
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            letterSpacing: "2px",
            textTransform: "uppercase",
          }}
        >
          MotionCode / Runtime error
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
          Motion pipeline interrupted.
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
          Something failed while rendering this route. Retry the request or
          return to a stable MotionCode page.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
          <button
            onClick={reset}
            style={{
              background: "var(--accent)",
              border: "1px solid var(--accent)",
              color: "var(--bg)",
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
              fontWeight: 700,
              padding: "14px 28px",
            }}
            type="button"
          >
            Retry
          </button>
          <Link
            href="/"
            style={{
              border: "1px solid var(--accent)",
              color: "var(--accent)",
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
              padding: "14px 28px",
              textDecoration: "none",
            }}
          >
            Back home
          </Link>
        </div>
      </section>
    </main>
  );
}
