import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DecoDivider } from '../components/DecoDivider'
import { HeroImage } from '../components/HeroImage'
import { apiRequest } from '../lib/apiClient'
import { useAuth } from '../lib/auth'
import type { PhotoItem } from '../types'

export function HomePage() {
  const { guest } = useAuth()
  const [feedPhotos, setFeedPhotos] = useState<PhotoItem[]>([])
  const [feedError, setFeedError] = useState('')

  const loadFeedPhotos = useCallback(async () => {
    try {
      const payload = await apiRequest<{ photos: PhotoItem[] }>('/api/photos?scope=feed')
      setFeedPhotos(payload.photos.slice(0, 18))
      setFeedError('')
    } catch {
      setFeedError('Wedding Feed is loading. Check back in a moment.')
    }
  }, [])

  useEffect(() => {
    const kickoffTimer = window.setTimeout(() => {
      void loadFeedPhotos()
    }, 0)

    const refreshInterval = window.setInterval(() => {
      void loadFeedPhotos()
    }, 15 * 60 * 1000)

    return () => {
      window.clearTimeout(kickoffTimer)
      window.clearInterval(refreshInterval)
    }
  }, [loadFeedPhotos])

  const marqueePhotos = useMemo(() => {
    if (feedPhotos.length === 0) {
      return []
    }
    return [...feedPhotos, ...feedPhotos]
  }, [feedPhotos])

  const shouldAnimateFeed = feedPhotos.length > 1

  return (
    <section className="stack">
      <article className="card home-hero reveal">
        <div className="home-hero-copy">
          <p className="eyebrow">Welcome, {guest?.firstName}</p>
          <h2>Your concierge for the weekend</h2>
          <p className="muted">
            Keep everything in one place: timeline, seating, songs, photos, and local picks.
          </p>
          <DecoDivider />
          <p className="hero-note">Fenway-aligned palette, art deco lines, watercolor calm.</p>
        </div>

        <HeroImage alt="Fenway watercolor scene" className="home-hero-media" />
      </article>

      <article className="card home-feed reveal">
        <div className="home-feed-head">
          <p className="eyebrow">Live Moments</p>
          <h3>Wedding Feed is Playing</h3>
          <p className="muted">A continuous stream of guest highlights from the weekend.</p>
        </div>

        {feedPhotos.length > 0 ? (
          <div className="home-feed-marquee" aria-label="Wedding Feed carousel">
            <div
              className={
                shouldAnimateFeed
                  ? 'home-feed-track home-feed-track-animated'
                  : 'home-feed-track'
              }
            >
              {marqueePhotos.map((photo, index) => (
                <Link
                  key={`${photo.id}-${index}`}
                  to="/gallery"
                  className="home-feed-photo"
                  aria-label={`View photo shared by ${photo.uploadedBy} in the gallery`}
                >
                  <img
                    src={photo.imageUrl}
                    alt={photo.caption ?? 'Wedding moment'}
                    loading="lazy"
                  />
                  <span className="home-feed-credit">{photo.uploadedBy}</span>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="home-feed-empty">
            <p className="muted">
              {feedError || 'No feed photos yet. Upload one from Gallery to start the live reel.'}
            </p>
            <Link to="/gallery" className="inline-link">
              Open Gallery
            </Link>
          </div>
        )}
      </article>

      <div className="quick-grid">
        <Link to="/timeline" className="card quick-link reveal">
          <p className="eyebrow">Now & Next</p>
          <h3>Wedding Timeline</h3>
          <p className="muted">See what is happening now and what is coming up next.</p>
        </Link>
        <Link to="/guide" className="card quick-link reveal">
          <p className="eyebrow">Around Town</p>
          <h3>Local Guide</h3>
          <p className="muted">Curated Dunedin and Tampa recommendations for guests.</p>
        </Link>
        <Link to="/seating" className="card quick-link reveal">
          <p className="eyebrow">Reception</p>
          <h3>Seating</h3>
          <p className="muted">Find your table assignment quickly.</p>
        </Link>
        <Link to="/songs" className="card quick-link reveal">
          <p className="eyebrow">Dance Floor</p>
          <h3>Song Requests</h3>
          <p className="muted">Share a song for the DJ list.</p>
        </Link>
        <Link to="/gallery" className="card quick-link reveal">
          <p className="eyebrow">Memories</p>
          <h3>Wedding Feed & Gallery</h3>
          <p className="muted">Post to the feed or browse every photo from the weekend.</p>
        </Link>
      </div>
    </section>
  )
}
