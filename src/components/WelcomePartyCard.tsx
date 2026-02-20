import { Link } from 'react-router-dom'
import { welcomePartyContent } from '../content/welcomeParty'

export function WelcomePartyCard() {
  return (
    <Link to="/welcome-party" className="card welcome-feature-card reveal">
      <p className="eyebrow">{welcomePartyContent.dateLabel}</p>
      <h3 className="welcome-feature-title">
        <span>{welcomePartyContent.title}</span>
      </h3>
      <p className="muted">
        {welcomePartyContent.timeLabel} • {welcomePartyContent.locationName}
      </p>
      <p className="welcome-feature-cta">{welcomePartyContent.timelineMicrocopy}</p>
    </Link>
  )
}
