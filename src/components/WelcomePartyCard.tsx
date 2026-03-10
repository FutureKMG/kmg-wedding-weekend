import { Link } from 'react-router-dom'
import { welcomePartyContent } from '../content/welcomeParty'
import { BallparkScriptWordmark } from './BallparkScriptWordmark'

export function WelcomePartyCard() {
  return (
    <Link to="/welcome-party" className="card welcome-feature-card reveal">
      <p className="eyebrow">{welcomePartyContent.dateLabel}</p>
      <BallparkScriptWordmark
        title="Game Before"
        subtitle={welcomePartyContent.matchup}
        level="h3"
        compact
        className="welcome-feature-wordmark"
      />
      <p className="muted">
        {welcomePartyContent.timeLabel} • {welcomePartyContent.locationName}
      </p>
      <p className="welcome-feature-cta">{welcomePartyContent.timelineMicrocopy}</p>
    </Link>
  )
}
