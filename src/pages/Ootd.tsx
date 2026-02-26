import { useEffect, useState } from 'react'
import type { FaqAccordionItem } from '../components/FaqAccordion'
import { FaqAccordion } from '../components/FaqAccordion'
import { InfoCallout } from '../components/InfoCallout'
import { PageIntro } from '../components/PageIntro'

declare global {
  interface Window {
    gtag?: (command: 'event', eventName: string, params?: Record<string, unknown>) => void
    dataLayer?: Array<Record<string, unknown>>
  }
}

const GRASS_CALLOUT = {
  title: 'Grass-Friendly Shoes',
  body:
    'Both the ceremony and reception are on grass. If you’re choosing heels, consider block heels, wedges, stable heeled sandals, or a chic flat. Stilettos may sink into the lawn.',
}

const FAQ_ITEMS: FaqAccordionItem[] = [
  {
    id: 'garden-formal-meaning',
    title: 'What does Garden Formal mean?',
    body:
      'Our wedding will take place at the historic Fenway Hotel in Dunedin, Florida — with both the ceremony and reception held outdoors on the Front Lawn (grass). Think: elegant historic hotel, romantic evening energy, sunset ceremony, and a lawn setting. Garden Formal blends classic formalwear with outdoor ease. It’s polished and elevated — but comfortable enough for a Florida evening outside.',
  },
  {
    id: 'for-women',
    title: 'For Women',
    bullets: [
      'Floor-length gowns, midi dresses, or elevated cocktail dresses',
      'Soft romantic fabrics (chiffon, satin, silk, crepe)',
      'Structured silhouettes are welcome',
      'Florals and spring tones are beautiful',
      'Statement earrings? Yes please.',
    ],
  },
  {
    id: 'for-men',
    title: 'For Men',
    bullets: [
      'Suits in navy, charcoal, light gray, or seasonal tones',
      'Lightweight wool or linen-blend fabrics',
      'Dress shirts (tie optional but welcome)',
      'Loafers or dress shoes',
    ],
    body: 'If you love a pocket square moment — this is your event.',
  },
  {
    id: 'footwear-on-grass',
    title: 'Footwear on Grass (important)',
    callout: {
      title: GRASS_CALLOUT.title,
      body: GRASS_CALLOUT.body,
      tone: 'info',
    },
  },
  {
    id: 'florida-in-march',
    title: 'Florida in March',
    body:
      'Mid-March in Dunedin is typically warm during the day and mild in the evening. You may want a light layer for later at night.',
  },
]

const QUICK_FAQ_ITEMS: FaqAccordionItem[] = [
  {
    id: 'is-this-black-tie',
    title: 'Is this black tie?',
    body: 'No — this is formal, but not black tie.',
  },
  {
    id: 'bold-colors-or-prints',
    title: 'Can I wear bold colors or prints?',
    body: 'Absolutely. Spring tones and tasteful prints are welcome.',
  },
  {
    id: 'will-there-be-shade',
    title: 'Will there be shade?',
    body: 'Portions of the event will be outdoors. Sunglasses are fair game for arrival and cocktail hour.',
  },
  {
    id: 'entire-evening-on-grass',
    title: 'Is the entire evening on grass?',
    body: 'Yes — both the ceremony and reception take place on the Front Lawn (grass).',
  },
]

const INSPIRATION_TILES = [
  'Midi Dress',
  'Floor-Length Gown',
  'Elevated Cocktail Dress',
  'Navy Suit',
  'Charcoal Suit',
  'Linen-Blend Suit',
]

function trackAnalyticsEvent(eventName: string, params?: Record<string, string>) {
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

  function handleAccordionExpand(title: string) {
    trackAnalyticsEvent('expand_faq_item', { title })
  }

  async function handleCopyLink() {
    const deepLink = `${window.location.origin}/ootd`

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(deepLink)
        setCopyMessage('Link copied')
        return
      }

      if (copyTextFallback(deepLink)) {
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
      <PageIntro
        eyebrow="#OOTD"
        title="#OOTD"
        description="Garden Formal Attire FAQ"
      >
        <div className="ootd-intro-actions">
          <button type="button" className="secondary-button" onClick={handleCopyLink}>
            Copy Link
          </button>
          <p className="muted small-text ootd-copy-feedback" role="status" aria-live="polite">
            {copyMessage}
          </p>
        </div>
      </PageIntro>

      <InfoCallout title={GRASS_CALLOUT.title} body={GRASS_CALLOUT.body} className="ootd-grass-callout reveal" />

      <article className="card reveal ootd-faq-card">
        <h3>Attire FAQ</h3>
        <FaqAccordion items={FAQ_ITEMS} onExpand={handleAccordionExpand} />
      </article>

      <article className="card reveal ootd-faq-card">
        <h3>Quick FAQs</h3>
        <FaqAccordion items={QUICK_FAQ_ITEMS} onExpand={handleAccordionExpand} />
      </article>

      <article className="card reveal ootd-inspiration-card">
        <h3>Outfit Inspiration</h3>
        <p className="muted">
          A few polished silhouettes to set the tone. Real imagery can be swapped in later.
        </p>
        <div className="ootd-inspiration-grid" aria-label="Outfit inspiration placeholders">
          {INSPIRATION_TILES.map((tileLabel) => (
            <div key={tileLabel} className="ootd-inspiration-tile">
              <p>{tileLabel}</p>
            </div>
          ))}
        </div>
      </article>
    </section>
  )
}
