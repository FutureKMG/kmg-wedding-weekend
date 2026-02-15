import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { createClient } from '@supabase/supabase-js'
import { apiRequest } from '../lib/apiClient'
import { PhotoGrid } from '../components/PhotoGrid'
import type { PhotoItem } from '../types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const supabaseClient =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null

export function GalleryPage() {
  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const [caption, setCaption] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  const canUpload = useMemo(() => Boolean(supabaseClient), [])

  useEffect(() => {
    void loadPhotos()
  }, [])

  async function loadPhotos() {
    try {
      const payload = await apiRequest<{ photos: PhotoItem[] }>('/api/photos')
      setPhotos(payload.photos)
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : 'Could not load gallery'
      setError(message)
    }
  }

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
        body: JSON.stringify({ path: uploadPayload.path, caption }),
      })

      setCaption('')
      setFile(null)
      await loadPhotos()
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : 'Could not upload photo'
      setError(message)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <section className="stack">
      <article className="card">
        <h2>Photo Gallery</h2>
        <p className="muted">Upload your photos to the shared weekend gallery.</p>
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

      <PhotoGrid photos={photos} />
    </section>
  )
}
