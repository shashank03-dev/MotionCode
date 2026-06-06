import { PLAN_ENTITLEMENTS } from "@/lib/contracts/plans"

const SUPPORTED_VIDEO_MIME_TYPES = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
])

const SUPPORTED_EXTENSIONS: Record<string, "gif" | "video"> = {
  ".gif": "gif",
  ".mov": "video",
  ".mp4": "video",
  ".webm": "video",
}

const DEFAULT_SEEK_TIMEOUT_MS = 3000
const DEFAULT_METADATA_TIMEOUT_MS = 5000

export type ExtractFramesOptions = {
  maxBytes?: number
  maxFrames?: number
  metadataTimeoutMs?: number
  seekTimeoutMs?: number
}

export async function extractFrames(
  file: File,
  count: number = PLAN_ENTITLEMENTS.free.maxFramesPerAnalysis,
  options: ExtractFramesOptions = {},
): Promise<string[]> {
  const maxBytes = options.maxBytes ?? PLAN_ENTITLEMENTS.free.maxUploadBytes
  const maxFrames = options.maxFrames ?? PLAN_ENTITLEMENTS.free.maxFramesPerAnalysis
  const kind = getSupportedMediaKind(file)

  if (!kind) {
    throw new Error("Unsupported format. Use MP4, WebM, MOV, or GIF.")
  }

  if (file.size > maxBytes) {
    throw new Error(
      `File is too large. Free uploads are limited to ${formatMegabytes(maxBytes)} MB.`,
    )
  }

  if (!Number.isInteger(count) || count < 1 || count > maxFrames) {
    throw new Error(`Frame count must be between 1 and ${maxFrames}.`)
  }

  if (kind === "gif") return extractGifFrame(file)
  return extractVideoFrames(file, count, options)
}

export function isSupportedMediaFile(file: File) {
  return getSupportedMediaKind(file) !== null
}

async function extractGifFrame(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    const cleanup = () => URL.revokeObjectURL(url)

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas")
        const dimensions = fitDimensions(img.naturalWidth, img.naturalHeight)
        canvas.width = dimensions.width
        canvas.height = dimensions.height
        const ctx = getCanvasContext(canvas)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        const frame = getJpegBase64(canvas, 0.85)
        cleanup()
        resolve([frame])
      } catch (error) {
        cleanup()
        reject(error)
      }
    }

    img.onerror = () => {
      cleanup()
      reject(new Error("Failed to load GIF."))
    }

    img.src = url
  })
}

async function extractVideoFrames(
  file: File,
  count: number,
  options: ExtractFramesOptions,
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement("video")
    const seekTimeoutMs = options.seekTimeoutMs ?? DEFAULT_SEEK_TIMEOUT_MS
    const metadataTimeoutMs =
      options.metadataTimeoutMs ?? DEFAULT_METADATA_TIMEOUT_MS
    let metadataTimer: ReturnType<typeof setTimeout> | null = null
    let seekTimer: ReturnType<typeof setTimeout> | null = null
    let settled = false

    const cleanup = () => {
      if (metadataTimer) clearTimeout(metadataTimer)
      if (seekTimer) clearTimeout(seekTimer)
      video.removeEventListener("loadedmetadata", onLoadedMetadata)
      video.removeEventListener("seeked", onSeeked)
      video.removeEventListener("error", onError)
      URL.revokeObjectURL(url)
    }

    const fail = (error: Error) => {
      if (settled) return
      settled = true
      cleanup()
      reject(error)
    }

    const succeed = (frames: string[]) => {
      if (settled) return
      settled = true
      cleanup()
      resolve(frames)
    }

    const canvas = document.createElement("canvas")
    const ctx = getCanvasContext(canvas)
    const frames: string[] = []
    let current = 0
    let times: number[] = []

    function onLoadedMetadata() {
      if (metadataTimer) clearTimeout(metadataTimer)

      const duration = video.duration
      if (!Number.isFinite(duration) || duration <= 0) {
        fail(new Error("Cannot determine video duration."))
        return
      }

      times = Array.from({ length: count }, (_, i) =>
        (duration / (count + 1)) * (i + 1)
      )

      captureNext()
    }

    function onSeeked() {
      if (seekTimer) clearTimeout(seekTimer)

      try {
        const dimensions = fitDimensions(video.videoWidth, video.videoHeight)
        canvas.width = dimensions.width
        canvas.height = dimensions.height
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        frames.push(getJpegBase64(canvas, 0.8))
        current++
        captureNext()
      } catch (error) {
        fail(error instanceof Error ? error : new Error("Failed to capture frame."))
      }
    }

    function onError() {
      fail(new Error("Failed to load video."))
    }

    function captureNext() {
      if (current >= times.length) {
        succeed(frames)
        return
      }

      seekTimer = setTimeout(() => {
        fail(new Error("Timed out seeking video frame."))
      }, seekTimeoutMs)

      try {
        video.currentTime = times[current]
      } catch {
        fail(new Error("Failed to seek video frame."))
      }
    }

    video.src = url
    video.muted = true
    video.crossOrigin = "anonymous"
    video.preload = "metadata"
    video.addEventListener("loadedmetadata", onLoadedMetadata)
    video.addEventListener("seeked", onSeeked)
    video.addEventListener("error", onError)

    metadataTimer = setTimeout(() => {
      fail(new Error("Timed out loading video metadata."))
    }, metadataTimeoutMs)

    video.load()
  })
}

function getSupportedMediaKind(file: File): "gif" | "video" | null {
  const mimeType = file.type.toLowerCase()

  if (mimeType === "image/gif") {
    return "gif"
  }

  if (SUPPORTED_VIDEO_MIME_TYPES.has(mimeType)) {
    return "video"
  }

  const extension = getFileExtension(file.name)
  return SUPPORTED_EXTENSIONS[extension] ?? null
}

function getFileExtension(name: string) {
  const lower = name.toLowerCase()
  const dotIndex = lower.lastIndexOf(".")
  return dotIndex === -1 ? "" : lower.slice(dotIndex)
}

function fitDimensions(width: number, height: number) {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    throw new Error("Cannot determine media dimensions.")
  }

  return {
    height: Math.min(height, 480),
    width: Math.min(width, 640),
  }
}

function getCanvasContext(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d")
  if (!context) {
    throw new Error("Could not initialize frame canvas.")
  }

  return context
}

function getJpegBase64(canvas: HTMLCanvasElement, quality: number) {
  const frame = canvas.toDataURL("image/jpeg", quality).split(",")[1]
  if (!frame) {
    throw new Error("Failed to encode video frame.")
  }

  return frame
}

function formatMegabytes(bytes: number) {
  return Math.round(bytes / (1024 * 1024))
}
