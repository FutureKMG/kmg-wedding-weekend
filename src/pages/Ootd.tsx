import { useCallback, useEffect, useState } from 'react'

declare global {
  interface Window {
    gtag?: (command: 'event', eventName: string, params?: Record<string, unknown>) => void
    dataLayer?: Array<Record<string, unknown>>
  }
}

type OotdWeather = {
  tempF: number
  feelsLikeF: number
  windMph: number
  highF: number
  lowF: number
  condition: string
}

type InspirationCard = {
  id: string
  title: string
  href: string
  imageSrc: string
  alt: string
}

const dunedinWeatherUrl =
  'https://api.open-meteo.com/v1/forecast?latitude=28.0259&longitude=-82.7759&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,is_day&daily=temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America%2FNew_York&forecast_days=1'

const INSPIRATION_CARDS: InspirationCard[] = [
  {
    id: 'women-outfit',
    title: "Women's Outfit Inspiration",
    href: 'https://www.pinterest.com/search/pins/?q=garden%20formal%20wedding%20guest%20dress%20Pinterest&rs=rs&source_id=rs_4UaKqiZ6&top_pin_ids=895231232201171150&eq=&etslf=5113',
    imageSrc: '/theme/ootd-women.jpg',
    alt: "Women's garden formal outfit inspiration collage",
  },
  {
    id: 'women-shoes',
    title: "Women's Shoe Inspiration (Grass-Friendly)",
    href: 'https://www.pinterest.com/search/pins/?q=grass%20friendly%20wedding%20guest%20shoes&rs=typed',
    imageSrc: '/theme/ootd-shoes.jpg',
    alt: "Grass-friendly women's wedding shoe inspiration",
  },
  {
    id: 'men-outfit',
    title: "Men's Outfit Inspiration",
    href: 'https://www.pinterest.com/search/pins/?q=garden%20formal%20wedding%20guest%20men&rs=typed',
    imageSrc: '/theme/ootd-men.jpg',
    alt: "Men's garden formal outfit inspiration collage",
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

export function OotdPage() {
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

  return (
    <section className="stack ootd-page">
      <article className="card reveal ootd-hero">
        <div className="ootd-hero-inner">
          <h1 className="ootd-hero-title">Garden Formal</h1>
          <p className="ootd-hero-subtitle">Whimsical. Chic. Ready to Celebrate</p>
          <p className="ootd-hero-copy">
            We want you to feel relaxed, confident, and ready to celebrate from ceremony through
            dancing under the stars.
          </p>
        </div>

        <div className="ootd-weather-widget" aria-live="polite">
          <p className="ootd-weather-eyebrow">Dunedin Weather</p>
          {weather ? (
            <div className="ootd-weather-meta">
              <p className="ootd-weather-temp">{weather.tempF}°F</p>
              <p>{weather.condition}</p>
              <p className="muted small-text">
                Feels like {weather.feelsLikeF}° • H {weather.highF}° / L {weather.lowF}° • Wind{' '}
                {weather.windMph} mph
              </p>
            </div>
          ) : (
            <p className="muted small-text">{weatherError || 'Loading current weather...'}</p>
          )}
        </div>
      </article>

      <article className="card reveal ootd-inspiration-section">
        <div className="ootd-inspiration-grid" aria-label="Garden formal inspiration cards">
          {INSPIRATION_CARDS.map((card) => (
            <a
              key={card.id}
              href={card.href}
              target="_blank"
              rel="noopener noreferrer"
              className="ootd-inspiration-card"
              aria-label={card.title}
            >
              <div className="ootd-inspiration-media">
                <img src={card.imageSrc} alt={card.alt} loading="lazy" decoding="async" />
                <div className="ootd-inspiration-overlay" aria-hidden="true">
                  <span className="ootd-inspiration-title">{card.title}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </article>

      <article className="card reveal ootd-guidance-section">
        <div className="ootd-guidance-grid">
          <section>
            <h2>For Women</h2>
            <p>
              Flowing silhouettes, midi-to-floor lengths, florals, and soft texture feel right at
              home here. Wedges, block heels, or elegant flats are ideal for grass and terrace
              comfort.
            </p>
          </section>
          <section>
            <h2>For Men</h2>
            <p>
              Lightweight suiting and linen blends are a natural fit for the setting. Ties are
              optional, and stable-soled dress shoes work best for lawn and terrace surfaces.
            </p>
          </section>
        </div>
      </article>
    </section>
  )
}
