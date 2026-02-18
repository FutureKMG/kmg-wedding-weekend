import { formatDistanceToNow } from 'date-fns'
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { WeekendMapCard } from '../components/WeekendMapCard'
import { mergeDashboardText } from '../content/dashboardText'
import { apiRequest } from '../lib/apiClient'
import { useAuth } from '../lib/auth'
import { formatEventClock, getTimelineState } from '../lib/time'
import type { FeedUpdate, FlightPartyMember, PhotoItem, WeddingEvent } from '../types'

const tampaWeatherUrl =
  'https://api.open-meteo.com/v1/forecast?latitude=27.9506&longitude=-82.4572&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,is_day&daily=temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America%2FNew_York&forecast_days=1'

const fenwayAddress = 'Fenway Hotel 453 Edgewater Dr Dunedin FL 34698'

const fenwayUberUrl = (() => {
  const params = new URLSearchParams({
    action: 'setPickup',
    pickup: 'my_location',
    'dropoff[formatted_address]': fenwayAddress,
    'dropoff[nickname]': 'Fenway Hotel',
  })
  return `https://m.uber.com/ul/?${params.toString()}`
})()

const fenwayDirectionsUrl = `https://maps.apple.com/?q=${encodeURIComponent(fenwayAddress)}`

const flightTrackerUrl = 'https://www.flightaware.com/live/'

function parseHttpsUrl(candidate: string): string | null {
  const normalized = candidate.trim()
  if (!normalized) {
    return null
  }

  try {
    const parsed = new URL(normalized)
    return parsed.protocol === 'https:' ? parsed.toString() : null
  } catch {
    return null
  }
}

function buildAppleMapsUrl(location: string): string | null {
  try {
    return `https://maps.apple.com/?q=${encodeURIComponent(`${location}, Tampa, Florida`)}`
  } catch {
    return null
  }
}

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

function formatArrivalSummary(arrivalTime: string): string {
  const arrivalDate = new Date(arrivalTime)
  if (Number.isNaN(arrivalDate.getTime())) {
    return 'Arrival time pending'
  }

  return arrivalDate.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function HomePage() {
  const { guest } = useAuth()
  const [events, setEvents] = useState<WeddingEvent[]>([])
  const [eventsError, setEventsError] = useState('')
  const [now, setNow] = useState(() => new Date())
  const [feedPhotos, setFeedPhotos] = useState<PhotoItem[]>([])
  const [feedUpdates, setFeedUpdates] = useState<FeedUpdate[]>([])
  const [feedError, setFeedError] = useState('')
  const [contentOverrides, setContentOverrides] = useState<Record<string, string>>({})
  const [updateDraft, setUpdateDraft] = useState('')
  const [updateError, setUpdateError] = useState('')
  const [isPostingUpdate, setIsPostingUpdate] = useState(false)
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [weather, setWeather] = useState<TampaWeather | null>(null)
  const [weatherError, setWeatherError] = useState('')
  const [flightParty, setFlightParty] = useState<FlightPartyMember[]>([])
  const [flightError, setFlightError] = useState('')

  const text = useMemo(() => mergeDashboardText(contentOverrides), [contentOverrides])

  const loadEvents = useCallback(async () => {
    try {
      const payload = await apiRequest<{ events: WeddingEvent[] }>('/api/events')
      setEvents(payload.events)
      setEventsError('')
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Could not load weekend schedule'
      setEventsError(message)
      setEvents([])
    }
  }, [])

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
    try {
      const payload = await apiRequest<{
        party?: FlightPartyMember[]
        migrationRequired?: boolean
      }>('/api/flight-details')

      if (payload.migrationRequired) {
        setFlightError('Flight details are not enabled yet. Ask Kara to run the latest migration.')
        setFlightParty([])
      } else {
        setFlightError('')
        setFlightParty(payload.party ?? [])
      }
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Could not load flight details'
      setFlightError(message)
      setFlightParty([])
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
      void loadEvents()
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
  }, [loadEvents, loadWeddingFeed, loadWeather, loadFlightDetails])

  useEffect(() => {
    const weatherRefresh = window.setInterval(() => {
      void loadWeather()
    }, 20 * 60 * 1000)

    return () => {
      window.clearInterval(weatherRefresh)
    }
  }, [loadWeather])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  const marqueePhotos = useMemo(() => {
    if (feedPhotos.length === 0) {
      return []
    }
    return [...feedPhotos, ...feedPhotos]
  }, [feedPhotos])

  const shouldAnimateFeed = feedPhotos.length > 1
  const timelineState = useMemo(() => getTimelineState(events, now), [events, now])
  const previewUpdates = useMemo(() => feedUpdates.slice(0, 3), [feedUpdates])

  const activeEvent = timelineState.currentEvent ?? timelineState.nextEvent
  const directionsUrl = activeEvent
    ? buildAppleMapsUrl(activeEvent.location) ?? '/weekend#now-next'
    : fenwayDirectionsUrl
  const homeIcloudUrl = parseHttpsUrl(text['home.icloud.url'])

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
      setIsComposerOpen(false)
      await loadWeddingFeed()
    } catch (requestError) {
      const messageText = requestError instanceof Error ? requestError.message : 'Could not post update'
      setUpdateError(messageText)
    } finally {
      setIsPostingUpdate(false)
    }
  }

  return (
    <section className="stack">
      <article className="card home-need-now reveal">
        <div className="home-need-now-head">
          <p className="eyebrow">{text['home.need.eyebrow']}</p>
          <h2>{text['home.need.title']}</h2>
          <p className="muted">{text['home.need.body']}</p>
        </div>

        <div className="need-now-grid">
          <article className="need-now-card">
            <p className="eyebrow">{text['home.need.next.eyebrow']}</p>
            {timelineState.currentEvent ? (
              <>
                <h3>{timelineState.currentEvent.title}</h3>
                <p className="muted">
                  Happening now at {timelineState.currentEvent.location} until{' '}
                  {formatEventClock(timelineState.currentEvent.endAt)}.
                </p>
              </>
            ) : timelineState.nextEvent ? (
              <>
                <h3>Up next: {timelineState.nextEvent.title}</h3>
                <p className="muted">
                  Starts in {timelineState.countdown} at {timelineState.nextEvent.location}.
                </p>
              </>
            ) : (
              <>
                <h3>{text['home.need.next.emptyTitle']}</h3>
                <p className="muted">{eventsError || text['home.need.next.emptyBody']}</p>
              </>
            )}
            <Link to="/weekend#now-next" className="button-link secondary-button-link">
              {text['home.need.next.cta']}
            </Link>
          </article>

          <article className="need-now-card">
            <p className="eyebrow">{text['home.need.directions.eyebrow']}</p>
            <h3>{activeEvent ? activeEvent.title : text['home.need.directions.fallbackTitle']}</h3>
            <p className="muted">
              {activeEvent
                ? `Open Apple Maps to ${activeEvent.location}.`
                : text['home.need.directions.fallbackBody']}
            </p>
            <a
              className="button-link"
              href={directionsUrl}
              target={directionsUrl.startsWith('http') ? '_blank' : undefined}
              rel={directionsUrl.startsWith('http') ? 'noreferrer' : undefined}
            >
              {text['home.need.directions.cta']}
            </a>
          </article>

          <article className="need-now-card">
            <p className="eyebrow">{text['home.need.table.eyebrow']}</p>
            <h3>{guest?.tableLabel ?? text['home.need.table.emptyTitle']}</h3>
            <p className="muted">
              {guest?.tableLabel
                ? text['home.need.table.readyBody']
                : text['home.need.table.emptyBody']}
            </p>
            <Link to="/seating" className="button-link secondary-button-link">
              {text['home.need.table.cta']}
            </Link>
          </article>
        </div>
      </article>

      <WeekendMapCard ctaTo="/weekend#weekend-map" ctaLabel="Open Weekend Map" />

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
          {flightError ? <p className="error-text">{flightError}</p> : null}

          <a className="button-link secondary-button-link" href={flightTrackerUrl} target="_blank" rel="noreferrer">
            {text['home.flight.buttonPrimary']}
          </a>

          <section className="flight-party">
            <p className="flight-party-title">Shared arrivals</p>
            {flightParty.length === 0 ? (
              <p className="muted small-text">Family and grouped arrivals show here.</p>
            ) : (
              <div className="flight-party-list">
                {flightParty.map((member) => (
                  <article key={member.guestId} className="flight-party-item">
                    <p className="flight-party-name">
                      {member.firstName} {member.lastName}
                    </p>
                    <p className="muted small-text">
                      {member.arrivalAirport} • {formatArrivalSummary(member.arrivalTime)}
                    </p>
                    {member.airline || member.flightNumber ? (
                      <p className="muted small-text">{[member.airline, member.flightNumber].filter(Boolean).join(' ')}</p>
                    ) : null}
                    {member.notes ? <p className="muted small-text">{member.notes}</p> : null}
                  </article>
                ))}
              </div>
            )}
          </section>
        </article>

        {homeIcloudUrl ? (
          <article className="card reveal home-icloud-card">
            <p className="eyebrow">{text['home.icloud.eyebrow']}</p>
            <h3>{text['home.icloud.title']}</h3>
            <p className="muted">{text['home.icloud.body']}</p>
            <a className="button-link secondary-button-link" href={homeIcloudUrl} target="_blank" rel="noreferrer">
              {text['home.icloud.button']}
            </a>
          </article>
        ) : null}
      </div>

      <article className="card home-feed home-feed-compact reveal">
        <div className="home-feed-head home-feed-head-compact">
          <div className="stack feed-head-copy">
            <p className="eyebrow">{text['home.feed.eyebrow']}</p>
            <h3>{text['home.feed.title']}</h3>
            <p className="muted">{text['home.feed.body']}</p>
          </div>
          <Link to="/gallery" className="button-link secondary-button-link">
            {text['home.feed.preview.button']}
          </Link>
        </div>

        {feedPhotos.length > 0 ? (
          <div className="home-feed-marquee" aria-label="Wedding Feed carousel">
            <div className={shouldAnimateFeed ? 'home-feed-track home-feed-track-animated' : 'home-feed-track'}>
              {marqueePhotos.map((photo, index) => (
                <Link
                  key={`${photo.id}-${index}`}
                  to="/gallery"
                  className="home-feed-photo"
                  aria-label={`View photo shared by ${photo.uploadedBy} in the gallery`}
                >
                  <img src={photo.imageUrl} alt={photo.caption ?? 'Wedding moment'} loading="lazy" />
                  <span className="home-feed-credit">{photo.uploadedBy}</span>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="home-feed-empty">
            <p className="muted">{feedError || text['home.feed.empty']}</p>
            <Link to="/gallery" className="inline-link">
              {text['home.feed.preview.button']}
            </Link>
          </div>
        )}

        <article className="home-feed-preview">
          <div className="home-feed-preview-head">
            <p className="eyebrow">{text['home.feed.preview.eyebrow']}</p>
            <p className="muted small-text">
              {feedUpdates.length === 0
                ? text['home.feed.preview.emptyCount']
                : `${text['home.feed.preview.countPrefix']} ${previewUpdates.length} of ${feedUpdates.length}.`}
            </p>
          </div>

          {previewUpdates.length === 0 ? (
            <p className="muted">{feedError || text['home.feed.noTextUpdates']}</p>
          ) : (
            <div className="home-text-feed-list home-text-feed-list-compact">
              {previewUpdates.map((update) => (
                <article key={update.id} className="home-text-feed-item">
                  <p>{update.message}</p>
                  <p className="muted small-text">
                    {update.postedBy} • {formatDistanceToNow(new Date(update.createdAt), { addSuffix: true })}
                  </p>
                </article>
              ))}
            </div>
          )}
        </article>

        <div className="home-feed-compose-wrap">
          <button
            type="button"
            className="secondary-button"
            onClick={() => setIsComposerOpen((open) => !open)}
            aria-expanded={isComposerOpen}
          >
            {isComposerOpen ? text['home.feed.preview.composeHide'] : text['home.feed.preview.composeShow']}
          </button>

          {isComposerOpen ? (
            <form className="stack home-feed-compose" onSubmit={handlePostUpdate}>
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
          ) : null}
        </div>
      </article>

      <div className="quick-grid">
        <Link to="/weekend#now-next" className="card quick-link reveal">
          <p className="eyebrow">{text['home.quick.timeline.eyebrow']}</p>
          <h3>{text['home.quick.timeline.title']}</h3>
          <p className="muted">{text['home.quick.timeline.body']}</p>
        </Link>
        <Link to="/weekend#free-time" className="card quick-link reveal">
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
