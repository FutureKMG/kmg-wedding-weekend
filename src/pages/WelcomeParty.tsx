import { Link } from 'react-router-dom'
import { BaseballStitchDivider } from '../components/BaseballStitchDivider'
import {
  getWelcomePartyGoogleCalendarUrl,
  getWelcomePartyIcsText,
  welcomePartyContent,
} from '../content/welcomeParty'

const styleGuideItems = [
  {
    title: 'Casual + Comfortable',
    detail: 'Lightweight fabrics and relaxed silhouettes are perfect.',
    icon: 'cap',
  },
  {
    title: 'Breezy Outfits',
    detail: 'Terrace seating and spring weather call for breathable layers.',
    icon: 'sun',
  },
  {
    title: 'Phillies Red Welcome',
    detail: 'If you have a pop of red, this is the place to wear it.',
    icon: 'red',
  },
  {
    title: 'Comfy Shoes',
    detail: 'Choose easy shoes for walking and mingling in the terrace section.',
    icon: 'shoe',
  },
] as const

function StyleGuideIcon({ kind }: { kind: (typeof styleGuideItems)[number]['icon'] }) {
  if (kind === 'cap') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 12a8 8 0 0 1 16 0" />
        <path d="M4 12h16" />
        <path d="M12 4v8" />
      </svg>
    )
  }

  if (kind === 'sun') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1" />
      </svg>
    )
  }

  if (kind === 'red') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3c3 4 7 6.7 7 10.3A7 7 0 1 1 5 13.3C5 9.7 9 7 12 3Z" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 15h10c1.6 0 3-1.3 3-3V9h3.5c.8 0 1.5.7 1.5 1.5V15" />
      <path d="M3 15v2h18v-2" />
      <circle cx="7" cy="17" r="1.2" />
      <circle cx="18" cy="17" r="1.2" />
    </svg>
  )
}

function downloadWelcomePartyIcs() {
  const text = getWelcomePartyIcsText()
  const blob = new Blob([text], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = welcomePartyContent.icsFilename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function WelcomePartyPage() {
  const googleCalendarUrl = getWelcomePartyGoogleCalendarUrl()

  return (
    <section className="welcome-party-page stack">
      <div className="welcome-scoreboard reveal">
        <p>PHI ❤️ K&amp;K</p>
        <p>Spring Training Weekend</p>
      </div>

      <Link to="/timeline" className="welcome-back-link reveal">
        ← Back to Timeline
      </Link>

      <article className="welcome-hero reveal">
        <picture className="welcome-hero-media">
          <source
            media="(max-width: 720px)"
            srcSet="/theme/welcome-party-hero-mobile.avif"
            type="image/avif"
          />
          <source
            media="(max-width: 720px)"
            srcSet="/theme/welcome-party-hero-mobile.webp"
            type="image/webp"
          />
          <source srcSet="/theme/welcome-party-hero.avif" type="image/avif" />
          <source srcSet="/theme/welcome-party-hero.webp" type="image/webp" />
          <img src="/theme/welcome-party-hero.png" alt="Welcome party bar atmosphere" />
        </picture>

        <div className="welcome-hero-overlay">
          <p className="eyebrow">Welcome Party</p>
          <h2>{welcomePartyContent.subtitle}</h2>
          <p className="welcome-hero-matchup">{welcomePartyContent.matchup}</p>
          <p className="welcome-hero-venue">{welcomePartyContent.venue}</p>
          <BaseballStitchDivider />
        </div>
      </article>

      <article className="card welcome-ticket reveal">
        <p className="eyebrow">Game Details</p>
        <h3>{welcomePartyContent.title}</h3>

        <div className="welcome-ticket-grid">
          <div className="welcome-ticket-item">
            <p className="welcome-ticket-label">Date & Time</p>
            <p>{welcomePartyContent.dateLabel}</p>
            <p>{welcomePartyContent.timeLabel}</p>
          </div>
          <div className="welcome-ticket-item">
            <p className="welcome-ticket-label">Location</p>
            <p>{welcomePartyContent.locationName}</p>
            <p>{welcomePartyContent.locationAddress}</p>
          </div>
          <div className="welcome-ticket-item">
            <p className="welcome-ticket-label">Section</p>
            <p>{welcomePartyContent.sectionLabel}</p>
          </div>
          <div className="welcome-ticket-item">
            <p className="welcome-ticket-label">Buffet</p>
            <p>{welcomePartyContent.buffetLabel}</p>
          </div>
        </div>

        <div className="welcome-ticket-actions">
          <a
            href={welcomePartyContent.mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="button-link"
          >
            Get Directions
          </a>
          <button type="button" onClick={downloadWelcomePartyIcs}>
            Add to Calendar
          </button>
          <a
            href={googleCalendarUrl}
            target="_blank"
            rel="noreferrer"
            className="button-link secondary-button-link"
          >
            Google Calendar
          </a>
        </div>
      </article>

      <BaseballStitchDivider className="reveal" />

      <article className="card welcome-style-guide reveal">
        <p className="eyebrow">Ballpark Style Guide</p>
        <h3>Ballpark Style Guide</h3>
        <div className="welcome-style-grid">
          {styleGuideItems.map((item) => (
            <article key={item.title} className="welcome-style-item">
              <span className="welcome-style-icon">
                <StyleGuideIcon kind={item.icon} />
              </span>
              <h4>{item.title}</h4>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      </article>

      <BaseballStitchDivider className="reveal" />

      <article className="card welcome-expect reveal">
        <p className="eyebrow">Weekend Story</p>
        <h3>What to Expect</h3>
        <p>{welcomePartyContent.description}</p>
        <p>{welcomePartyContent.descriptionContinued}</p>
      </article>
    </section>
  )
}
