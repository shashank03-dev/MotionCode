import { FrameStrip } from "./FrameStrip";

type AnalysisStatusProps = {
  activeStep: number;
  frameThumbs: string[];
  scannerIndex: number;
  steps: string[];
};

export function AnalysisStatus({
  activeStep,
  frameThumbs,
  scannerIndex,
  steps,
}: AnalysisStatusProps) {
  return (
    <div
      style={{
        display: "flex",
        flex: 1,
        flexDirection: "column",
        overflowY: "auto",
        padding: "48px 60px",
      }}
    >
      <div style={{ display: "flex", flex: 1, flexDirection: "column", gap: 6 }}>
        {steps.map((step, index) => {
          if (index > activeStep) {
            return null;
          }

          const isActive = index === activeStep;
          return (
            <div
              key={step}
              style={{
                alignItems: "center",
                animation: "fadeSlideIn 0.3s ease forwards",
                display: "flex",
                gap: 12,
                opacity: 0,
              }}
            >
              {isActive ? (
                <div
                  style={{
                    animation: "blink 0.8s infinite",
                    backgroundColor: "#00ff88",
                    borderRadius: "50%",
                    flexShrink: 0,
                    height: 6,
                    width: 6,
                  }}
                />
              ) : (
                <div
                  style={{
                    color: "#3a3a4a",
                    flexShrink: 0,
                    fontFamily: "Space Mono, monospace",
                    fontSize: 10,
                    textAlign: "center",
                    width: 6,
                  }}
                >
                  ok
                </div>
              )}
              <div
                style={{
                  color: isActive ? "#e2e8f0" : "#3a3a4a",
                  fontFamily: "Space Mono, monospace",
                  fontSize: 12,
                }}
              >
                [{index + 1}] {step}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ flexShrink: 0, marginTop: 40 }}>
        <div
          style={{
            color: "#3a3a4a",
            fontFamily: "Space Mono, monospace",
            fontSize: 9,
            letterSpacing: 2,
            marginBottom: 8,
          }}
        >
          SCANNING FRAMES
        </div>
        <FrameStrip
          frameCount={frameThumbs.length}
          scannerIndex={scannerIndex}
          thumbs={frameThumbs}
          variant="scanner"
        />
      </div>
    </div>
  );
}
