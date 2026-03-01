import { useCallback, useEffect, useState } from 'react'

declare global {
  interface Window {
    gtag?: (command: 'event', eventName: string, params?: Record<string, unknown>) => void
    dataLayer?: Array<Record<string, unknown>>
  }
}

type WomenPinterestCard = {
  id: string
  href: string
  imageSrc: string
  imageAlt: string
  title: string
  description: string
  shoeNote: string
}

type MenPinterestCard = {
  id: string
  href: string
  imageSrc: string
  imageAlt: string
  title: string
  description: string
  shoeNote: string
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

const WOMEN_PINTEREST_CARDS: WomenPinterestCard[] = [
  {
    id: 'women-structured-midi-card',
    href: 'https://pin.it/1NPb5Jx0D',
    imageSrc: 'https://i.pinimg.com/564x/39/a9/96/39a996f4f9092a6456bf23f5894cd7e0.jpg',
    imageAlt: 'Garden formal structured midi dress inspiration',
    title: 'Structured Midi',
    description: 'Polished, refined, and lawn-friendly.',
    shoeNote: 'Pair with: block heels, elegant flats, or wedges.',
  },
  {
    id: 'women-flowing-maxi-card',
    href: 'https://www.pinterest.com/search/pins/?q=garden%20formal%20maxi%20dress',
    imageSrc: 'https://i.pinimg.com/564x/ee/eb/65/eeeb65ea89f6915fd6c53f8f6f76fb0f.jpg',
    imageAlt: 'Flowing garden formal maxi gown inspiration',
    title: 'Flowing Maxi',
    description: 'Soft movement for a waterfront setting.',
    shoeNote: 'Pair with: low block heels or refined sandals.',
  },
]

const MEN_PINTEREST_CARDS: MenPinterestCard[] = [
  {
    id: 'men-navy-charcoal-card',
    href: 'https://www.pinterest.com/search/pins/?q=garden%20formal%20navy%20suit',
    imageSrc: 'https://i.pinimg.com/564x/2f/74/0e/2f740e45f2c7a39f0ad2c08744ca78a4.jpg',
    imageAlt: 'Navy garden formal suit inspiration',
    title: 'Navy or Charcoal Suit',
    description: 'Timeless and well-suited for lawn + terrace.',
    shoeNote: 'Pair with: brown loafers or classic oxfords.',
  },
  {
    id: 'men-light-gray-linen-card',
    href: 'https://www.pinterest.com/search/pins/?q=light%20gray%20linen%20suit',
    imageSrc: 'https://i.pinimg.com/564x/7e/e4/c3/7ee4c31a599dca393e4f39c4dde3ff0e.jpg',
    imageAlt: 'Light gray linen suit inspiration',
    title: 'Light Gray or Seasonal Tone',
    description: 'Breathable and refined for Florida evenings.',
    shoeNote: 'Pair with: suede loafers or leather dress shoes.',
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
        <h1 className="ootd-hero-title">Garden-Formal Attire</h1>
        <p className="ootd-hero-subhead">
          The ceremony and reception will take place on the lawn and terrace of the Fenway Hotel
          {' '}— a historic, jazz-age inspired waterfront setting in Dunedin, Florida.
        </p>
        <p className="ootd-hero-clarity">
          Think refined, effortless, and comfortable from ceremony through dancing under the stars.
        </p>
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
        <div className="ootd-grid" aria-label="Women's curated style guidance">
          {WOMEN_PINTEREST_CARDS.map((card) => (
            <a
              key={card.id}
              href={card.href}
              target="_blank"
              rel="noopener noreferrer"
              className="ootd-card"
              aria-label={`${card.title} Pinterest inspiration`}
            >
              <img src={card.imageSrc} alt={card.imageAlt} loading="lazy" decoding="async" />
              <div className="card-content">
                <h3>{card.title}</h3>
                <p>{card.description}</p>
                <p className="shoe-note">{card.shoeNote}</p>
              </div>
            </a>
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
        <div className="ootd-grid" aria-label="Men's curated style guidance">
          {MEN_PINTEREST_CARDS.map((card) => (
            <a
              key={card.id}
              href={card.href}
              target="_blank"
              rel="noopener noreferrer"
              className="ootd-card"
              aria-label={`${card.title} Pinterest inspiration`}
            >
              <img src={card.imageSrc} alt={card.imageAlt} loading="lazy" decoding="async" />
              <div className="card-content">
                <h3>{card.title}</h3>
                <p>{card.description}</p>
                <p className="shoe-note">{card.shoeNote}</p>
              </div>
            </a>
          ))}
        </div>
        <p className="ootd-terrain-note">
          Stable-soled dress shoes are recommended for lawn and terrace surfaces.
        </p>
      </article>
    </section>
  )
}
