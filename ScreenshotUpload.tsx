import React, { useEffect, useState } from 'react'
import { useApp } from '../store/AppContext'
import { Button } from './ui'

export function ScreenshotUpload({
  screenshotId, onChange
}: { screenshotId: string | null; onChange: (id: string | null) => void }) {
  const { saveScreenshot, getScreenshotUrl, deleteScreenshot } = useApp()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    let objectUrl: string | null = null
    if (screenshotId) {
      getScreenshotUrl(screenshotId).then((url) => {
        if (!cancelled) {
          objectUrl = url
          setPreviewUrl(url)
        }
      })
    } else {
      setPreviewUrl(null)
    }
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [screenshotId, getScreenshotUrl])

  async function handleFile(file: File | undefined) {
    setError('')
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.')
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('Image is larger than 8MB — please choose a smaller screenshot.')
      return
    }
    if (screenshotId) await deleteScreenshot(screenshotId)
    const id = await saveScreenshot('pending', file, file.type)
    onChange(id)
  }

  async function handleRemove() {
    if (screenshotId) await deleteScreenshot(screenshotId)
    onChange(null)
  }

  return (
    <div className="flex flex-col gap-2">
      {previewUrl ? (
        <div className="relative">
          <img src={previewUrl} alt="Trade screenshot" className="w-full rounded-card border border-base-border max-h-64 object-contain bg-black" />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2.5 py-1 rounded-pill"
          >
            Remove
          </button>
        </div>
      ) : (
        <label className="flex items-center justify-center border border-dashed border-base-border rounded-card py-6 text-sm text-ink-muted cursor-pointer">
          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
          + Attach a screenshot
        </label>
      )}
      {error && <span className="text-xs text-loss">{error}</span>}
      <span className="text-xs text-ink-faint">Stored only on this device — never uploaded anywhere.</span>
    </div>
  )
}
