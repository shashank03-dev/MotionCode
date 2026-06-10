import type { AnalysisStage } from "./types";
import styles from "./AppStatusBar.module.css";

type AppStatusBarProps = {
  error: string | null;
  framesLength: number;
  resultIntent: string | null;
  stage: AnalysisStage;
  statusMessage: string;
};

export function AppStatusBar({
  error,
  framesLength,
  resultIntent,
  stage,
  statusMessage,
}: AppStatusBarProps) {
  const isLiveUpdate = stage !== "idle";
  const liveMode = stage === "error" ? "assertive" : isLiveUpdate ? "polite" : "off";
  const liveRole = stage === "error" ? "alert" : isLiveUpdate ? "status" : undefined;

  return (
    <footer className={styles.statusBar}>
      <div
        aria-atomic="true"
        aria-live={liveMode}
        className={styles.statusContent}
        role={liveRole}
      >
        {stage === "idle" && (
          <span className={styles.statusMessage}>
            Cmd+Enter analyze / 1-4 switch tabs / Cmd+K upload
          </span>
        )}
        {stage === "extracting" && (
          <>
            <StatusDot />
            <span className={styles.statusMessage}>Extracting frames...</span>
          </>
        )}
        {stage === "analyzing" && (
          <>
            <StatusDot />
            <span className={styles.statusMessage}>
              {statusMessage || "Analyzing motion patterns..."}
            </span>
          </>
        )}
        {stage === "done" && (
          <span className={`${styles.statusMessage} ${styles.success}`}>
            Analysis complete / {framesLength} frames / {resultIntent ?? "motion"} detected
          </span>
        )}
        {stage === "error" && (
          <span className={`${styles.statusMessage} ${styles.error}`}>
            {error ?? "Analysis failed. Try again."}
          </span>
        )}
      </div>
    </footer>
  );
}

function StatusDot() {
  return <span aria-hidden="true" className={styles.statusDot} />;
}
