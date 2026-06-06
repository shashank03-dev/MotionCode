/* eslint-disable @next/next/no-img-element */

import type { DragEvent, MouseEvent, RefObject } from "react";
import Link from "next/link";
import { canUseForFree, FREE_LIMIT, usagesLeft } from "@/lib/rateLimit";
import type { AppStage, UserPlan } from "./AppShell";

type UploadPanelProps = {
  file: File | null;
  fileUrl: string | null;
  frameCount: number;
  frames: string[];
  frameThumbs: string[];
  userPlan: UserPlan;
  loading: boolean;
  stage: AppStage;
  validationError: string | null;
  flashError: boolean;
  dragActive: boolean;
  fileInputRef: RefObject<HTMLInputElement>;
  onFile: (file: File) => void;
  onRemoveFile: (event?: MouseEvent<HTMLElement>) => void;
  onFrameCountChange: (count: number) => void;
  onAnalyze: () => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDragLeave: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
};

function formatFileSize(bytes: number) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function UploadPanel({
  file,
  fileUrl,
  frameCount,
  frames,
  frameThumbs,
  userPlan,
  loading,
  stage,
  validationError,
  flashError,
  dragActive,
  fileInputRef,
  onFile,
  onRemoveFile,
  onFrameCountChange,
  onAnalyze,
  onDragOver,
  onDragLeave,
  onDrop,
}: UploadPanelProps) {
  const freeLimitReached = userPlan === "free" && !canUseForFree();
  const analyzeDisabled =
    !file || frames.length === 0 || loading || stage === "extracting" || freeLimitReached;

  return (
    <div id="left-panel" style={{
      width: 400, flexShrink: 0, borderRight: "1px solid #1a1a1a",
      backgroundColor: "#0a0a0a", display: "flex", flexDirection: "column",
      overflowY: "auto"
    }}>
      <div style={{ padding: "14px 24px", borderBottom: "1px solid #1a1a1a" }}>
        <span style={{ fontFamily: "Space Mono, monospace", fontSize: 9, letterSpacing: 3, color: "#3a3a4a", fontWeight: "bold" }}>INPUT</span>
      </div>

      <div
        className="upload-dropzone"
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        style={{
          position: "relative",
          margin: 20, padding: "36px 20px", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", cursor: "pointer",
          border: `1.5px dashed ${flashError ? "#ef4444" : dragActive ? "#00ff88" : file ? "#00ff8840" : "#1a1a1a"}`,
          backgroundColor: flashError ? "#ef444408" : dragActive ? "#00ff8808" : "transparent",
          transition: "all 0.2s ease"
        }}
      >
        <input
          id="animation-file-upload"
          aria-label="Upload animation file"
          type="file"
          ref={fileInputRef}
          className="upload-file-input"
          accept="video/mp4,video/webm,video/quicktime,image/gif,.mp4,.webm,.mov,.gif"
          onChange={(event) => {
            if (event.target.files && event.target.files.length > 0) {
              onFile(event.target.files[0]);
            }
          }}
        />

        {!file ? (
          <label
            htmlFor="animation-file-upload"
            style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", cursor: "pointer", width: "100%"
            }}
          >
            <div style={{ fontFamily: "Space Mono, monospace", fontSize: 28, color: "#1a1a1a" }}>⬆</div>
            <div style={{ fontFamily: "Space Mono, monospace", fontSize: 13, color: "#e2e8f0", marginTop: 12 }}>Drop animation here</div>
            <div style={{ fontFamily: "Space Mono, monospace", fontSize: 11, color: "#3a3a4a", marginTop: 6 }}>MP4 · WebM · MOV · GIF</div>
          </label>
        ) : (
          <>
            <label
              htmlFor="animation-file-upload"
              style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                cursor: "pointer", width: "100%"
              }}
            >
              <div style={{ fontFamily: "Space Mono, monospace", fontSize: 12, color: "#00ff88", wordBreak: "break-all", textAlign: "center" }}>{file.name}</div>
              <div style={{ fontFamily: "Space Mono, monospace", fontSize: 11, color: "#3a3a4a", marginTop: 6 }}>{formatFileSize(file.size)}</div>
            </label>

            <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
              <button
                onClick={() => {
                  fileInputRef.current?.click();
                }}
                style={{
                  fontFamily: "Space Mono, monospace", fontSize: 9, color: "#e2e8f0",
                  backgroundColor: "#1a1a1a", border: "none", padding: "4px 10px",
                  cursor: "pointer", transition: "all 0.2s"
                }}
                onMouseOver={(event) => event.currentTarget.style.backgroundColor = "#2a2a2a"}
                onMouseOut={(event) => event.currentTarget.style.backgroundColor = "#1a1a1a"}
              >
                CHANGE
              </button>
              <button
                onClick={onRemoveFile}
                style={{
                  fontFamily: "Space Mono, monospace", fontSize: 9, color: "#ef4444",
                  backgroundColor: "#ef444415", border: "none", padding: "4px 10px",
                  cursor: "pointer", transition: "all 0.2s"
                }}
                onMouseOver={(event) => event.currentTarget.style.backgroundColor = "#ef444425"}
                onMouseOut={(event) => event.currentTarget.style.backgroundColor = "#ef444415"}
              >
                DELETE
              </button>
            </div>
          </>
        )}
      </div>

      {validationError && (
        <div style={{
          fontFamily: "Space Mono, monospace", fontSize: 11, color: "#ef4444",
          textAlign: "center", marginBottom: 16
        }}>
          {validationError}
        </div>
      )}

      {fileUrl && (
        <div style={{ margin: "0 20px", border: "1px solid #1a1a1a", backgroundColor: "#000", display: "flex", justifyContent: "center", alignItems: "center" }}>
          {file?.type?.startsWith("video/") ? (
            <video id="video-preview" src={fileUrl} controls muted loop style={{ maxHeight: 200, width: "100%", objectFit: "contain" }} />
          ) : (
            <img id="video-preview" src={fileUrl} alt="preview" style={{ maxHeight: 200, width: "100%", objectFit: "contain" }} />
          )}
        </div>
      )}

      {frameThumbs.length > 0 && (
        <div style={{ padding: "16px 20px", borderTop: "1px solid #1a1a1a", marginTop: 20 }}>
          <div style={{ fontFamily: "Space Mono, monospace", fontSize: 9, letterSpacing: 2, color: "#3a3a4a", marginBottom: 10 }}>EXTRACTED FRAMES ({frames.length})</div>
          <div id="frame-strip-container" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {frameThumbs.map((thumb, i) => (
              <img key={i} src={thumb} alt={`Frame ${i}`} style={{ width: 54, height: 38, objectFit: "cover", border: "1px solid #1a1a1a", flexShrink: 0 }} />
            ))}
          </div>
        </div>
      )}

      <div style={{ padding: "12px 20px", borderTop: "1px solid #1a1a1a", marginTop: "auto" }}>
        <div style={{ fontFamily: "Space Mono, monospace", fontSize: 9, color: "#3a3a4a", marginBottom: 10 }}>FRAME COUNT</div>
        <div style={{ display: "flex", gap: 8 }}>
          {[4, 6, 8, 12].map((num) => (
            <button
              key={num}
              onClick={() => onFrameCountChange(num)}
              style={{
                fontFamily: "Space Mono, monospace", fontSize: 12, padding: "4px 12px",
                backgroundColor: "transparent", cursor: "pointer", transition: "all 0.2s",
                border: `1px solid ${frameCount === num ? "#00ff88" : "#1a1a1a"}`,
                color: frameCount === num ? "#00ff88" : "#e2e8f0"
              }}
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div style={{ margin: "0 20px 16px", height: 2, backgroundColor: "#1a1a1a", overflow: "hidden" }}>
          <div style={{
            height: "100%", background: "linear-gradient(90deg, #00ff88, #00cc6e)",
            animation: "progress 20s cubic-bezier(0.1, 0.7, 0.1, 1) forwards"
          }} />
        </div>
      )}

      {userPlan === "free" ? (
        <div style={{
          border: "1px solid #1a1a1a", padding: "10px 14px", margin: "0 20px 20px", background: "#0a0a0a"
        }}>
          {canUseForFree() ? (
            <div style={{ fontFamily: "Space Mono, monospace", fontSize: 11, color: "#3a3a4a" }}>
              ⚡ {usagesLeft()} free analyses remaining today
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontFamily: "Space Mono, monospace", fontSize: 11, color: "#ef4444" }}>
                ✗ Daily limit reached ({FREE_LIMIT}/day)
              </div>
              <Link href="/pricing" style={{ fontFamily: "Space Mono, monospace", fontSize: 11, color: "#00ff88", textDecoration: "none" }}>
                Upgrade to Pro →
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div style={{
          border: "1px solid #00ff88", padding: "10px 14px", margin: "0 20px 20px", background: "#0a0a0a"
        }}>
          <div style={{ fontFamily: "Space Mono, monospace", fontSize: 11, color: "#00ff88" }}>
            Pro mode enabled.
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column" }}>
        {!file && (
          <div style={{ fontFamily: "Space Mono, monospace", fontSize: 10, color: "#3a3a4a", textAlign: "center", marginBottom: 8 }}>
            ↑ Upload a file to enable analysis
          </div>
        )}
        <button
          onClick={onAnalyze}
          disabled={analyzeDisabled}
          style={{
            margin: "0 20px 20px 20px", padding: 14, cursor: analyzeDisabled ? "not-allowed" : "pointer",
            border: freeLimitReached ? "1px solid #ef4444" : loading ? "1px solid #00ff88" : "none",
            backgroundColor: freeLimitReached ? "transparent" : (!file || frames.length === 0 || stage === "extracting") ? "#1a1a1a" : loading ? "transparent" : "#00ff88",
            color: freeLimitReached ? "#ef4444" : (!file || frames.length === 0 || stage === "extracting") ? "#3a3a4a" : loading ? "#00ff88" : "#080808",
            fontFamily: "Space Mono, monospace", fontSize: 13, fontWeight: "bold", transition: "all 0.2s"
          }}
        >
          {loading ? "Analyzing..." : stage === "extracting" ? "Extracting..." : "Analyze"}
        </button>
      </div>
    </div>
  );
}
