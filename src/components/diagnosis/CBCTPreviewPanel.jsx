import { useEffect, useRef, useState } from 'react'
import { ScanFace, Loader2, Maximize2 } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { useNiftiScan } from '@/hooks/useNiftiScan'

const fmt = (v) => (Math.round(v * 10) / 10).toLocaleString()

// Standard clinical CT window/level presets (width, center). The "Full range"
// preset uses the scan's own min/max values from `fullRangeWindow`.
const PRESETS = [
  { label: 'Bone', windowWidth: 1500, windowCenter: 450 },
  { label: 'Soft tissue', windowWidth: 400, windowCenter: 40 },
]

const matches = (a, b) => a != null && b != null && Math.round(a) === Math.round(b)

/**
 * Renders a single scan slice and the slice/window-level controls. Shared by
 * the inline panel and the full-size modal viewer so both stay in sync.
 */
function ScanViewer({
  slice,
  totalSlices,
  sliceIndex,
  onSliceChange,
  windowLevel,
  onWindowLevelChange,
  fullRangeWindow,
  maxHeight,
  onCanvasClick,
}) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !slice) return
    const ratio = Math.min(1, 720 / slice.width)
    const w = Math.round(slice.width * ratio)
    const h = Math.round(slice.height * ratio)
    if (canvas.width !== w) canvas.width = w
    if (canvas.height !== h) canvas.height = h
    const ctx = canvas.getContext('2d')
    const out = ctx.createImageData(slice.width, slice.height)
    out.data.set(slice.data)
    ctx.putImageData(out, 0, 0)
  }, [slice])

  if (!slice) return null

  return (
    <div className="flex flex-col gap-4">
      <div className="relative overflow-hidden rounded-lg border border-border bg-black">
        <canvas
          ref={canvasRef}
          onClick={onCanvasClick}
          role={onCanvasClick ? 'button' : undefined}
          aria-label={onCanvasClick ? 'Open full-size scan viewer' : undefined}
          className={`mx-auto block w-full object-contain ${onCanvasClick ? 'cursor-zoom-in' : ''}`}
          style={{ height: maxHeight }}
        />
        <span className="absolute left-2 top-2 rounded bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
          Slice {slice.slice + 1} / {totalSlices}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={Math.max(0, totalSlices - 1)}
          value={sliceIndex}
          onChange={(e) => onSliceChange(Number(e.target.value))}
          className="h-2 flex-1 cursor-pointer accent-primary"
          aria-label="Slice"
        />
        <span className="w-12 text-right font-mono text-xs text-muted-foreground">
          {sliceIndex + 1}/{totalSlices}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => onWindowLevelChange({ windowWidth: p.windowWidth, windowCenter: p.windowCenter })}
            className={`rounded-md border px-2 py-1 text-xs font-medium ${
              matches(windowLevel.windowWidth, p.windowWidth) &&
              matches(windowLevel.windowCenter, p.windowCenter)
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:bg-card-hover hover:text-foreground'
            }`}
          >
            {p.label}
          </button>
        ))}
        {fullRangeWindow && (
          <button
            onClick={() => onWindowLevelChange({ ...fullRangeWindow })}
            className={`rounded-md border px-2 py-1 text-xs font-medium ${
              matches(windowLevel.windowWidth, fullRangeWindow.windowWidth) &&
              matches(windowLevel.windowCenter, fullRangeWindow.windowCenter)
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:bg-card-hover hover:text-foreground'
            }`}
          >
            Full range
          </button>
        )}
        <span className="mx-1 h-4 w-px bg-border" />
        <button
          onClick={() => fullRangeWindow && onWindowLevelChange({ ...fullRangeWindow })}
          disabled={!fullRangeWindow}
          className="rounded-md border border-border px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-card-hover hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          Reset
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs text-muted-foreground">
            Window width — {fmt(windowLevel.windowWidth)}
          </span>
          <input
            type="range"
            min={Math.max(1, Math.round(windowLevel.windowWidth / 8))}
            max={Math.round(windowLevel.windowWidth * 4)}
            value={windowLevel.windowWidth}
            onChange={(e) =>
              onWindowLevelChange((wl) => ({ ...wl, windowWidth: Number(e.target.value) }))
            }
            className="mt-1 h-2 w-full cursor-pointer accent-primary"
            aria-label="Window width"
          />
        </label>
        <label className="block">
          <span className="text-xs text-muted-foreground">
            Window center — {fmt(windowLevel.windowCenter)}
          </span>
          <input
            type="range"
            min={Math.round(windowLevel.windowCenter - windowLevel.windowWidth)}
            max={Math.round(windowLevel.windowCenter + windowLevel.windowWidth)}
            value={windowLevel.windowCenter}
            onChange={(e) =>
              onWindowLevelChange((wl) => ({ ...wl, windowCenter: Number(e.target.value) }))
            }
            className="mt-1 h-2 w-full cursor-pointer accent-primary"
            aria-label="Window center"
          />
        </label>
      </div>
    </div>
  )
}

/**
 * Interactive NIfTI CBCT preview. Renders axial slices to a canvas with
 * slice navigation and window/level controls. Clicking the image opens the
 * same viewer full-size in a modal.
 */
export default function CBCTPreviewPanel({ fileName, filePath }) {
  const [sliceIndex, setSliceIndex] = useState(0)
  const [viewerOpen, setViewerOpen] = useState(false)

  const {
    dimensions,
    windowLevel,
    setWindowLevel,
    fullRangeWindow,
    getSliceImageData,
    totalSlices,
    loading,
    error,
  } = useNiftiScan(filePath, { enabled: Boolean(filePath) })

  useEffect(() => {
    setSliceIndex((cur) => (cur > 0 && cur < (totalSlices || 1) ? cur : Math.floor(totalSlices / 2)))
  }, [filePath, totalSlices])

  const slice = getSliceImageData(sliceIndex)

  const renderEmpty = () => (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-background py-16 text-center">
      <ScanFace className="h-8 w-8 text-muted-foreground" />
      <div>
        <p className="text-sm font-medium text-foreground">No renderable scan</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {fileName ? `${fileName}` : 'No scan attached to this diagnosis.'} This viewer supports
          NIfTI scans (.nii / .nii.gz). DICOM uploads are not yet previewable.
        </p>
      </div>
    </div>
  )

  const renderError = () => (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-destructive/40 bg-background py-12 text-center">
      <ScanFace className="h-8 w-8 text-destructive" />
      <div>
        <p className="text-sm font-medium text-foreground">Could not load scan preview</p>
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">{error?.message}</p>
      </div>
    </div>
  )

  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-background py-16 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Loading scan…</p>
    </div>
  )

  return (
    <Card>
      <Card.Header>
        <h3 className="text-sm font-medium text-foreground">CBCT preview</h3>
        {dimensions && (
          <span className="font-mono text-xs text-muted-foreground">
            {dimensions[0]}×{dimensions[1]}×{dimensions[2]}
          </span>
        )}
      </Card.Header>
      <Card.Body>
        {loading
          ? renderLoading()
          : error
            ? renderError()
            : !slice
              ? renderEmpty()
              : (
                  <div className="flex flex-col gap-3">
                    <ScanViewer
                      slice={slice}
                      totalSlices={totalSlices}
                      sliceIndex={sliceIndex}
                      onSliceChange={setSliceIndex}
                      windowLevel={windowLevel}
                      onWindowLevelChange={setWindowLevel}
                      fullRangeWindow={fullRangeWindow}
                      maxHeight="min(340px, 40vh)"
                      onCanvasClick={() => setViewerOpen(true)}
                    />

                    <button
                      onClick={() => setViewerOpen(true)}
                      className="flex items-center justify-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-card-hover hover:text-foreground"
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                      View full size
                    </button>
                  </div>
                )}
      </Card.Body>

      <Modal
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        title="Full-size scan viewer"
        size="xl"
        footer={<Button onClick={() => setViewerOpen(false)}>Close</Button>}
      >
        <ScanViewer
          slice={slice}
          totalSlices={totalSlices}
          sliceIndex={sliceIndex}
          onSliceChange={setSliceIndex}
          windowLevel={windowLevel}
          onWindowLevelChange={setWindowLevel}
          fullRangeWindow={fullRangeWindow}
          maxHeight="min(50vh, 480px)"
        />
      </Modal>
    </Card>
  )
}