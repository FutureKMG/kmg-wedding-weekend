import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageIntro } from '../components/PageIntro'
import {
  WELCOME_PARTY_ATTIRE,
  WELCOME_PARTY_DESCRIPTION_PARAGRAPHS,
  WELCOME_PARTY_EVENT,
  WELCOME_PARTY_FULL_ADDRESS_LINES,
  WELCOME_PARTY_SUBTITLE,
} from '../content/weekendEvents'
import { buildCalendarDataUri, buildCalendarFilename } from '../lib/calendar'

const PRIMARY_HERO_IMAGE = '/theme/phanatic-300x.png'
const FALLBACK_HERO_IMAGE = '/theme/welcome-party-hero.png'

function buildDirectionsUrl(): string {
  return `https://maps.apple.com/?q=${encodeURIComponent('BayCare Ballpark, 601 Old Coachman Road, Clearwater, FL 33765')}`
}

export function WelcomePartyEventDetailPage() {
  const [heroSrc, setHeroSrc] = useState(PRIMARY_HERO_IMAGE)
  const calendarDataUri = useMemo(() => buildCalendarDataUri(WELCOME_PARTY_EVENT), [])
  const calendarFilename = useMemo(() => buildCalendarFilename(WELCOME_PARTY_EVENT), [])
  const directionsUrl = useMemo(() => buildDirectionsUrl(), [])

  return (
    <section className="stack">
      <nav className="breadcrumb reveal" aria-label="Breadcrumb">
        <Link to="/weekend" className="breadcrumb-link">
          Weekend
        </Link>
        <span aria-hidden="true">/</span>
        <span>Welcome Party</span>
      </nav>

      <PageIntro
        eyebrow="Event Details"
        title="Welcome Party"
        description={WELCOME_PARTY_SUBTITLE}
      />

      <article className="card reveal welcome-party-event-hero-card">
        <img
          src={heroSrc}
          alt="Phillies-themed illustration for the Welcome Party spring training game."
          className="welcome-party-event-hero-image"
          onError={() => setHeroSrc(FALLBACK_HERO_IMAGE)}
        />
      </article>

      <article className="card reveal event-detail-card">
        <p className="eyebrow">Event Details</p>
        <div className="event-detail-grid">
          <article className="event-detail-item">
            <p className="eyebrow">Time</p>
            <p>12:00 PM – 4:00 PM</p>
          </article>
          <article className="event-detail-item">
            <p className="eyebrow">Location</p>
            <p>{WELCOME_PARTY_FULL_ADDRESS_LINES[0]}</p>
            <p>{WELCOME_PARTY_FULL_ADDRESS_LINES[1]}</p>
            <p>{WELCOME_PARTY_FULL_ADDRESS_LINES[2]}</p>
          </article>
          <article className="event-detail-item">
            <p className="eyebrow">Attire</p>
            <p>{WELCOME_PARTY_ATTIRE}</p>
          </article>
        </div>

        <article className="event-detail-item welcome-party-event-description">
          <p className="eyebrow">Description</p>
          {WELCOME_PARTY_DESCRIPTION_PARAGRAPHS.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </article>

        <div className="button-row">
          <a className="button-link" href={calendarDataUri} download={calendarFilename}>
            Add to Calendar
          </a>
          <a className="button-link secondary-button-link" href={directionsUrl} target="_blank" rel="noreferrer">
            Get Directions
          </a>
          <Link to="/weekend#full-schedule" className="button-link secondary-button-link">
            Back to Weekend Schedule
          </Link>
        </div>
      </article>
    </section>
  )
}
