import { useCallback, useEffect, useState } from 'react'

declare global {
  interface Window {
    gtag?: (command: 'event', eventName: string, params?: Record<string, unknown>) => void
    dataLayer?: Array<Record<string, unknown>>
  }
}

type VisualCard = {
  id: string
  title: string
  description: string
  imageSrc: string
  imageAlt: string
  imageFallbackSrc?: string
  terrainNote?: string
}

const dunedinWeatherUrl =
  'https://api.open-meteo.com/v1/forecast?latitude=28.0259&longitude=-82.7759&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,is_day&daily=temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America%2FNew_York&forecast_days=1'

type OotdWeather = {
  tempF: number
  feelsLikeF: number
  windMph: number
  highF: number
  lowF: number
  condition: string
}

const WOMEN_VISUAL_CARDS: VisualCard[] = [
  {
    id: 'women-structured-midi',
    title: 'Structured Midi Dress',
    description: 'Elegant and polished while remaining comfortable for outdoor settings.',
    imageSrc: '/theme/invite-hero.webp',
    imageFallbackSrc: '/theme/invite-hero.png',
    imageAlt: 'Structured midi dress styling inspiration',
  },
  {
    id: 'women-flowing-maxi',
    title: 'Flowing Maxi or Soft Gown',
    description: 'Light movement and breathable fabrics complement the waterfront backdrop.',
    imageSrc: '/theme/home-lounge-portrait-one.webp',
    imageFallbackSrc: '/theme/home-lounge-portrait-one.png',
    imageAlt: 'Flowing maxi gown inspiration in soft evening light',
  },
  {
    id: 'women-tailored-cocktail',
    title: 'Tailored Cocktail Dress',
    description: 'Refined and celebratory without feeling overdone.',
    imageSrc: '/theme/welcome-party-hero.webp',
    imageFallbackSrc: '/theme/welcome-party-hero.png',
    imageAlt: 'Tailored cocktail dress inspiration',
  },
  {
    id: 'women-footwear',
    title: 'Elegant Flats, Wedges, or Block Heels',
    description: 'Ideal for lawn terrain while maintaining a formal finish.',
    imageSrc: '/theme/home-lounge-portrait-two.webp',
    imageFallbackSrc: '/theme/home-lounge-portrait-two.png',
    imageAlt: 'Elegant footwear styling for outdoor formal events',
    terrainNote: 'Terrain note: Supportive styles transition smoothly between lawn and terrace.',
  },
]

const MEN_VISUAL_CARDS: VisualCard[] = [
  {
    id: 'men-navy-charcoal',
    title: 'Navy or Charcoal Suit',
    description: 'Timeless and well-suited for garden-formal settings.',
    imageSrc: '/theme/home-lounge-hero.webp',
    imageFallbackSrc: '/theme/home-lounge-hero.png',
    imageAlt: 'Navy or charcoal tailored suit inspiration',
  },
  {
    id: 'men-light-gray-seasonal',
    title: 'Light Gray or Seasonal Tone',
    description: 'A softer palette complements the waterfront venue.',
    imageSrc: '/theme/welcome-party-hero-mobile.webp',
    imageFallbackSrc: '/theme/welcome-party-hero-mobile.png',
    imageAlt: 'Light gray and seasonal tone suit inspiration',
  },
  {
    id: 'men-lightweight-fabrics',
    title: 'Lightweight Fabrics',
    description: 'Linen-blend or lightweight wool for Florida comfort.',
    imageSrc: '/theme/invite-hero-mobile.webp',
    imageFallbackSrc: '/theme/invite-hero-mobile.png',
    imageAlt: 'Lightweight suiting fabric inspiration',
  },
]

function weatherLabel(code: number, isDay: number): string {
  if (code === 0) return isDay ? 'Clear skies' : 'Clear night'
  if (code === 1 || code === 2 || code === 3) return 'Partly cloudy'
  if (code === 45 || code === 48) return 'Fog'
  if ([51, 53, 55, 56, 57].includes(code)) return 'Drizzle'
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Rain showers'
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Snow'
  if ([95, 96, 99].includes(code)) return 'Thunderstorms'
  return 'Changing weather'
}

function trackAnalyticsEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined') return

  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, params)
  }

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({ event: eventName, ...(params ?? {}) })
  }
}

function copyTextFallback(value: string): boolean {
  const textArea = document.createElement('textarea')
  textArea.value = value
  textArea.setAttribute('readonly', '')
  textArea.style.position = 'fixed'
  textArea.style.opacity = '0'
  document.body.appendChild(textArea)
  textArea.select()
  textArea.setSelectionRange(0, value.length)

  let copied = false
  try {
    copied = document.execCommand('copy')
  } finally {
    textArea.remove()
  }

  return copied
}

export function OotdPage() {
  const [copyMessage, setCopyMessage] = useState('')
  const [weather, setWeather] = useState<OotdWeather | null>(null)
  const [weatherError, setWeatherError] = useState('')

  const loadWeather = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch(dunedinWeatherUrl, {
        cache: 'no-store',
        signal,
      })
      if (!response.ok) {
        throw new Error('Could not load Dunedin weather')
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
      if (signal?.aborted) return
      setWeatherError('Weather is temporarily unavailable.')
    }
  }, [])

  useEffect(() => {
    trackAnalyticsEvent('view_ootd')
  }, [])

  useEffect(() => {
    if (!copyMessage) return
    const timer = window.setTimeout(() => setCopyMessage(''), 2200)
    return () => window.clearTimeout(timer)
  }, [copyMessage])

  useEffect(() => {
    const controller = new AbortController()
    void loadWeather(controller.signal)

    const timer = window.setInterval(() => {
      const refreshController = new AbortController()
      void loadWeather(refreshController.signal)
      window.setTimeout(() => refreshController.abort(), 15_000)
    }, 20 * 60 * 1000)

    return () => {
      controller.abort()
      window.clearInterval(timer)
    }
  }, [loadWeather])

  async function handleCopyLink() {
    const deepLink = `${window.location.origin}/ootd`

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(deepLink)
        trackAnalyticsEvent('click_copy_ootd')
        setCopyMessage('Link copied')
        return
      }

      if (copyTextFallback(deepLink)) {
        trackAnalyticsEvent('click_copy_ootd')
        setCopyMessage('Link copied')
        return
      }
    } catch {
      // Fall through to user-facing failure state.
    }

    setCopyMessage('Could not copy link')
  }

  return (
    <section className="stack ootd-page">
      <article className="card reveal ootd-hero">
        <h1 className="ootd-hero-title">Garden-Formal Attire</h1>
        <p className="ootd-hero-subhead">
          The ceremony and reception will take place on the lawn and terrace of the Fenway Hotel
          {' '}— a historic, jazz-age inspired waterfront setting in Dunedin, Florida.
        </p>
        <p className="ootd-hero-clarity">
          Think refined, effortless, and comfortable from ceremony through dancing under the stars.
        </p>
        <div className="ootd-intro-actions">
          <button type="button" className="secondary-button" onClick={handleCopyLink}>
            Copy Link
          </button>
          <p className="muted small-text ootd-copy-feedback" role="status" aria-live="polite">
            {copyMessage}
          </p>
        </div>
        <div className="ootd-weather-widget" aria-live="polite">
          <p className="ootd-weather-eyebrow">Dunedin Weather</p>
          {weather ? (
            <div className="ootd-weather-meta">
              <p className="ootd-weather-temp">{weather.tempF}°F</p>
              <p>{weather.condition}</p>
              <p className="muted small-text">
                Feels like {weather.feelsLikeF}° • H {weather.highF}° / L {weather.lowF}° • Wind {weather.windMph} mph
              </p>
            </div>
          ) : (
            <p className="muted small-text">{weatherError || 'Loading current weather...'}</p>
          )}
        </div>
      </article>

      <div className="ootd-divider" aria-hidden="true" />

      <article className="card reveal ootd-section">
        <div className="ootd-section-head">
          <h2>Garden-Formal for Women</h2>
          <p>
            Structured silhouettes, flowing fabrics, and elevated simplicity feel right at home in
            this setting.
          </p>
        </div>
        <div className="ootd-visual-grid" aria-label="Women's curated style guidance">
          {WOMEN_VISUAL_CARDS.map((card) => (
            <article key={card.id} className="ootd-visual-card">
              <div className="ootd-visual-image">
                <picture>
                  <source srcSet={card.imageSrc} type="image/webp" />
                  <img
                    src={card.imageFallbackSrc ?? card.imageSrc}
                    alt={card.imageAlt}
                    loading="lazy"
                    decoding="async"
                  />
                </picture>
              </div>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
              {card.terrainNote ? <p className="ootd-terrain-note">{card.terrainNote}</p> : null}
            </article>
          ))}
        </div>
        <p className="ootd-terrain-callout">
          Lawn Setting: Wedges, block heels, or elegant flats perform beautifully on grass.
        </p>
        <p className="ootd-accessories-line">A light wrap is encouraged for the evening breeze.</p>
      </article>

      <div className="ootd-divider" aria-hidden="true" />

      <article className="card reveal ootd-section">
        <div className="ootd-section-head">
          <h2>Garden-Formal for Gentlemen</h2>
        </div>
        <p>Think tailored, effortless, and seasonally refined.</p>
        <p>
          Suits in navy, charcoal, light gray, or soft seasonal tones feel right at home against
          the waterfront backdrop. Lightweight wool or linen-blend fabrics will keep you
          comfortable from ceremony through dancing under the stars.
        </p>
        <p>Ties encouraged, but not required — choose what feels most like you.</p>
        <p>
          Complete the look with loafers or classic dress shoes well-suited for lawn and terrace
          settings.
        </p>
        <div className="ootd-visual-grid ootd-visual-grid-men" aria-label="Men's curated style guidance">
          {MEN_VISUAL_CARDS.map((card) => (
            <article key={card.id} className="ootd-visual-card">
              <div className="ootd-visual-image">
                <picture>
                  <source srcSet={card.imageSrc} type="image/webp" />
                  <img
                    src={card.imageFallbackSrc ?? card.imageSrc}
                    alt={card.imageAlt}
                    loading="lazy"
                    decoding="async"
                  />
                </picture>
              </div>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </article>
          ))}
        </div>
        <p className="ootd-terrain-note">
          Stable-soled dress shoes are recommended for lawn and terrace surfaces.
        </p>
      </article>
    </section>
  )
}
