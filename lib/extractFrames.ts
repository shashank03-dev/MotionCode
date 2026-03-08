export async function extractFrames(
  file: File,
  count: number = 8
): Promise<string[]> {
  const isGif = file.type === "image/gif"
  const isVideo = file.type.startsWith("video/")

  if (!isGif && !isVideo) throw new Error("Unsupported file type")

  if (isGif) return extractGifFrame(file)
  return extractVideoFrames(file, count)
}

async function extractGifFrame(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = Math.min(img.naturalWidth, 640)
      canvas.height = Math.min(img.naturalHeight, 480)
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const frame = canvas.toDataURL("image/jpeg", 0.85).split(",")[1]
      URL.revokeObjectURL(url)
      resolve([frame])
    }
    img.onerror = reject
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
    video.src = url
    video.muted = true
    video.crossOrigin = "anonymous"
    video.preload = "metadata"

    video.addEventListener("loadedmetadata", () => {
      const duration = video.duration
      if (!duration || duration === Infinity) {
        reject(new Error("Cannot determine video duration"))
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
        if (current >= times.length) {
          URL.revokeObjectURL(url)
          resolve(frames)
          return
        }

        video.currentTime = times[current]
      }

      video.addEventListener("seeked", function onSeeked() {
        canvas.width = Math.min(video.videoWidth, 640)
        canvas.height = Math.min(video.videoHeight, 480)
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        frames.push(
          canvas.toDataURL("image/jpeg", 0.8).split(",")[1]
        )
        current++
        captureNext()
      })

      video.addEventListener("error", reject)
      captureNext()
    })

    video.addEventListener("error", reject)
    video.load()
  })
}
