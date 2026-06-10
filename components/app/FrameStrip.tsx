/* eslint-disable @next/next/no-img-element -- Frame thumbnails are local blob/data URLs that next/image cannot optimize. */

import styles from "./FrameStrip.module.css";

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

  const frameLabel = `${frameCount} ${frameCount === 1 ? "frame" : "frames"}`;

  if (variant === "scanner") {
    return (
      <div
        className={styles.scannerStrip}
        data-testid="frame-strip"
        aria-label={`Scanning ${frameLabel}`}
      >
        <span className={styles.srOnly}>{frameLabel}</span>
        {thumbs.map((thumb, index) => (
          <div
            className={`${styles.scannerFrame} ${
              index === scannerIndex ? styles.scannerFrameActive : ""
            }`}
            key={`${thumb}-${index}`}
          >
            <img alt={`Frame ${index + 1}`} src={thumb} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <section className={styles.strip} data-testid="frame-strip">
      <div className={styles.header}>
        <span>Extracted frames</span>
        <span>{frameLabel}</span>
      </div>
      <div className={styles.thumbRail}>
        {thumbs.map((thumb, index) => (
          <img alt={`Frame ${index + 1}`} key={`${thumb}-${index}`} src={thumb} />
        ))}
      </div>
    </section>
  );
}
