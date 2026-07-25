import { useCallback, useRef, useState } from 'react'
import { UploadCloud, File as FileIcon, X } from 'lucide-react'
import ProgressBar from '@/components/ui/ProgressBar'
import { formatFileSize } from '@/utils/fileHelpers'

/**
 * accept: string[] of extensions, e.g. ['.dcm', '.nii.gz']
 * validate: (file) => { valid, error }
 * onFilesChange: (file | null) => void
 * uploadProgress: 0-100 | undefined — shown while a submit is in flight
 */
export default function FileUploader({
  accept = [],
  maxSizeLabel,
  validate,
  onFilesChange,
  uploadProgress,
  multiple = false,
}) {
  const inputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  const handleFile = useCallback(
    (selected) => {
      if (!selected) return
      if (validate) {
        const result = validate(selected)
        if (!result.valid) {
          setError(result.error)
          setFile(null)
          onFilesChange?.(null)
          return
        }
      }
      setError('')
      setFile(selected)
      onFilesChange?.(selected)
    },
    [validate, onFilesChange]
  )

  const onDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files?.[0]
    handleFile(dropped)
  }

  const removeFile = () => {
    setFile(null)
    setError('')
    onFilesChange?.(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  if (file) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/15">
            <FileIcon className="h-4.5 w-4.5 text-accent" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
            <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
          </div>
          {uploadProgress === undefined && (
            <button
              onClick={removeFile}
              aria-label="Remove file"
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {uploadProgress !== undefined && (
          <ProgressBar value={uploadProgress} showLabel className="mt-3" />
        )}
      </div>
    )
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed
          px-6 py-10 text-center transition-colors
          ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
      >
        <UploadCloud className="h-7 w-7 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">Drag and drop a file, or click to browse</p>
        <p className="text-xs text-muted-foreground">
          Supported formats: {accept.join(', ')}
          {maxSizeLabel ? ` · Max ${maxSizeLabel}` : ''}
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept={accept.join(',')}
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  )
}
