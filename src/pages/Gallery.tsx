import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { createClient } from '@supabase/supabase-js'
import { apiRequest } from '../lib/apiClient'
import { PhotoGrid } from '../components/PhotoGrid'
import type { PhotoItem } from '../types'

type GalleryScope = 'feed' | 'all'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const supabaseClient =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null

export function GalleryPage() {
  const [feedPhotos, setFeedPhotos] = useState<PhotoItem[]>([])
  const [allPhotos, setAllPhotos] = useState<PhotoItem[]>([])
  const [activeScope, setActiveScope] = useState<GalleryScope>('feed')
  const [caption, setCaption] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [shareToFeed, setShareToFeed] = useState(true)
  const [error, setError] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  const canUpload = useMemo(() => Boolean(supabaseClient), [])

  const loadPhotoCollections = useCallback(async () => {
    try {
      setError('')
      const [feedPayload, allPayload] = await Promise.all([
        apiRequest<{ photos: PhotoItem[] }>('/api/photos?scope=feed'),
        apiRequest<{ photos: PhotoItem[] }>('/api/photos?scope=all'),
      ])
      setFeedPhotos(feedPayload.photos)
      setAllPhotos(allPayload.photos)
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : 'Could not load gallery'
      setError(message)
    }
  }, [])

  useEffect(() => {
    void loadPhotoCollections()
  }, [loadPhotoCollections])

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!file) {
      setError('Please choose a photo to upload.')
      return
    }

    if (!supabaseClient) {
      setError('Missing Supabase public environment variables for upload.')
      return
    }

    setError('')
    setIsUploading(true)

    try {
      const uploadPayload = await apiRequest<{
        path: string
        token: string
      }>('/api/photos/upload-url', {
        method: 'POST',
        body: JSON.stringify({ filename: file.name }),
      })

      const { error: uploadError } = await supabaseClient.storage
        .from('wedding-photos')
        .uploadToSignedUrl(uploadPayload.path, uploadPayload.token, file, {
          contentType: file.type,
          upsert: false,
        })

      if (uploadError) {
        throw new Error(uploadError.message)
      }

      await apiRequest('/api/photos/complete', {
        method: 'POST',
        body: JSON.stringify({ path: uploadPayload.path, caption, shareToFeed }),
      })

      setCaption('')
      setFile(null)
      setShareToFeed(true)
      await loadPhotoCollections()
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : 'Could not upload photo'
      setError(message)
    } finally {
      setIsUploading(false)
    }
  }

  const visiblePhotos = activeScope === 'feed' ? feedPhotos : allPhotos

  return (
    <section className="stack">
      <article className="card">
        <h2>Wedding Feed & Full Gallery</h2>
        <p className="muted">
          Wedding Feed shows guest-shared highlights. Full Gallery includes every upload.
        </p>
      </article>

      <form className="card stack" onSubmit={handleUpload}>
        <label className="field">
          Add caption (optional)
          <input value={caption} onChange={(event) => setCaption(event.target.value)} />
        </label>

        <label className="field">
          Choose photo
          <input
            type="file"
            accept="image/*"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </label>

        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={shareToFeed}
            onChange={(event) => setShareToFeed(event.target.checked)}
          />
          <span>Share with everyone & post on the wedding feed?</span>
        </label>

        <p className="muted small-text">
          Yes: photo appears in Wedding Feed and Full Gallery. No: photo appears only in Full Gallery.
        </p>

        {!canUpload && (
          <p className="error-text">
            Uploading requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
          </p>
        )}

        {error && <p className="error-text">{error}</p>}

        <button type="submit" disabled={isUploading || !canUpload}>
          {isUploading ? 'Uploading...' : 'Upload Photo'}
        </button>
      </form>

      <div className="gallery-tabs" role="tablist" aria-label="Photo views">
        <button
          type="button"
          className={activeScope === 'feed' ? 'gallery-tab gallery-tab-active' : 'gallery-tab'}
          onClick={() => setActiveScope('feed')}
          aria-selected={activeScope === 'feed'}
        >
          Wedding Feed ({feedPhotos.length})
        </button>
        <button
          type="button"
          className={activeScope === 'all' ? 'gallery-tab gallery-tab-active' : 'gallery-tab'}
          onClick={() => setActiveScope('all')}
          aria-selected={activeScope === 'all'}
        >
          Full Gallery ({allPhotos.length})
        </button>
      </div>

      <PhotoGrid photos={visiblePhotos} />
    </section>
  )
}
