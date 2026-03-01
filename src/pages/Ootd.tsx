import { useEffect, useState } from 'react'

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
  terrainNote?: string
}

const WOMEN_VISUAL_CARDS: VisualCard[] = [
  {
    id: 'women-structured-midi',
    title: 'Structured Midi Dress',
    description: 'Elegant and polished while remaining comfortable for outdoor settings.',
    imageSrc: '/theme/invite-hero.avif',
    imageAlt: 'Structured midi dress styling inspiration',
  },
  {
    id: 'women-flowing-maxi',
    title: 'Flowing Maxi or Soft Gown',
    description: 'Light movement and breathable fabrics complement the waterfront backdrop.',
    imageSrc: '/theme/home-lounge-portrait-one.avif',
    imageAlt: 'Flowing maxi gown inspiration in soft evening light',
  },
  {
    id: 'women-tailored-cocktail',
    title: 'Tailored Cocktail Dress',
    description: 'Refined and celebratory without feeling overdone.',
    imageSrc: '/theme/welcome-party-hero.avif',
    imageAlt: 'Tailored cocktail dress inspiration',
  },
  {
    id: 'women-footwear',
    title: 'Elegant Flats, Wedges, or Block Heels',
    description: 'Ideal for lawn terrain while maintaining a formal finish.',
    imageSrc: '/theme/home-lounge-portrait-two.avif',
    imageAlt: 'Elegant footwear styling for outdoor formal events',
    terrainNote: 'Terrain note: Supportive styles transition smoothly between lawn and terrace.',
  },
]

const MEN_VISUAL_CARDS: VisualCard[] = [
  {
    id: 'men-navy-charcoal',
    title: 'Navy or Charcoal Suit',
    description: 'Timeless and well-suited for garden-formal settings.',
    imageSrc: '/theme/home-lounge-hero.avif',
    imageAlt: 'Navy or charcoal tailored suit inspiration',
  },
  {
    id: 'men-light-gray-seasonal',
    title: 'Light Gray or Seasonal Tone',
    description: 'A softer palette complements the waterfront venue.',
    imageSrc: '/theme/welcome-party-hero-mobile.avif',
    imageAlt: 'Light gray and seasonal tone suit inspiration',
  },
  {
    id: 'men-lightweight-fabrics',
    title: 'Lightweight Fabrics',
    description: 'Linen-blend or lightweight wool for Florida comfort.',
    imageSrc: '/theme/invite-hero-mobile.avif',
    imageAlt: 'Lightweight suiting fabric inspiration',
  },
]

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

  useEffect(() => {
    trackAnalyticsEvent('view_ootd')
  }, [])

  useEffect(() => {
    if (!copyMessage) return
    const timer = window.setTimeout(() => setCopyMessage(''), 2200)
    return () => window.clearTimeout(timer)
  }, [copyMessage])

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
                <img src={card.imageSrc} alt={card.imageAlt} loading="lazy" decoding="async" />
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
                <img src={card.imageSrc} alt={card.imageAlt} loading="lazy" decoding="async" />
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
