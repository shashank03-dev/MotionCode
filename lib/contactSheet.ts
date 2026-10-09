// Tiles the sampled frames into one numbered contact-sheet JPEG so the model
// reads a single image instead of one upload per frame.

export type FrameGridLayout = {
  columns: number
  frameCount: number
  rows: number
}

export type ContactSheet = {
  frameGrid: FrameGridLayout
  image: string
}

const MAX_SHEET_WIDTH = 2048
const MAX_SHEET_HEIGHT = 2048
const GUTTER = 6
const SHEET_QUALITY = 0.85

export function getGridLayout(frameCount: number): FrameGridLayout {
  const columns = Math.ceil(Math.sqrt(frameCount))
  return { columns, frameCount, rows: Math.ceil(frameCount / columns) }
}

export async function composeContactSheet(frames: string[]): Promise<ContactSheet> {
  if (!frames.length) {
    throw new Error("No frames to compose.")
  }

  const images = await Promise.all(frames.map(loadJpeg))
  const frameGrid = getGridLayout(images.length)
  const { columns, rows } = frameGrid

  // Frames share one source, so the first frame sets the cell aspect ratio.
  const sourceWidth = images[0].naturalWidth
  const sourceHeight = images[0].naturalHeight
  const scale = Math.min(
    1,
    (MAX_SHEET_WIDTH - GUTTER * (columns + 1)) / (sourceWidth * columns),
    (MAX_SHEET_HEIGHT - GUTTER * (rows + 1)) / (sourceHeight * rows),
  )
  const cellWidth = Math.max(1, Math.floor(sourceWidth * scale))
  const cellHeight = Math.max(1, Math.floor(sourceHeight * scale))

  const canvas = document.createElement("canvas")
  canvas.width = columns * cellWidth + GUTTER * (columns + 1)
  canvas.height = rows * cellHeight + GUTTER * (rows + 1)
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    throw new Error("Could not initialize contact sheet canvas.")
  }

  ctx.fillStyle = "#000000"
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const labelSize = Math.max(14, Math.round(cellHeight * 0.09))
  ctx.font = `600 ${labelSize}px sans-serif`
  ctx.textBaseline = "top"

  images.forEach((image, index) => {
    const x = GUTTER + (index % columns) * (cellWidth + GUTTER)
    const y = GUTTER + Math.floor(index / columns) * (cellHeight + GUTTER)
    ctx.drawImage(image, x, y, cellWidth, cellHeight)

    const label = String(index + 1)
    const padding = Math.round(labelSize * 0.35)
    const labelWidth = ctx.measureText(label).width + padding * 2
    ctx.fillStyle = "rgba(0, 0, 0, 0.75)"
    ctx.fillRect(x, y, labelWidth, labelSize + padding * 2)
    ctx.fillStyle = "#ffffff"
    ctx.fillText(label, x + padding, y + padding)
  })

  const image = canvas.toDataURL("image/jpeg", SHEET_QUALITY).split(",")[1]
  if (!image) {
    throw new Error("Failed to encode contact sheet.")
  }

  return { frameGrid, image }
}

function loadJpeg(base64: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("Failed to load frame."))
    image.src = `data:image/jpeg;base64,${base64}`
  })
}
