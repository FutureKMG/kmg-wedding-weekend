import { useState, type FormEvent } from 'react'
import { z } from 'zod'
import { PageIntro } from '../components/PageIntro'
import { apiRequest } from '../lib/apiClient'

const songRequestSchema = z.object({
  songTitle: z.string().trim().min(1, 'Song title is required').max(120),
  artist: z.string().trim().max(120).optional(),
  note: z.string().trim().max(240).optional(),
})

export function SongsPage() {
  const [songTitle, setSongTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess('')

    const parsed = songRequestSchema.safeParse({ songTitle, artist, note })

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid song request')
      return
    }

    try {
      await apiRequest('/api/song-requests', {
        method: 'POST',
        body: JSON.stringify(parsed.data),
      })
      setSongTitle('')
      setArtist('')
      setNote('')
      setSuccess('Request sent to the DJ list.')
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : 'Could not save request'
      setError(message)
    }
  }

  return (
    <section className="stack">
      <PageIntro
        eyebrow="Music"
        title="Song Request"
        description="Share a song to keep the dance floor moving."
      />

      <form className="card stack reveal" onSubmit={handleSubmit}>
        <label className="field">
          Song title
          <input
            value={songTitle}
            onChange={(event) => setSongTitle(event.target.value)}
            required
          />
        </label>

        <label className="field">
          Artist (optional)
          <input value={artist} onChange={(event) => setArtist(event.target.value)} />
        </label>

        <label className="field">
          Note for DJ (optional)
          <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} />
        </label>

        {error && <p className="error-text">{error}</p>}
        {success && <p className="success-text">{success}</p>}

        <button type="submit">Submit Request</button>
      </form>
    </section>
  )
}
