import { useEffect, useState } from 'react'
import { PageIntro } from '../components/PageIntro'

declare global {
  interface Window {
    gtag?: (command: 'event', eventName: string, params?: Record<string, unknown>) => void
    dataLayer?: Array<Record<string, unknown>>
  }
}

const GRASS_CALLOUT = {
  body: 'Grass considerations ➤ Wedges & block heels photograph and perform beautifully on lawns.',
}

type InspirationCard = {
  id: string
  title: string
  query: string
  href: string
  section: 'women' | 'men'
}

const INTRO_PARAGRAPH =
  'Our wedding will be on the lawn and terrace of the Fenway Hotel — a historic, jazz-age inspired venue in Dunedin, Florida. With waterfront views and a refined garden-formal setting, we want everyone to look and feel great from ceremony through dancing under the stars.'

const WOMEN_ENCOURAGEMENT = [
  'Structured cocktail dresses & midi gowns',
  'Silky or flowy fabrics in soft tones',
  'Wedges, block heels, or elegant flats (great for lawn terrain)',
  'Optional accessories: wrap, clutch, classic jewelry',
]

const MEN_ENCOURAGEMENT = [
  'Suits in navy, charcoal, light gray, or seasonal tones',
  'Linen-blend or lightweight wool',
  'Ties optional but welcome',
  'Loafers or classic dress shoes',
]

const WOMEN_INSPIRATION_CARDS: InspirationCard[] = [
  {
    id: 'women-garden-formal',
    title: 'Garden-Formal Guest Dresses',
    query: 'garden formal wedding guest dress Pinterest',
    href: buildPinterestSearchUrl('garden formal wedding guest dress Pinterest'),
    section: 'women',
  },
  {
    id: 'women-midi',
    title: 'Elegant Midi Dresses',
    query: 'elegant midi dress garden wedding',
    href: buildPinterestSearchUrl('elegant midi dress garden wedding'),
    section: 'women',
  },
  {
    id: 'women-flowing-formal',
    title: 'Flowing Formal Looks',
    query: 'flowing formal wedding guest dress',
    href: buildPinterestSearchUrl('flowing formal wedding guest dress'),
    section: 'women',
  },
  {
    id: 'women-wedges',
    title: 'Wedges for Outdoor Weddings',
    query: 'wedges for outdoor wedding shoes style',
    href: buildPinterestSearchUrl('wedges for outdoor wedding shoes style'),
    section: 'women',
  },
  {
    id: 'women-block-heels',
    title: 'Block Heel Inspiration',
    query: 'block heel wedding guest inspiration',
    href: buildPinterestSearchUrl('block heel wedding guest inspiration'),
    section: 'women',
  },
]

const MEN_INSPIRATION_CARDS: InspirationCard[] = [
  {
    id: 'men-navy-suit',
    title: 'Navy Wedding Guest Suit',
    query: 'navy suit wedding guest Pinterest',
    href: buildPinterestSearchUrl('navy suit wedding guest Pinterest'),
    section: 'men',
  },
  {
    id: 'men-light-gray',
    title: 'Light Gray Suit Styling',
    query: 'light gray suit wedding guest',
    href: buildPinterestSearchUrl('light gray suit wedding guest'),
    section: 'men',
  },
  {
    id: 'men-linen-blend',
    title: 'Linen-Blend Suit Looks',
    query: 'linen blend suit wedding guest',
    href: buildPinterestSearchUrl('linen blend suit wedding guest'),
    section: 'men',
  },
  {
    id: 'men-pocket-square',
    title: 'Pocket Square Inspiration',
    query: 'pocket square wedding style inspiration',
    href: buildPinterestSearchUrl('pocket square wedding style inspiration'),
    section: 'men',
  },
  {
    id: 'men-loafers',
    title: 'Loafers & Dress Shoes',
    query: 'men wedding guest loafers dress shoes',
    href: buildPinterestSearchUrl('men wedding guest loafers dress shoes'),
    section: 'men',
  },
]

function buildPinterestSearchUrl(query: string): string {
  return `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`
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

  function handleInspirationClick(card: InspirationCard) {
    trackAnalyticsEvent('click_ootd_inspiration', {
      section: card.section,
      title: card.title,
      query: card.query,
      href: card.href,
    })
  }

  return (
    <section className="stack ootd-page">
      <PageIntro
        eyebrow="#OOTD"
        title="#OOTD"
        description="Garden-Formal Outfit Inspiration"
      >
        <p className="ootd-intro-paragraph">{INTRO_PARAGRAPH}</p>
        <div className="ootd-intro-actions">
          <button type="button" className="secondary-button" onClick={handleCopyLink}>
            Copy Link
          </button>
          <p className="muted small-text ootd-copy-feedback" role="status" aria-live="polite">
            {copyMessage}
          </p>
        </div>
      </PageIntro>

      <article className="card reveal ootd-style-section ootd-style-section-women">
        <h3>Women&rsquo;s Style Gallery</h3>
        <div className="ootd-inspiration-grid" aria-label="Women's style inspiration">
          {WOMEN_INSPIRATION_CARDS.map((card) => (
            <a
              key={card.id}
              className="ootd-inspiration-tile"
              href={card.href}
              target="_blank"
              rel="noreferrer"
              aria-label={`${card.title} inspiration`}
              onClick={() => handleInspirationClick(card)}
            >
              <span className="ootd-inspiration-pill">Inspiration</span>
              <p>{card.title}</p>
            </a>
          ))}
        </div>
        <div className="ootd-encourage-block" aria-label="Encouragement for women's attire">
          <p className="ootd-encourage-title">Encourage:</p>
          <ul className="ootd-encourage-list">
            {WOMEN_ENCOURAGEMENT.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
        <p className="ootd-grass-highlight">{GRASS_CALLOUT.body}</p>
      </article>

      <article className="card reveal ootd-style-section ootd-style-section-men">
        <h3>Men&rsquo;s Style Gallery</h3>
        <div className="ootd-inspiration-grid" aria-label="Men's style inspiration">
          {MEN_INSPIRATION_CARDS.map((card) => (
            <a
              key={card.id}
              className="ootd-inspiration-tile"
              href={card.href}
              target="_blank"
              rel="noreferrer"
              aria-label={`${card.title} inspiration`}
              onClick={() => handleInspirationClick(card)}
            >
              <span className="ootd-inspiration-pill">Inspiration</span>
              <p>{card.title}</p>
            </a>
          ))}
        </div>
        <div className="ootd-encourage-block" aria-label="Encouragement for men's attire">
          <p className="ootd-encourage-title">Encourage:</p>
          <ul className="ootd-encourage-list">
            {MEN_ENCOURAGEMENT.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
        <p className="ootd-style-cue">If you love a pocket square moment — this is your event.</p>
      </article>
    </section>
  )
}
