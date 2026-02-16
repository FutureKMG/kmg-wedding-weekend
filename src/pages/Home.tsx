import { formatDistanceToNow } from 'date-fns'
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { DecoDivider } from '../components/DecoDivider'
import { apiRequest } from '../lib/apiClient'
import { useAuth } from '../lib/auth'
import type { FeedUpdate, PhotoItem } from '../types'

const tampaWeatherUrl =
  'https://api.open-meteo.com/v1/forecast?latitude=27.9506&longitude=-82.4572&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,is_day&daily=temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America%2FNew_York&forecast_days=1'

const fenwayUberUrl = (() => {
  const params = new URLSearchParams({
    action: 'setPickup',
    pickup: 'my_location',
    'dropoff[formatted_address]': 'Fenway Hotel 453 Edgewater Dr Dunedin FL 34698',
    'dropoff[nickname]': 'Fenway Hotel',
  })
  return `https://m.uber.com/ul/?${params.toString()}`
})()

function weatherLabel(code: number, isDay: number): string {
  if (code === 0) {
    return isDay ? 'Clear skies' : 'Clear night'
  }
  if (code === 1 || code === 2 || code === 3) {
    return 'Partly cloudy'
  }
  if (code === 45 || code === 48) {
    return 'Fog'
  }
  if ([51, 53, 55, 56, 57].includes(code)) {
    return 'Drizzle'
  }
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return 'Rain showers'
  }
  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return 'Snow'
  }
  if ([95, 96, 99].includes(code)) {
    return 'Thunderstorms'
  }

  return 'Changing weather'
}

type TampaWeather = {
  tempF: number
  feelsLikeF: number
  windMph: number
  highF: number
  lowF: number
  condition: string
}

export function HomePage() {
  const { guest } = useAuth()
  const [feedPhotos, setFeedPhotos] = useState<PhotoItem[]>([])
  const [feedUpdates, setFeedUpdates] = useState<FeedUpdate[]>([])
  const [feedError, setFeedError] = useState('')
  const [updateDraft, setUpdateDraft] = useState('')
  const [updateError, setUpdateError] = useState('')
  const [isPostingUpdate, setIsPostingUpdate] = useState(false)
  const [weather, setWeather] = useState<TampaWeather | null>(null)
  const [weatherError, setWeatherError] = useState('')

  const loadWeddingFeed = useCallback(async () => {
    try {
      const [photoPayload, updatePayload] = await Promise.all([
        apiRequest<{ photos: PhotoItem[] }>('/api/photos?scope=feed'),
        apiRequest<{ updates: FeedUpdate[]; migrationRequired?: boolean }>('/api/feed-updates?limit=12'),
      ])
      setFeedPhotos(photoPayload.photos.slice(0, 18))
      setFeedUpdates(updatePayload.updates)
      setFeedError('')
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : 'Wedding Feed is loading. Check back in a moment.'
      setFeedError(message)
    }
  }, [])

  const loadWeather = useCallback(async () => {
    try {
      const response = await fetch(tampaWeatherUrl, { cache: 'no-store' })
      if (!response.ok) {
        throw new Error('Could not load Tampa weather')
      }

      const payload = (await response.json()) as {
        current?: {
          temperature_2m?: number
          apparent_temperature?: number
          weather_code?: number
          wind_speed_10m?: number
          is_day?: number
        }
        daily?: {
          temperature_2m_max?: number[]
          temperature_2m_min?: number[]
        }
      }

      if (!payload.current || payload.current.temperature_2m === undefined) {
        throw new Error('Weather data is unavailable')
      }

      setWeather({
        tempF: Math.round(payload.current.temperature_2m),
        feelsLikeF: Math.round(payload.current.apparent_temperature ?? payload.current.temperature_2m),
        windMph: Math.round(payload.current.wind_speed_10m ?? 0),
        highF: Math.round(payload.daily?.temperature_2m_max?.[0] ?? payload.current.temperature_2m),
        lowF: Math.round(payload.daily?.temperature_2m_min?.[0] ?? payload.current.temperature_2m),
        condition: weatherLabel(payload.current.weather_code ?? -1, payload.current.is_day ?? 1),
      })
      setWeatherError('')
    } catch {
      setWeatherError('Weather is temporarily unavailable.')
    }
  }, [])

  useEffect(() => {
    const startup = window.setTimeout(() => {
      void loadWeddingFeed()
      void loadWeather()
    }, 0)

    const feedRefresh = window.setInterval(() => {
      void loadWeddingFeed()
    }, 5 * 60 * 1000)

    return () => {
      window.clearTimeout(startup)
      window.clearInterval(feedRefresh)
    }
  }, [loadWeddingFeed, loadWeather])

  useEffect(() => {
    const weatherRefresh = window.setInterval(() => {
      void loadWeather()
    }, 20 * 60 * 1000)

    return () => {
      window.clearInterval(weatherRefresh)
    }
  }, [loadWeather])

  const marqueePhotos = useMemo(() => {
    if (feedPhotos.length === 0) {
      return []
    }
    return [...feedPhotos, ...feedPhotos]
  }, [feedPhotos])

  const shouldAnimateFeed = feedPhotos.length > 1

  async function handlePostUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const message = updateDraft.trim()

    if (!message) {
      setUpdateError('Write a quick update before posting.')
      return
    }

    setUpdateError('')
    setIsPostingUpdate(true)

    try {
      await apiRequest('/api/feed-updates', {
        method: 'POST',
        body: JSON.stringify({ message }),
      })
      setUpdateDraft('')
      await loadWeddingFeed()
    } catch (requestError) {
      const messageText =
        requestError instanceof Error ? requestError.message : 'Could not post update'
      setUpdateError(messageText)
    } finally {
      setIsPostingUpdate(false)
    }
  }

  return (
    <section className="stack">
      <article className="card home-hero home-hero-cigar reveal">
        <div className="home-hero-copy">
          <p className="eyebrow">Welcome, {guest?.firstName}</p>
          <h2>Your storybook weekend lounge</h2>
          <p className="muted">
            A romantic cathedral-meets-cigar-lounge mood with stained-glass glow, warm brick, and
            everything guests need in one place.
          </p>
          <DecoDivider />
          <p className="hero-note">
            Candlelit corners, stained glass, and fairytale Florida nights.
          </p>
        </div>

        <div className="home-cigar-media-grid">
          <picture className="home-cigar-media home-cigar-media-hero">
            <source
              media="(max-width: 680px)"
              srcSet="/theme/home-lounge-hero-mobile.avif"
              type="image/avif"
            />
            <source
              media="(max-width: 680px)"
              srcSet="/theme/home-lounge-hero-mobile.webp"
              type="image/webp"
            />
            <source srcSet="/theme/home-lounge-hero.avif" type="image/avif" />
            <source srcSet="/theme/home-lounge-hero.webp" type="image/webp" />
            <img src="/theme/home-lounge-hero.png" alt="Stained glass lounge portrait" />
          </picture>
          <picture className="home-cigar-media">
            <source
              media="(max-width: 680px)"
              srcSet="/theme/home-lounge-portrait-one-mobile.avif"
              type="image/avif"
            />
            <source
              media="(max-width: 680px)"
              srcSet="/theme/home-lounge-portrait-one-mobile.webp"
              type="image/webp"
            />
            <source srcSet="/theme/home-lounge-portrait-one.avif" type="image/avif" />
            <source srcSet="/theme/home-lounge-portrait-one.webp" type="image/webp" />
            <img src="/theme/home-lounge-portrait-one.png" alt="Cigar lounge portrait" />
          </picture>
          <picture className="home-cigar-media">
            <source
              media="(max-width: 680px)"
              srcSet="/theme/home-lounge-portrait-two-mobile.avif"
              type="image/avif"
            />
            <source
              media="(max-width: 680px)"
              srcSet="/theme/home-lounge-portrait-two-mobile.webp"
              type="image/webp"
            />
            <source srcSet="/theme/home-lounge-portrait-two.avif" type="image/avif" />
            <source srcSet="/theme/home-lounge-portrait-two.webp" type="image/webp" />
            <img src="/theme/home-lounge-portrait-two.png" alt="Warm brick lounge portrait" />
          </picture>
        </div>
      </article>

      <div className="home-utility-grid">
        <article className="card reveal">
          <p className="eyebrow">Live Weather</p>
          <h3>Tampa Right Now</h3>
          {weather ? (
            <div className="home-weather-meta">
              <p className="home-weather-temp">{weather.tempF}°F</p>
              <p className="muted">{weather.condition}</p>
              <p className="muted">
                Feels like {weather.feelsLikeF}° • H {weather.highF}° / L {weather.lowF}° • Wind{' '}
                {weather.windMph} mph
              </p>
            </div>
          ) : (
            <p className="muted">{weatherError || 'Loading current weather...'}</p>
          )}
        </article>

        <article className="card reveal">
          <p className="eyebrow">Ride Ready</p>
          <h3>Request an Uber</h3>
          <p className="muted">
            One tap to open Uber with pickup at your location and destination set to Fenway Hotel.
          </p>
          <a className="button-link" href={fenwayUberUrl} target="_blank" rel="noreferrer">
            Open Uber
          </a>
        </article>
      </div>

      <article className="card home-feed reveal">
        <div className="home-feed-head">
          <p className="eyebrow">Live Moments</p>
          <h3>Wedding Feed: Photos + Notes</h3>
          <p className="muted">
            See shared memories and quick text updates from guests across the weekend.
          </p>
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

        <div className="home-feed-updates">
          <form className="card stack" onSubmit={handlePostUpdate}>
            <label className="field">
              Share a quick update
              <textarea
                value={updateDraft}
                onChange={(event) => setUpdateDraft(event.target.value)}
                maxLength={280}
                placeholder="Example: We just arrived at cocktail hour and it looks incredible."
              />
            </label>
            <p className="muted small-text">{updateDraft.trim().length}/280</p>
            {updateError ? <p className="error-text">{updateError}</p> : null}
            <button type="submit" disabled={isPostingUpdate}>
              {isPostingUpdate ? 'Posting...' : 'Post Update'}
            </button>
          </form>

          <article className="card home-text-feed-card">
            <p className="eyebrow">Text Updates</p>
            {feedUpdates.length === 0 ? (
              <p className="muted">
                {feedError || 'No text updates yet. Be the first to post one.'}
              </p>
            ) : (
              <div className="home-text-feed-list">
                {feedUpdates.map((update) => (
                  <article key={update.id} className="home-text-feed-item">
                    <p>{update.message}</p>
                    <p className="muted small-text">
                      {update.postedBy} •{' '}
                      {formatDistanceToNow(new Date(update.createdAt), { addSuffix: true })}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </article>
        </div>
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
