import { Link } from 'react-router-dom'
import { welcomePartyContent } from '../content/welcomeParty'

function BaseballIcon() {
  return (
    <svg
      className="welcome-feature-icon"
      viewBox="0 0 24 24"
      role="presentation"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M6 8c2 1.2 2 6.8 0 8" />
      <path d="M18 8c-2 1.2-2 6.8 0 8" />
    </svg>
  )
}

export function WelcomePartyCard() {
  return (
    <Link to="/welcome-party" className="card welcome-feature-card reveal">
      <p className="eyebrow">{welcomePartyContent.dateLabel}</p>
      <h3 className="welcome-feature-title">
        <BaseballIcon />
        <span>{welcomePartyContent.title}</span>
      </h3>
      <p className="muted">
        {welcomePartyContent.timeLabel} • {welcomePartyContent.locationName}
      </p>
      <p className="welcome-feature-cta">{welcomePartyContent.timelineMicrocopy}</p>
    </Link>
  )
}
