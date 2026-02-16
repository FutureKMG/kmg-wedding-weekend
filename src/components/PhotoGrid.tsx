import { useEffect, useState } from 'react'
import type { PhotoItem } from '../types'

type PhotoGridProps = {
  photos: PhotoItem[]
  onDeletePhoto?: (photoId: string) => Promise<void>
  onUpdatePhoto?: (photoId: string, payload: { caption: string; shareToFeed: boolean }) => Promise<void>
  deletingPhotoId?: string | null
  updatingPhotoId?: string | null
}

export function PhotoGrid({
  photos,
  onDeletePhoto,
  onUpdatePhoto,
  deletingPhotoId = null,
  updatingPhotoId = null,
}: PhotoGridProps) {
  const [activePhoto, setActivePhoto] = useState<PhotoItem | null>(null)
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null)
  const [editingCaption, setEditingCaption] = useState('')
  const [editingShareToFeed, setEditingShareToFeed] = useState(true)

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

  function startEditingPhoto(photo: PhotoItem) {
    setEditingPhotoId(photo.id)
    setEditingCaption(photo.caption ?? '')
    setEditingShareToFeed(photo.isFeedPost)
  }

  function cancelEditingPhoto() {
    setEditingPhotoId(null)
    setEditingCaption('')
    setEditingShareToFeed(true)
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
              <div className="photo-meta-row">
                <p className="muted">Shared by {photo.uploadedBy}</p>
                {photo.isOwner && onDeletePhoto ? (
                  <div className="photo-owner-actions">
                    {onUpdatePhoto ? (
                      <button
                        type="button"
                        className="secondary-button photo-delete-button"
                        onClick={() => startEditingPhoto(photo)}
                        disabled={editingPhotoId === photo.id}
                      >
                        Edit
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="secondary-button photo-delete-button"
                      disabled={deletingPhotoId === photo.id}
                      onClick={async () => {
                        const shouldDelete = window.confirm(
                          'Delete this photo from your gallery uploads?',
                        )
                        if (!shouldDelete) {
                          return
                        }
                        await onDeletePhoto(photo.id)
                      }}
                    >
                      {deletingPhotoId === photo.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                ) : null}
              </div>
              {photo.isOwner && onUpdatePhoto && editingPhotoId === photo.id ? (
                <form
                  className="photo-edit-form"
                  onSubmit={async (event) => {
                    event.preventDefault()
                    await onUpdatePhoto(photo.id, {
                      caption: editingCaption,
                      shareToFeed: editingShareToFeed,
                    })
                    cancelEditingPhoto()
                  }}
                >
                  <label className="field">
                    Caption
                    <input
                      value={editingCaption}
                      onChange={(event) => setEditingCaption(event.target.value)}
                      maxLength={160}
                    />
                  </label>
                  <label className="checkbox-field">
                    <input
                      type="checkbox"
                      checked={editingShareToFeed}
                      onChange={(event) => setEditingShareToFeed(event.target.checked)}
                    />
                    <span>Show in Wedding Feed</span>
                  </label>
                  <div className="photo-owner-actions">
                    <button
                      type="submit"
                      className="secondary-button photo-delete-button"
                      disabled={updatingPhotoId === photo.id}
                    >
                      {updatingPhotoId === photo.id ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      className="secondary-button photo-delete-button"
                      onClick={cancelEditingPhoto}
                      disabled={updatingPhotoId === photo.id}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : null}
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
              <div className="photo-meta-row">
                <p className="muted">Shared by {activePhoto.uploadedBy}</p>
                {activePhoto.isOwner && onDeletePhoto ? (
                  <button
                    type="button"
                    className="secondary-button photo-delete-button"
                    disabled={deletingPhotoId === activePhoto.id}
                    onClick={async () => {
                      const shouldDelete = window.confirm(
                        'Delete this photo from your gallery uploads?',
                      )
                      if (!shouldDelete) {
                        return
                      }
                      await onDeletePhoto(activePhoto.id)
                      setActivePhoto(null)
                    }}
                  >
                    {deletingPhotoId === activePhoto.id ? 'Deleting...' : 'Delete'}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
