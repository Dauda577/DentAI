import { useEffect, useRef, useState } from 'react'
import { ScanFace, Loader2 } from 'lucide-react'
import Card from '@/components/ui/Card'
import { useNiftiScan } from '@/hooks/useNiftiScan'

/**
 * Interactive NIfTI CBCT preview. Renders axial slices to a canvas with
 * slice navigation and window/level controls.
 */
export default function CBCTPreviewPanel({ fileName, filePath }) {
  const canvasRef = useRef(null)
  const [sliceIndex, setSliceIndex] = useState(0)
  const [zoomed, setZoomed] = useState(false)

  const { dimensions, windowLevel, setWindowLevel, getSliceImageData, totalSlices, loading, error } =
    useNiftiScan(filePath, { enabled: Boolean(filePath) })

  useEffect(() => {
    setSliceIndex((cur) => (cur > 0 && cur < (totalSlices || 1) ? cur : Math.floor(totalSlices / 2)))
  }, [filePath, totalSlices])

  const slice = getSliceImageData(sliceIndex)

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
  }, [slice, zoomed])

  const fmt = (v) => (Math.round(v * 10) / 10).toLocaleString()

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
                  <div className="flex flex-col gap-4">
                    <div className="relative overflow-hidden rounded-lg border border-border bg-black">
                      <canvas
                        ref={canvasRef}
                        onClick={() => setZoomed((z) => !z)}
                        className="mx-auto block w-full cursor-zoom-in object-contain"
                        style={{ height: zoomed ? undefined : 'min(340px, 40vh)' }}
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
                        onChange={(e) => setSliceIndex(Number(e.target.value))}
                        className="h-2 flex-1 cursor-pointer accent-primary"
                        aria-label="Slice"
                      />
                      <span className="w-12 text-right font-mono text-xs text-muted-foreground">
                        {sliceIndex + 1}/{totalSlices}
                      </span>
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
                            setWindowLevel((wl) => ({ ...wl, windowWidth: Number(e.target.value) }))
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
                            setWindowLevel((wl) => ({ ...wl, windowCenter: Number(e.target.value) }))
                          }
                          className="mt-1 h-2 w-full cursor-pointer accent-primary"
                          aria-label="Window center"
                        />
                      </label>
                    </div>
                  </div>
                )}
      </Card.Body>
    </Card>
  )
}