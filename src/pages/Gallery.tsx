import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { createClient } from '@supabase/supabase-js'
import { PageIntro } from '../components/PageIntro'
import { PhotoGrid } from '../components/PhotoGrid'
import { apiRequest } from '../lib/apiClient'
import type { PhotoItem } from '../types'

type GalleryScope = 'feed' | 'all'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const photoBucketName = import.meta.env.VITE_PHOTO_BUCKET_NAME ?? 'wedding-photos'

const supabaseClient =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null

export function GalleryPage() {
  const [feedPhotos, setFeedPhotos] = useState<PhotoItem[]>([])
  const [allPhotos, setAllPhotos] = useState<PhotoItem[]>([])
  const [activeScope, setActiveScope] = useState<GalleryScope>('feed')
  const [caption, setCaption] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [shareToFeed, setShareToFeed] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null)
  const [updatingPhotoId, setUpdatingPhotoId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

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

    if (files.length === 0) {
      setError('Please choose one or more photos to upload.')
      return
    }

    if (!supabaseClient) {
      setError('Missing Supabase public environment variables for upload.')
      return
    }

    setError('')
    setSuccessMessage('')
    setIsUploading(true)

    try {
      let completedUploads = 0
      const failedUploads: string[] = []

      for (const selectedFile of files) {
        try {
          const uploadPayload = await apiRequest<{
            path: string
            token: string
          }>('/api/photos/upload-url', {
            method: 'POST',
            body: JSON.stringify({ filename: selectedFile.name }),
          })

          const { error: uploadError } = await supabaseClient.storage
            .from(photoBucketName)
            .uploadToSignedUrl(uploadPayload.path, uploadPayload.token, selectedFile, {
              contentType: selectedFile.type,
              upsert: false,
            })

          if (uploadError) {
            throw new Error(uploadError.message)
          }

          await apiRequest('/api/photos/complete', {
            method: 'POST',
            body: JSON.stringify({ path: uploadPayload.path, caption, shareToFeed }),
          })

          completedUploads += 1
        } catch {
          failedUploads.push(selectedFile.name)
        }
      }

      setCaption('')
      setFiles([])
      setShareToFeed(true)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      await loadPhotoCollections()

      if (failedUploads.length > 0) {
        setError(
          `Uploaded ${completedUploads} of ${files.length} photos. Failed: ${failedUploads.join(', ')}`,
        )
      } else {
        setSuccessMessage(
          files.length === 1
            ? 'Photo uploaded successfully.'
            : `${files.length} photos uploaded successfully.`,
        )
      }
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : 'Could not upload photo'
      setError(message)
    } finally {
      setIsUploading(false)
    }
  }

  async function handleDeletePhoto(photoId: string) {
    setError('')
    setSuccessMessage('')
    setDeletingPhotoId(photoId)

    try {
      await apiRequest('/api/photos/delete', {
        method: 'POST',
        body: JSON.stringify({ photoId }),
      })
      await loadPhotoCollections()
      setSuccessMessage('Photo deleted.')
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : 'Could not delete photo'
      setError(message)
    } finally {
      setDeletingPhotoId(null)
    }
  }

  async function handleUpdatePhoto(
    photoId: string,
    payload: { caption: string; shareToFeed: boolean },
  ) {
    setError('')
    setSuccessMessage('')
    setUpdatingPhotoId(photoId)

    try {
      await apiRequest('/api/photos/update', {
        method: 'POST',
        body: JSON.stringify({
          photoId,
          caption: payload.caption,
          shareToFeed: payload.shareToFeed,
        }),
      })
      await loadPhotoCollections()
      setSuccessMessage('Photo updated.')
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : 'Could not update photo'
      setError(message)
    } finally {
      setUpdatingPhotoId(null)
    }
  }

  const visiblePhotos = activeScope === 'feed' ? feedPhotos : allPhotos

  return (
    <section className="stack">
      <PageIntro
        eyebrow="Memories"
        title="Wedding Feed & Full Gallery"
        description="Wedding Feed shows guest-shared highlights. Full Gallery includes every upload."
      />

      <form className="card stack reveal" onSubmit={handleUpload}>
        <label className="field">
          Add caption (optional)
          <input value={caption} onChange={(event) => setCaption(event.target.value)} />
        </label>

        <label className="field">
          Choose photo
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
          />
        </label>

        {files.length > 0 ? (
          <p className="muted small-text">
            {files.length} {files.length === 1 ? 'photo selected' : 'photos selected'}
          </p>
        ) : null}

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
        {successMessage && <p className="success-text">{successMessage}</p>}

        <button type="submit" disabled={isUploading || !canUpload}>
          {isUploading
            ? `Uploading ${files.length} ${files.length === 1 ? 'photo' : 'photos'}...`
            : files.length > 1
              ? `Upload ${files.length} Photos`
              : 'Upload Photo'}
        </button>
      </form>

      <div className="gallery-tabs reveal" role="tablist" aria-label="Photo views">
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

      <PhotoGrid
        photos={visiblePhotos}
        deletingPhotoId={deletingPhotoId}
        updatingPhotoId={updatingPhotoId}
        onDeletePhoto={handleDeletePhoto}
        onUpdatePhoto={handleUpdatePhoto}
      />
    </section>
  )
}
