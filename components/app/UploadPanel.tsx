import { FileUp, RefreshCw, Trash2, UploadCloud } from "lucide-react";
import Link from "next/link";
import type { DragEvent, KeyboardEvent, MouseEvent, ReactNode, RefObject } from "react";

import type { PlanEntitlements, PlanTier } from "@/lib/contracts/plans";

/* eslint-disable @next/next/no-img-element -- Upload previews are local blob URLs that next/image cannot optimize. */

import { FrameStrip } from "./FrameStrip";
import styles from "./UploadPanel.module.css";
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
    <aside className={styles.panel} id="left-panel">
      <div className={styles.header}>
        <span>Input</span>
      </div>

      <div
        className={`${styles.dropzone} ${dragActive ? styles.dropzoneActive : ""} ${
          flashError ? styles.dropzoneError : ""
        } ${file ? styles.dropzoneReady : ""}`}
        data-testid="upload-dropzone"
        onClick={() => fileInputRef.current?.click()}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={0}
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
          type="file"
        />

        {!file ? (
          <div className={styles.emptyUpload}>
            <UploadCloud aria-hidden="true" size={30} strokeWidth={1.5} />
            <span>Drop animation here</span>
            <small>MP4 / WebM / MOV / GIF</small>
          </div>
        ) : (
          <div className={styles.fileSummary}>
            <FileUp aria-hidden="true" size={24} strokeWidth={1.5} />
            <strong title={file.name}>{file.name}</strong>
            <small>{formatFileSize(file.size)}</small>
            <div className={styles.fileActions}>
              <SmallButton
                icon={<RefreshCw aria-hidden="true" size={13} />}
                label="Change"
                onClick={(event) => {
                  event.stopPropagation();
                  fileInputRef.current?.click();
                }}
              />
              <SmallButton
                danger
                icon={<Trash2 aria-hidden="true" size={13} />}
                label="Remove"
                onClick={(event) => onRemoveFile(event)}
              />
            </div>
          </div>
        )}
      </div>

      {validationError && <div className={styles.validation}>{validationError}</div>}

      {fileUrl && (
        <div className={styles.preview}>
          {file?.type?.startsWith("video/") ? (
            <video controls id="video-preview" loop muted src={fileUrl} />
          ) : (
            <img alt="Uploaded animation preview" id="video-preview" src={fileUrl} />
          )}
        </div>
      )}

      <FrameStrip frameCount={framesLength} thumbs={frameThumbs} />

      <div className={styles.controls}>
        <div className={styles.controlLabel}>Frame count</div>
        <div className={styles.frameButtons}>
          {getFrameCountOptions(entitlements.maxFramesPerAnalysis).map((count) => (
            <button
              aria-pressed={frameCount === count}
              className={frameCount === count ? styles.frameButtonActive : undefined}
              key={count}
              onClick={() => onFrameCountChange(count)}
              type="button"
            >
              {count}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className={styles.loadingRail} aria-hidden="true">
          <span />
        </div>
      )}

      {userPlan === "free" ? (
        <div className={styles.usageBox}>
          {canUseFree ? (
            <span>{usageRemaining} free analyses remaining today</span>
          ) : (
            <>
              <strong>Daily limit reached ({entitlements.dailyAnalyses}/day)</strong>
              <Link href="/pricing">View paid plans</Link>
            </>
          )}
        </div>
      ) : (
        <div className={`${styles.usageBox} ${styles.usageBoxPro}`}>
          Extended analysis enabled.
        </div>
      )}

      <div className={styles.submitArea}>
        {!file && <span>Upload a file to enable analysis</span>}
        <button disabled={analyzeDisabled} onClick={onAnalyze} type="button">
          {loading ? "Analyzing..." : stage === "extracting" ? "Extracting..." : "Analyze"}
        </button>
      </div>
    </aside>
  );
}

type SmallButtonProps = {
  danger?: boolean;
  icon: ReactNode;
  label: string;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
};

function SmallButton({ danger = false, icon, label, onClick }: SmallButtonProps) {
  return (
    <button
      className={`${styles.smallButton} ${danger ? styles.smallButtonDanger : ""}`}
      onClick={onClick}
      type="button"
    >
      {icon}
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
