"use client";

import { useEffect } from "react";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

/**
 * Root-level error boundary. Next.js renders this in place of the root layout
 * on uncaught errors, so it must define its own <html> and <body> and avoid
 * depending on the app's CSS or components - inline styles only.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("[global] root error", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          alignItems: "center",
          background: "#000",
          color: "#f5f5f4",
          display: "flex",
          fontFamily: "system-ui, -apple-system, sans-serif",
          justifyContent: "center",
          margin: 0,
          minHeight: "100dvh",
          padding: "1rem",
        }}
      >
        <main style={{ maxWidth: "32rem", textAlign: "center" }}>
          <p
            style={{
              fontFamily: "monospace",
              fontSize: "11px",
              letterSpacing: "0.22em",
              opacity: 0.6,
              textTransform: "uppercase",
            }}
          >
            Error
          </p>
          <h1 style={{ fontSize: "1.75rem", margin: "0.75rem 0 0" }}>
            MotionCode could not load this page.
          </h1>
          <p style={{ lineHeight: 1.6, opacity: 0.7 }}>
            Try loading the route again. If it keeps failing, use the support
            page checklist and include the route where this happened.
          </p>
          {error.digest ? (
            <p
              style={{
                fontFamily: "monospace",
                fontSize: "11px",
                opacity: 0.6,
              }}
            >
              Reference: {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            style={{
              background: "#0099ff",
              border: 0,
              borderRadius: "9999px",
              color: "#000",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: 500,
              height: "2.75rem",
              marginTop: "1.5rem",
              padding: "0 1.25rem",
            }}
          >
            Try again
          </button>
          <div
            style={{
              alignItems: "center",
              display: "flex",
              gap: "1.5rem",
              justifyContent: "center",
              marginTop: "1rem",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- global-error must stay router-independent */}
            <a href="/" style={{ color: "#0099ff", fontSize: "0.875rem" }}>
              Go to homepage
            </a>
            <a
              href="/support"
              style={{ color: "#0099ff", fontSize: "0.875rem" }}
            >
              Support
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
