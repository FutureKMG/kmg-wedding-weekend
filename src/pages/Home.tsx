import { formatDistanceToNow } from 'date-fns'
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { DecoDivider } from '../components/DecoDivider'
import { mergeDashboardText } from '../content/dashboardText'
import { apiRequest } from '../lib/apiClient'
import { useAuth } from '../lib/auth'
import type { FeedUpdate, FlightDetail, PhotoItem } from '../types'

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

const flightTrackerUrl = 'https://www.flightaware.com/live/'

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

type FlightFormState = {
  arrivalAirport: 'TPA' | 'PIE'
  arrivalTime: string
  airline: string
  flightNumber: string
  notes: string
}

function toLocalDateTimeInput(isoTimestamp: string | null | undefined): string {
  if (!isoTimestamp) {
    return ''
  }

  const date = new Date(isoTimestamp)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const pad = (value: number) => String(value).padStart(2, '0')

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function mapFlightDetailToForm(detail: FlightDetail | null): FlightFormState {
  return {
    arrivalAirport: detail?.arrivalAirport ?? 'TPA',
    arrivalTime: toLocalDateTimeInput(detail?.arrivalTime),
    airline: detail?.airline ?? '',
    flightNumber: detail?.flightNumber ?? '',
    notes: detail?.notes ?? '',
  }
}

export function HomePage() {
  const { guest } = useAuth()
  const [feedPhotos, setFeedPhotos] = useState<PhotoItem[]>([])
  const [feedUpdates, setFeedUpdates] = useState<FeedUpdate[]>([])
  const [feedError, setFeedError] = useState('')
  const [contentOverrides, setContentOverrides] = useState<Record<string, string>>({})
  const [updateDraft, setUpdateDraft] = useState('')
  const [updateError, setUpdateError] = useState('')
  const [isPostingUpdate, setIsPostingUpdate] = useState(false)
  const [editingUpdateId, setEditingUpdateId] = useState<string | null>(null)
  const [editingUpdateDraft, setEditingUpdateDraft] = useState('')
  const [updatingUpdateId, setUpdatingUpdateId] = useState<string | null>(null)
  const [deletingUpdateId, setDeletingUpdateId] = useState<string | null>(null)
  const [weather, setWeather] = useState<TampaWeather | null>(null)
  const [weatherError, setWeatherError] = useState('')
  const [flightDetail, setFlightDetail] = useState<FlightDetail | null>(null)
  const [flightForm, setFlightForm] = useState<FlightFormState>({
    arrivalAirport: 'TPA',
    arrivalTime: '',
    airline: '',
    flightNumber: '',
    notes: '',
  })
  const [flightError, setFlightError] = useState('')
  const [flightSuccess, setFlightSuccess] = useState('')
  const [isLoadingFlight, setIsLoadingFlight] = useState(true)
  const [isSavingFlight, setIsSavingFlight] = useState(false)

  const text = useMemo(() => mergeDashboardText(contentOverrides), [contentOverrides])

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

  const loadFlightDetails = useCallback(async () => {
    setIsLoadingFlight(true)

    try {
      const payload = await apiRequest<{ detail: FlightDetail | null; migrationRequired?: boolean }>(
        '/api/flight-details',
      )

      if (payload.migrationRequired) {
        setFlightError('Flight details are not enabled yet. Ask Kara to run the latest migration.')
        setFlightDetail(null)
        setFlightForm(mapFlightDetailToForm(null))
      } else {
        setFlightError('')
        setFlightDetail(payload.detail)
        setFlightForm(mapFlightDetailToForm(payload.detail))
      }
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : 'Could not load your flight details'
      setFlightError(message)
      setFlightDetail(null)
      setFlightForm(mapFlightDetailToForm(null))
    } finally {
      setIsLoadingFlight(false)
    }
  }, [])

  useEffect(() => {
    async function loadContentText() {
      try {
        const payload = await apiRequest<{ content: Record<string, string> }>('/api/content-text')
        setContentOverrides(payload.content ?? {})
      } catch {
        setContentOverrides({})
      }
    }

    void loadContentText()
  }, [])

  useEffect(() => {
    const startup = window.setTimeout(() => {
      void loadWeddingFeed()
      void loadWeather()
      void loadFlightDetails()
    }, 0)

    const feedRefresh = window.setInterval(() => {
      void loadWeddingFeed()
    }, 5 * 60 * 1000)

    return () => {
      window.clearTimeout(startup)
      window.clearInterval(feedRefresh)
    }
  }, [loadWeddingFeed, loadWeather, loadFlightDetails])

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
      setEditingUpdateId(null)
      setEditingUpdateDraft('')
      await loadWeddingFeed()
    } catch (requestError) {
      const messageText =
        requestError instanceof Error ? requestError.message : 'Could not post update'
      setUpdateError(messageText)
    } finally {
      setIsPostingUpdate(false)
    }
  }

  function startEditingUpdate(update: FeedUpdate) {
    setUpdateError('')
    setEditingUpdateId(update.id)
    setEditingUpdateDraft(update.message)
  }

  function cancelEditingUpdate() {
    setEditingUpdateId(null)
    setEditingUpdateDraft('')
  }

  async function handleSaveUpdate(updateId: string) {
    const message = editingUpdateDraft.trim()
    if (!message) {
      setUpdateError('Update text cannot be empty.')
      return
    }

    setUpdateError('')
    setUpdatingUpdateId(updateId)

    try {
      await apiRequest('/api/feed-updates/update', {
        method: 'POST',
        body: JSON.stringify({ updateId, message }),
      })
      cancelEditingUpdate()
      await loadWeddingFeed()
    } catch (requestError) {
      const messageText =
        requestError instanceof Error ? requestError.message : 'Could not save update'
      setUpdateError(messageText)
    } finally {
      setUpdatingUpdateId(null)
    }
  }

  async function handleDeleteUpdate(updateId: string) {
    const shouldDelete = window.confirm('Delete this feed update?')
    if (!shouldDelete) {
      return
    }

    setUpdateError('')
    setDeletingUpdateId(updateId)

    try {
      await apiRequest('/api/feed-updates/delete', {
        method: 'POST',
        body: JSON.stringify({ updateId }),
      })
      if (editingUpdateId === updateId) {
        cancelEditingUpdate()
      }
      await loadWeddingFeed()
    } catch (requestError) {
      const messageText =
        requestError instanceof Error ? requestError.message : 'Could not delete update'
      setUpdateError(messageText)
    } finally {
      setDeletingUpdateId(null)
    }
  }

  async function handleSaveFlightDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFlightError('')
    setFlightSuccess('')

    const rawArrivalTime = flightForm.arrivalTime.trim()
    if (!rawArrivalTime) {
      setFlightError('Please add your arrival date and time.')
      return
    }

    const arrivalDate = new Date(rawArrivalTime)
    if (Number.isNaN(arrivalDate.getTime())) {
      setFlightError('Arrival date and time is invalid.')
      return
    }

    setIsSavingFlight(true)

    try {
      const payload = await apiRequest<{ detail: FlightDetail; migrationRequired?: boolean }>(
        '/api/flight-details',
        {
          method: 'POST',
          body: JSON.stringify({
            arrivalAirport: flightForm.arrivalAirport,
            arrivalTime: arrivalDate.toISOString(),
            airline: flightForm.airline,
            flightNumber: flightForm.flightNumber,
            notes: flightForm.notes,
          }),
        },
      )

      setFlightDetail(payload.detail)
      setFlightForm(mapFlightDetailToForm(payload.detail))
      setFlightSuccess('Flight details saved.')
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : 'Could not save flight details'
      setFlightError(message)
    } finally {
      setIsSavingFlight(false)
    }
  }

  return (
    <section className="stack">
      <article className="card home-hero home-hero-cigar reveal">
        <div className="home-hero-copy home-hero-copy-centered">
          <p className="eyebrow">The Gilmore Wedding Weekend</p>
          <p className="hero-accent-line">March 13-15 · Tampa, Florida</p>
          <h2>Welcome, {guest?.firstName ?? 'Guest'}.</h2>
          <p className="hero-subheadline">{text['home.hero.title']}</p>
          <DecoDivider />
          <p className="muted hero-supporting">{text['home.hero.body']}</p>
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
          <p className="eyebrow">{text['home.weather.eyebrow']}</p>
          <h3>{text['home.weather.title']}</h3>
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
          <p className="eyebrow">{text['home.uber.eyebrow']}</p>
          <h3>{text['home.uber.title']}</h3>
          <p className="muted">{text['home.uber.body']}</p>
          <a className="button-link" href={fenwayUberUrl} target="_blank" rel="noreferrer">
            {text['home.uber.button']}
          </a>
        </article>

        <article className="card reveal flight-hub-card">
          <p className="eyebrow">{text['home.flight.eyebrow']}</p>
          <h3>{text['home.flight.title']}</h3>
          <p className="muted">{text['home.flight.body']}</p>
          <p className="flight-airports-label">Closest Airports</p>
          <ul className="flight-airports-list">
            <li>{text['home.flight.airportOne']}</li>
            <li>{text['home.flight.airportTwo']}</li>
          </ul>

          <form className="stack flight-form" onSubmit={handleSaveFlightDetails}>
            <label className="field">
              Arrival Airport
              <select
                value={flightForm.arrivalAirport}
                onChange={(event) => {
                  const value = event.target.value === 'PIE' ? 'PIE' : 'TPA'
                  setFlightForm((current) => ({ ...current, arrivalAirport: value }))
                  setFlightError('')
                  setFlightSuccess('')
                }}
              >
                <option value="TPA">Tampa International (TPA)</option>
                <option value="PIE">St. Pete-Clearwater (PIE)</option>
              </select>
            </label>

            <label className="field">
              Arrival Date & Time
              <input
                type="datetime-local"
                value={flightForm.arrivalTime}
                onChange={(event) => {
                  setFlightForm((current) => ({ ...current, arrivalTime: event.target.value }))
                  setFlightError('')
                  setFlightSuccess('')
                }}
                required
              />
            </label>

            <label className="field">
              Airline (optional)
              <input
                value={flightForm.airline}
                onChange={(event) => {
                  setFlightForm((current) => ({ ...current, airline: event.target.value }))
                }}
                maxLength={80}
                placeholder="Delta, United, Southwest..."
              />
            </label>

            <label className="field">
              Flight Number (optional)
              <input
                value={flightForm.flightNumber}
                onChange={(event) => {
                  setFlightForm((current) => ({ ...current, flightNumber: event.target.value }))
                }}
                maxLength={24}
                placeholder="DL 1234"
              />
            </label>

            <label className="field">
              Notes (optional)
              <textarea
                value={flightForm.notes}
                onChange={(event) => {
                  setFlightForm((current) => ({ ...current, notes: event.target.value }))
                }}
                maxLength={280}
                placeholder="Share any pickup notes or arrival updates."
              />
            </label>

            {isLoadingFlight ? <p className="muted small-text">Loading your saved flight details...</p> : null}
            {flightDetail ? (
              <p className="muted small-text">
                Last saved {formatDistanceToNow(new Date(flightDetail.updatedAt), { addSuffix: true })}
              </p>
            ) : null}
            {flightError ? <p className="error-text">{flightError}</p> : null}
            {flightSuccess ? <p className="success-text">{flightSuccess}</p> : null}

            <button type="submit" disabled={isSavingFlight || isLoadingFlight}>
              {isSavingFlight ? 'Saving...' : 'Save Flight Details'}
            </button>
          </form>

          <div className="button-row">
            <a className="button-link secondary-button-link" href={flightTrackerUrl} target="_blank" rel="noreferrer">
              {text['home.flight.buttonPrimary']}
            </a>
            <Link className="button-link secondary-button-link" to="/guide">
              {text['home.flight.buttonSecondary']}
            </Link>
          </div>
        </article>
      </div>

      <article className="card home-feed reveal">
        <div className="home-feed-head">
          <p className="eyebrow">{text['home.feed.eyebrow']}</p>
          <h3>{text['home.feed.title']}</h3>
          <p className="muted">{text['home.feed.body']}</p>
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
              {feedError || text['home.feed.empty']}
            </p>
            <Link to="/gallery" className="inline-link">
              Open Gallery
            </Link>
          </div>
        )}

        <div className="home-feed-updates">
          <form className="card stack" onSubmit={handlePostUpdate}>
            <label className="field">
              {text['home.feed.postLabel']}
              <textarea
                value={updateDraft}
                onChange={(event) => setUpdateDraft(event.target.value)}
                maxLength={280}
                placeholder={text['home.feed.postPlaceholder']}
              />
            </label>
            <p className="muted small-text">{updateDraft.trim().length}/280</p>
            {updateError ? <p className="error-text">{updateError}</p> : null}
            <button type="submit" disabled={isPostingUpdate}>
              {isPostingUpdate ? 'Posting...' : text['home.feed.postButton']}
            </button>
          </form>

          <article className="card home-text-feed-card">
            <p className="eyebrow">Text Updates</p>
            {feedUpdates.length === 0 ? (
              <p className="muted">
                {feedError || text['home.feed.noTextUpdates']}
              </p>
            ) : (
              <div className="home-text-feed-list">
                {feedUpdates.map((update) => (
                  <article key={update.id} className="home-text-feed-item">
                    {editingUpdateId === update.id ? (
                      <label className="field">
                        Edit your update
                        <textarea
                          value={editingUpdateDraft}
                          onChange={(event) => setEditingUpdateDraft(event.target.value)}
                          maxLength={280}
                        />
                      </label>
                    ) : (
                      <p>{update.message}</p>
                    )}
                    <p className="muted small-text">
                      {update.postedBy} •{' '}
                      {formatDistanceToNow(new Date(update.createdAt), { addSuffix: true })}
                    </p>
                    {update.isOwner ? (
                      <div className="feed-update-actions">
                        {editingUpdateId === update.id ? (
                          <>
                            <button
                              type="button"
                              className="secondary-button"
                              disabled={updatingUpdateId === update.id}
                              onClick={() => void handleSaveUpdate(update.id)}
                            >
                              {updatingUpdateId === update.id ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              type="button"
                              className="secondary-button"
                              disabled={updatingUpdateId === update.id}
                              onClick={cancelEditingUpdate}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() => startEditingUpdate(update)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="secondary-button"
                              disabled={deletingUpdateId === update.id}
                              onClick={() => void handleDeleteUpdate(update.id)}
                            >
                              {deletingUpdateId === update.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </>
                        )}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </article>
        </div>
      </article>

      <div className="quick-grid">
        <Link to="/timeline" className="card quick-link reveal">
          <p className="eyebrow">{text['home.quick.timeline.eyebrow']}</p>
          <h3>{text['home.quick.timeline.title']}</h3>
          <p className="muted">{text['home.quick.timeline.body']}</p>
        </Link>
        <Link to="/guide" className="card quick-link reveal">
          <p className="eyebrow">{text['home.quick.guide.eyebrow']}</p>
          <h3>{text['home.quick.guide.title']}</h3>
          <p className="muted">{text['home.quick.guide.body']}</p>
        </Link>
        <Link to="/seating" className="card quick-link reveal">
          <p className="eyebrow">{text['home.quick.seating.eyebrow']}</p>
          <h3>{text['home.quick.seating.title']}</h3>
          <p className="muted">{text['home.quick.seating.body']}</p>
        </Link>
        <Link to="/songs" className="card quick-link reveal">
          <p className="eyebrow">{text['home.quick.songs.eyebrow']}</p>
          <h3>{text['home.quick.songs.title']}</h3>
          <p className="muted">{text['home.quick.songs.body']}</p>
        </Link>
        <Link to="/gallery" className="card quick-link reveal">
          <p className="eyebrow">{text['home.quick.gallery.eyebrow']}</p>
          <h3>{text['home.quick.gallery.title']}</h3>
          <p className="muted">{text['home.quick.gallery.body']}</p>
        </Link>
      </div>
    </section>
  )
}
