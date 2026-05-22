"use client"

import { useState } from "react"

export interface PhotoThumbnailProps {
  photo: {
    id: string
    path: string
    credit?: string | null
    sort_order?: number
    url?: string | null
  }
  onDownload?: (e: React.MouseEvent) => void
  showDownload?: boolean
  className?: string
}

export function PhotoThumbnail({ 
  photo, 
  onDownload,
  showDownload = false,
  className = ""
}: PhotoThumbnailProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  if (!photo.url) {
    return (
      <div className={`w-full h-32 bg-gray-200 rounded border flex items-center justify-center text-sm text-gray-500 p-2 ${className}`}>
        <span className="font-mono text-xs break-all text-center">No URL available<br/>{photo.path}</span>
      </div>
    )
  }

  return (
    <div className={`relative group ${className}`}>
      <div className="w-full h-32 rounded border overflow-hidden bg-gray-100 relative">
        {imageError ? (
          <div className="w-full h-full flex items-center justify-center text-sm text-gray-500 p-2 bg-gray-200">
            <span className="font-mono text-xs break-all text-center">Failed to load<br/>{photo.path}</span>
          </div>
        ) : (
          <>
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                <span className="text-xs text-gray-400">Loading...</span>
              </div>
            )}
            <img 
              src={photo.url} 
              alt={photo.credit || `Photo ${photo.sort_order ?? 0}`}
              className="w-full h-32 object-cover"
              style={{ 
                display: imageError ? 'none' : 'block',
                opacity: imageLoading ? 0 : 1,
                transition: 'opacity 0.2s'
              }}
              onError={() => {
                setImageError(true)
                setImageLoading(false)
              }}
              onLoad={() => {
                setImageLoading(false)
                setImageError(false)
              }}
            />
          </>
        )}
        {showDownload && !imageError && !imageLoading && onDownload && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-50 transition-opacity"></div>
            <button
              onClick={onDownload}
              className="relative opacity-0 group-hover:opacity-100 text-white px-3 py-1 bg-[var(--primary-600)] rounded hover:bg-[var(--primary-500)] transition-opacity pointer-events-auto z-10"
            >
              Download
            </button>
          </div>
        )}
      </div>
      {photo.credit && (
        <p className="text-xs text-[var(--gray-600)] mt-1">{photo.credit}</p>
      )}
    </div>
  )
}
