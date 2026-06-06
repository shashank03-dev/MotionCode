import Link from "next/link";
import type { DragEvent, MouseEvent, RefObject } from "react";

import type { PlanEntitlements, PlanTier } from "@/lib/contracts/plans";

/* eslint-disable @next/next/no-img-element -- Upload previews are local blob URLs that next/image cannot optimize. */

import { FrameStrip } from "./FrameStrip";
import type { AnalysisStage } from "./types";

type UploadPanelProps = {
  canUseFree: boolean;
  dragActive: boolean;
  entitlements: PlanEntitlements;
  file: File | null;
  fileInputRef: RefObject<HTMLInputElement>;
  fileUrl: string | null;
  flashError: boolean;
  frameCount: number;
  frameThumbs: string[];
  framesLength: number;
  loading: boolean;
  onAnalyze: () => void;
  onDragLeave: (event: DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onFileSelected: (file: File) => void;
  onFrameCountChange: (count: number) => void;
  onRemoveFile: (event?: MouseEvent) => void;
  stage: AnalysisStage;
  usageRemaining: number;
  userPlan: PlanTier;
  validationError: string | null;
};

export function UploadPanel({
  canUseFree,
  dragActive,
  entitlements,
  file,
  fileInputRef,
  fileUrl,
  flashError,
  frameCount,
  frameThumbs,
  framesLength,
  loading,
  onAnalyze,
  onDragLeave,
  onDragOver,
  onDrop,
  onFileSelected,
  onFrameCountChange,
  onRemoveFile,
  stage,
  usageRemaining,
  userPlan,
  validationError,
}: UploadPanelProps) {
  const analyzeDisabled =
    !file ||
    framesLength === 0 ||
    loading ||
    stage === "extracting" ||
    (userPlan === "free" && !canUseFree);

  return (
    <div
      id="left-panel"
      style={{
        backgroundColor: "#0a0a0a",
        borderRight: "1px solid #1a1a1a",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        overflowY: "auto",
        width: 400,
      }}
    >
      <div style={{ borderBottom: "1px solid #1a1a1a", padding: "14px 24px" }}>
        <span
          style={{
            color: "#3a3a4a",
            fontFamily: "Space Mono, monospace",
            fontSize: 9,
            fontWeight: "bold",
            letterSpacing: 3,
          }}
        >
          INPUT
        </span>
      </div>

      <div
        onClick={() => fileInputRef.current?.click()}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        style={{
          alignItems: "center",
          backgroundColor: flashError
            ? "#ef444408"
            : dragActive
              ? "#00ff8808"
              : "transparent",
          border: `1.5px dashed ${
            flashError
              ? "#ef4444"
              : dragActive
                ? "#00ff88"
                : file
                  ? "#00ff8840"
                  : "#1a1a1a"
          }`,
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          margin: 20,
          padding: "36px 20px",
          transition: "all 0.2s ease",
        }}
      >
        <input
          accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.gif,image/gif"
          onChange={(event) => {
            const selectedFile = event.target.files?.[0];
            if (selectedFile) {
              onFileSelected(selectedFile);
            }
          }}
          ref={fileInputRef}
          style={{ display: "none" }}
          type="file"
        />

        {!file ? (
          <>
            <div
              style={{
                color: "#1a1a1a",
                fontFamily: "Space Mono, monospace",
                fontSize: 28,
              }}
            >
              UP
            </div>
            <div
              style={{
                color: "#e2e8f0",
                fontFamily: "Space Mono, monospace",
                fontSize: 13,
                marginTop: 12,
              }}
            >
              Drop animation here
            </div>
            <div
              style={{
                color: "#3a3a4a",
                fontFamily: "Space Mono, monospace",
                fontSize: 11,
                marginTop: 6,
              }}
            >
              MP4 / WebM / MOV / GIF
            </div>
          </>
        ) : (
          <>
            <div
              style={{
                color: "#00ff88",
                fontFamily: "Space Mono, monospace",
                fontSize: 12,
                textAlign: "center",
                wordBreak: "break-all",
              }}
            >
              {file.name}
            </div>
            <div
              style={{
                color: "#3a3a4a",
                fontFamily: "Space Mono, monospace",
                fontSize: 11,
                marginTop: 6,
              }}
            >
              {formatFileSize(file.size)}
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
              <SmallButton
                label="CHANGE"
                onClick={(event) => {
                  event.stopPropagation();
                  fileInputRef.current?.click();
                }}
              />
              <SmallButton
                danger
                label="DELETE"
                onClick={(event) => onRemoveFile(event)}
              />
            </div>
          </>
        )}
      </div>

      {validationError && (
        <div
          style={{
            color: "#ef4444",
            fontFamily: "Space Mono, monospace",
            fontSize: 11,
            marginBottom: 16,
            textAlign: "center",
          }}
        >
          {validationError}
        </div>
      )}

      {fileUrl && (
        <div
          style={{
            alignItems: "center",
            backgroundColor: "#000",
            border: "1px solid #1a1a1a",
            display: "flex",
            justifyContent: "center",
            margin: "0 20px",
          }}
        >
          {file?.type?.startsWith("video/") ? (
            <video
              controls
              id="video-preview"
              loop
              muted
              src={fileUrl}
              style={{ maxHeight: 200, objectFit: "contain", width: "100%" }}
            />
          ) : (
            <img
              alt="preview"
              id="video-preview"
              src={fileUrl}
              style={{ maxHeight: 200, objectFit: "contain", width: "100%" }}
            />
          )}
        </div>
      )}

      <FrameStrip frameCount={framesLength} thumbs={frameThumbs} />

      <div
        style={{
          borderTop: "1px solid #1a1a1a",
          marginTop: "auto",
          padding: "12px 20px",
        }}
      >
        <div
          style={{
            color: "#3a3a4a",
            fontFamily: "Space Mono, monospace",
            fontSize: 9,
            marginBottom: 10,
          }}
        >
          FRAME COUNT
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {getFrameCountOptions(entitlements.maxFramesPerAnalysis).map((count) => (
            <button
              key={count}
              onClick={() => onFrameCountChange(count)}
              style={{
                backgroundColor: "transparent",
                border: `1px solid ${frameCount === count ? "#00ff88" : "#1a1a1a"}`,
                color: frameCount === count ? "#00ff88" : "#e2e8f0",
                cursor: "pointer",
                fontFamily: "Space Mono, monospace",
                fontSize: 12,
                padding: "4px 12px",
                transition: "all 0.2s",
              }}
            >
              {count}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div
          style={{
            backgroundColor: "#1a1a1a",
            height: 2,
            margin: "0 20px 16px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              animation: "progress 20s cubic-bezier(0.1, 0.7, 0.1, 1) forwards",
              background: "linear-gradient(90deg, #00ff88, #00cc6e)",
              height: "100%",
            }}
          />
        </div>
      )}

      {userPlan === "free" ? (
        <div
          style={{
            background: "#0a0a0a",
            border: "1px solid #1a1a1a",
            margin: "0 20px 20px",
            padding: "10px 14px",
          }}
        >
          {canUseFree ? (
            <div
              style={{
                color: "#3a3a4a",
                fontFamily: "Space Mono, monospace",
                fontSize: 11,
              }}
            >
              {usageRemaining} free analyses remaining today
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div
                style={{
                  color: "#ef4444",
                  fontFamily: "Space Mono, monospace",
                  fontSize: 11,
                }}
              >
                Daily limit reached ({entitlements.dailyAnalyses}/day)
              </div>
              <Link
                href="/pricing"
                style={{
                  color: "#00ff88",
                  fontFamily: "Space Mono, monospace",
                  fontSize: 11,
                  textDecoration: "none",
                }}
              >
                Upgrade to Pro
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
            background: "#0a0a0a",
            border: "1px solid #00ff88",
            margin: "0 20px 20px",
            padding: "10px 14px",
          }}
        >
          <div
            style={{
              color: "#00ff88",
              fontFamily: "Space Mono, monospace",
              fontSize: 11,
            }}
          >
            Pro analysis enabled.
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column" }}>
        {!file && (
          <div
            style={{
              color: "#3a3a4a",
              fontFamily: "Space Mono, monospace",
              fontSize: 10,
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            Upload a file to enable analysis
          </div>
        )}
        <button
          disabled={analyzeDisabled}
          onClick={onAnalyze}
          style={{
            backgroundColor:
              userPlan === "free" && !canUseFree
                ? "transparent"
                : !file || framesLength === 0 || stage === "extracting"
                  ? "#1a1a1a"
                  : loading
                    ? "transparent"
                    : "#00ff88",
            border:
              userPlan === "free" && !canUseFree
                ? "1px solid #ef4444"
                : loading
                  ? "1px solid #00ff88"
                  : "none",
            color:
              userPlan === "free" && !canUseFree
                ? "#ef4444"
                : !file || framesLength === 0 || stage === "extracting"
                  ? "#3a3a4a"
                  : loading
                    ? "#00ff88"
                    : "#080808",
            cursor: analyzeDisabled ? "not-allowed" : "pointer",
            fontFamily: "Space Mono, monospace",
            fontSize: 13,
            fontWeight: "bold",
            margin: "0 20px 20px 20px",
            padding: 14,
            transition: "all 0.2s",
          }}
        >
          {loading ? "Analyzing..." : stage === "extracting" ? "Extracting..." : "Analyze"}
        </button>
      </div>
    </div>
  );
}

type SmallButtonProps = {
  danger?: boolean;
  label: string;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
};

function SmallButton({ danger = false, label, onClick }: SmallButtonProps) {
  const baseColor = danger ? "#ef4444" : "#e2e8f0";
  const baseBackground = danger ? "#ef444415" : "#1a1a1a";
  const hoverBackground = danger ? "#ef444425" : "#2a2a2a";

  return (
    <button
      onClick={onClick}
      onMouseOut={(event) => {
        event.currentTarget.style.backgroundColor = baseBackground;
      }}
      onMouseOver={(event) => {
        event.currentTarget.style.backgroundColor = hoverBackground;
      }}
      style={{
        backgroundColor: baseBackground,
        border: "none",
        color: baseColor,
        cursor: "pointer",
        fontFamily: "Space Mono, monospace",
        fontSize: 9,
        padding: "4px 10px",
        transition: "all 0.2s",
      }}
    >
      {label}
    </button>
  );
}

function getFrameCountOptions(maxFrames: number) {
  return [4, 6, 8, 12].filter((count) => count <= maxFrames);
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
