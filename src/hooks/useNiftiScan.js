import { useCallback, useEffect, useMemo, useState } from 'react'
import * as nifti from 'nifti-reader-js'
import { supabase } from '@/lib/supabaseClient'

// NIFTI-1 datatype codes (https://nifti.nimh.nih.gov/pub/dist/src/niftilib/nifti1.h)
// Note: 64-bit ints (1024/1280) are excluded — browsers have no Int64Array.
const TYPED_ARRAY_BY_DATATYPE = {
  2: Uint8Array,
  4: Int16Array,
  8: Int32Array,
  16: Float32Array,
  64: Float64Array,
  512: Uint16Array,
  768: Uint32Array,
}

function getImageDataView(header, imageBuffer) {
  const ctor = TYPED_ARRAY_BY_DATATYPE[header.datatypeCode] ?? Float32Array
  return new ctor(imageBuffer)
}

/**
 * Downloads and parses a NIfTI scan from Supabase storage, exposing the 3D
 * volume plus a window/level-respecting slice renderer for the canvas.
 */
export function useNiftiScan(filePath, { enabled = true } = {}) {
  const [volume, setVolume] = useState(null)
  const [dimensions, setDimensions] = useState(null)
  const [windowLevel, setWindowLevel] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!enabled || !filePath) return
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data, error: signError } = await supabase.storage
          .from('cbct-scans')
          .createSignedUrl(filePath, 3600)
        if (signError) throw signError

        const resp = await fetch(data.signedUrl)
        if (!resp.ok) throw new Error('Unable to download the scan from storage.')
        let buffer = await resp.arrayBuffer()

        if (nifti.isCompressed(buffer)) {
          buffer = nifti.decompress(buffer)
        }
        if (!nifti.isNIFTI(buffer)) {
          throw new Error('The uploaded file is not a valid NIfTI scan.')
        }

        const header = nifti.readHeader(buffer)
        const imageBuffer = nifti.readImage(header, buffer)
        const dataView = getImageDataView(header, imageBuffer)

        // NIFTI-1 header: dim[0] = number of dimensions, dim[1..3] = x/y/z sizes.
        const dims = [header.dims[1], header.dims[2], header.dims[3]]
        const slope = header.scl_slope !== 0 ? header.scl_slope : 1
        const intercept = header.scl_inter || 0

        const scaled = new Float32Array(dataView.length)
        for (let i = 0; i < dataView.length; i++) scaled[i] = dataView[i] * slope + intercept

        let min = Infinity
        let max = -Infinity
        for (let i = 0; i < scaled.length; i++) {
          if (scaled[i] < min) min = scaled[i]
          if (scaled[i] > max) max = scaled[i]
        }
        if (!Number.isFinite(min) || min === max) {
          min = 0
          max = 255
        }

        if (cancelled) return
        setVolume(scaled)
        setDimensions(dims)
        setWindowLevel({ windowWidth: max - min, windowCenter: (max + min) / 2 })
        setLoading(false)
      } catch (err) {
        if (!cancelled) {
          setError(err)
          setLoading(false)
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [enabled, filePath])

  // Axial slice at `index` scaled to 0..255 under the current window/level.
  const getSliceImageData = useCallback(
    (index) => {
      if (!volume || !dimensions || !windowLevel) return null
      const [nx, ny, nz] = dimensions
      const slice = Math.max(0, Math.min(nz - 1, index))
      const ll = windowLevel.windowCenter - windowLevel.windowWidth / 2
      const ul = ll + windowLevel.windowWidth

      const out = new Uint8ClampedArray(nx * ny)
      const sliceOffset = slice * nx * ny
      for (let i = 0; i < nx * ny; i++) {
        const v = volume[sliceOffset + i]
        out[i] = v <= ll ? 0 : v >= ul ? 255 : ((v - ll) / (ul - ll)) * 255
      }
      return { data: out, width: nx, height: ny, slice }
    },
    [volume, dimensions, windowLevel]
  )

  const totalSlices = useMemo(() => (dimensions ? dimensions[2] : 0), [dimensions])

  return {
    dimensions,
    windowLevel,
    setWindowLevel,
    getSliceImageData,
    totalSlices,
    loading,
    error,
  }
}