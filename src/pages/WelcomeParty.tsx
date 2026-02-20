import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getWelcomePartyGoogleCalendarUrl, getWelcomePartyIcsText, welcomePartyContent } from '../content/welcomeParty'
import { fetchPhilliesWelcomeSection, type PhilliesWelcomeSection } from '../lib/philliesWelcome'

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
  const [section, setSection] = useState<PhilliesWelcomeSection | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRestricted, setIsRestricted] = useState(false)
  const [error, setError] = useState('')
  const googleCalendarUrl = getWelcomePartyGoogleCalendarUrl()

  useEffect(() => {
    async function loadSection() {
      try {
        const payload = await fetchPhilliesWelcomeSection()
        if (payload.section) {
          setSection(payload.section)
          return
        }

        if (payload.restricted) {
          setIsRestricted(true)
          return
        }

        if (payload.error) {
          setError(payload.error)
        }
      } finally {
        setIsLoading(false)
      }
    }

    void loadSection()
  }, [])

  if (isLoading) {
    return (
      <section className="stack welcome-party-page">
        <Link to="/weekend" className="welcome-back-link reveal">
          ← Back to Weekend
        </Link>
        <article className="card reveal">
          <p className="muted">Loading welcome party details...</p>
        </article>
      </section>
    )
  }

  if (isRestricted) {
    return (
      <section className="stack welcome-party-page">
        <Link to="/weekend" className="welcome-back-link reveal">
          ← Back to Weekend
        </Link>
        <article className="card reveal">
          <p className="eyebrow">Welcome Party</p>
          <h3>Details are available for RSVP-attending guests.</h3>
          <p className="muted">If you think this is incorrect, message Kara and we will update your access.</p>
        </article>
      </section>
    )
  }

  if (!section) {
    return (
      <section className="stack welcome-party-page">
        <Link to="/weekend" className="welcome-back-link reveal">
          ← Back to Weekend
        </Link>
        <article className="card reveal">
          <p className="error-text">{error || 'Could not load welcome party details.'}</p>
        </article>
      </section>
    )
  }

  return (
    <section className="welcome-party-page stack">
      <div className="welcome-scoreboard reveal">
        <p>PHI ❤️ K&amp;K</p>
        <p>Spring Training Weekend</p>
      </div>

      <Link to="/weekend" className="welcome-back-link reveal">
        ← Back to Weekend
      </Link>

      <article className="card weekend-phillies-hero reveal">
        <p className="weekend-phillies-label">{section.label}</p>
        <h2>{section.hero.title}</h2>
        <p>{section.hero.body}</p>
      </article>

      <article className="card weekend-phillies-details reveal">
        <h3>{section.details.title}</h3>
        <div className="weekend-phillies-header-rule" aria-hidden="true" />
        <div className="weekend-phillies-details-grid">
          {section.details.items.map((item) => (
            <article key={item.id} className="weekend-phillies-detail-card">
              <h4>{item.label}</h4>
              <p>{item.value}</p>
            </article>
          ))}
        </div>

        <div className="welcome-ticket-actions">
          <a href={welcomePartyContent.mapsUrl} target="_blank" rel="noreferrer" className="button-link">
            Get Directions
          </a>
          <button type="button" onClick={downloadWelcomePartyIcs}>
            Add to Calendar
          </button>
          <a href={googleCalendarUrl} target="_blank" rel="noreferrer" className="button-link secondary-button-link">
            Google Calendar
          </a>
        </div>
      </article>

      <article className="card weekend-phillies-meet weekend-phillies-meet-visible reveal">
        <h3>{section.meet.title}</h3>
        <div className="weekend-phillies-header-rule" aria-hidden="true" />
        <p>{section.meet.body}</p>
      </article>
    </section>
  )
}
