import { useEffect, useState } from 'react'
import type { PhotoItem } from '../types'

export function PhotoGrid({ photos }: { photos: PhotoItem[] }) {
  const [activePhoto, setActivePhoto] = useState<PhotoItem | null>(null)

  useEffect(() => {
    if (!activePhoto) {
      return
    }

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setActivePhoto(null)
      }
    }

    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [activePhoto])

  if (photos.length === 0) {
    return <p className="card muted reveal">No photos yet. Be the first to add one.</p>
  }

  return (
    <>
      <div className="photo-grid">
        {photos.map((photo) => (
          <figure key={photo.id} className="photo-card reveal">
            <button
              type="button"
              className="photo-open"
              onClick={() => setActivePhoto(photo)}
              aria-label={`Open photo shared by ${photo.uploadedBy}`}
            >
              <img src={photo.imageUrl} alt={photo.caption ?? 'Wedding moment'} loading="lazy" />
            </button>
            <figcaption>
              {photo.caption ? <p>{photo.caption}</p> : null}
              <p className="muted">Shared by {photo.uploadedBy}</p>
            </figcaption>
          </figure>
        ))}
      </div>

      {activePhoto ? (
        <div
          className="photo-modal-backdrop"
          role="presentation"
          onClick={() => setActivePhoto(null)}
        >
          <div
            className="photo-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Photo viewer"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="photo-modal-close"
              onClick={() => setActivePhoto(null)}
            >
              Close
            </button>

            <div className="photo-modal-media-wrap">
              <img
                src={activePhoto.imageUrl}
                alt={activePhoto.caption ?? 'Wedding moment'}
                className="photo-modal-media"
              />
            </div>

            <div className="photo-modal-caption">
              {activePhoto.caption ? <p>{activePhoto.caption}</p> : null}
              <p className="muted">Shared by {activePhoto.uploadedBy}</p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
