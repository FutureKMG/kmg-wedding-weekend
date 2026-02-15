import type { PhotoItem } from '../types'

export function PhotoGrid({ photos }: { photos: PhotoItem[] }) {
  if (photos.length === 0) {
    return <p className="card muted reveal">No photos yet. Be the first to add one.</p>
  }

  return (
    <div className="photo-grid">
      {photos.map((photo) => (
        <figure key={photo.id} className="photo-card reveal">
          <img src={photo.imageUrl} alt={photo.caption ?? 'Wedding moment'} loading="lazy" />
          <figcaption>
            {photo.caption ? <p>{photo.caption}</p> : null}
            <p className="muted">Shared by {photo.uploadedBy}</p>
          </figcaption>
        </figure>
      ))}
    </div>
  )
}
