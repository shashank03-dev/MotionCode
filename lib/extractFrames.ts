const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024
const MAX_FRAME_COUNT = 12
const MIN_FRAME_COUNT = 1
const DEFAULT_FRAME_COUNT = 8
const SUPPORTED_MEDIA_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "image/gif",
])

export type FrameRequestValidation =
  | { ok: true; normalizedCount: number }
  | { ok: false; error: string }

function normalizeFrameCount(count: number): number {
  const integerCount = Number.isFinite(count)
    ? Math.trunc(count)
    : DEFAULT_FRAME_COUNT

  return Math.max(MIN_FRAME_COUNT, Math.min(MAX_FRAME_COUNT, integerCount))
}

export function validateFrameRequest(
  file: File,
  count: number
): FrameRequestValidation {
  if (!SUPPORTED_MEDIA_TYPES.has(file.type)) {
    return { ok: false, error: "Unsupported format. Use MP4, WebM, MOV, or GIF." }
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { ok: false, error: "File is too large. Maximum size is 50 MB." }
  }

  return {
    ok: true,
    normalizedCount: normalizeFrameCount(count),
  }
}

export async function extractFrames(
  file: File,
  count: number = DEFAULT_FRAME_COUNT
): Promise<string[]> {
  const validation = validateFrameRequest(file, count)
  if (!validation.ok) throw new Error(validation.error)

  const isGif = file.type === "image/gif"

  if (isGif) return extractGifFrame(file)
  return extractVideoFrames(file, validation.normalizedCount)
}

async function extractGifFrame(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    let settled = false

    function rejectWithCleanup(error: Error) {
      if (settled) return
      settled = true
      URL.revokeObjectURL(url)
      reject(error)
    }

    function resolveWithCleanup(frames: string[]) {
      if (settled) return
      settled = true
      URL.revokeObjectURL(url)
      resolve(frames)
    }

    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = Math.min(img.naturalWidth, 640)
      canvas.height = Math.min(img.naturalHeight, 480)
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const frame = canvas.toDataURL("image/jpeg", 0.85).split(",")[1]
      resolveWithCleanup([frame])
    }
    img.onerror = () => {
      rejectWithCleanup(new Error("Failed to extract GIF frame"))
    }
    img.src = url
  })
}

async function extractVideoFrames(
  file: File,
  count: number
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement("video")
    let seekTimeout: ReturnType<typeof setTimeout> | undefined
    let settled = false

    function clearSeekTimeout() {
      if (seekTimeout) {
        clearTimeout(seekTimeout)
        seekTimeout = undefined
      }
    }

    function rejectWithCleanup(error: Error) {
      if (settled) return
      settled = true
      clearSeekTimeout()
      URL.revokeObjectURL(url)
      reject(error)
    }

    function resolveWithCleanup(frames: string[]) {
      if (settled) return
      settled = true
      clearSeekTimeout()
      URL.revokeObjectURL(url)
      resolve(frames)
    }

    function handleVideoError() {
      rejectWithCleanup(new Error("Failed to extract video frames"))
    }

    video.src = url
    video.muted = true
    video.crossOrigin = "anonymous"
    video.preload = "metadata"

    video.addEventListener("loadedmetadata", () => {
      const duration = video.duration
      if (!duration || duration === Infinity) {
        rejectWithCleanup(new Error("Cannot determine video duration"))
        return
      }

      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")!
      const frames: string[] = []
      let current = 0

      // Capture frames at evenly spaced intervals
      const times = Array.from({ length: count }, (_, i) =>
        (duration / (count + 1)) * (i + 1)
      )

      function captureNext() {
        if (settled) return

        if (current >= times.length) {
          resolveWithCleanup(frames)
          return
        }

        seekTimeout = setTimeout(() => {
          rejectWithCleanup(new Error("Timed out while extracting video frames"))
        }, 10_000)
        video.currentTime = times[current]
      }

      video.addEventListener("seeked", function onSeeked() {
        if (settled) return
        clearSeekTimeout()
        canvas.width = Math.min(video.videoWidth, 640)
        canvas.height = Math.min(video.videoHeight, 480)
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        frames.push(
          canvas.toDataURL("image/jpeg", 0.8).split(",")[1]
        )
        current++
        captureNext()
      })

      captureNext()
    })

    video.addEventListener("error", handleVideoError)
    video.load()
  })
}
