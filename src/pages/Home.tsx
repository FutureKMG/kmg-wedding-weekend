import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export function HomePage() {
  const { guest } = useAuth()

  return (
    <section className="stack">
      <article className="card">
        <p className="eyebrow">Good evening, {guest?.firstName}.</p>
        <h2>Your concierge for the weekend</h2>
        <p className="muted">
          Keep everything in one place: timeline, seating, songs, photos, and local recommendations.
        </p>
      </article>

      <div className="quick-grid">
        <Link to="/timeline" className="card quick-link">
          <h3>Wedding Timeline</h3>
          <p className="muted">See what is happening now and what is next.</p>
        </Link>
        <Link to="/guide" className="card quick-link">
          <h3>Local Guide</h3>
          <p className="muted">Curated Dunedin and Tampa picks for guests.</p>
        </Link>
        <Link to="/seating" className="card quick-link">
          <h3>Seating</h3>
          <p className="muted">Find your table assignment quickly.</p>
        </Link>
        <Link to="/songs" className="card quick-link">
          <h3>Song Requests</h3>
          <p className="muted">Share a track for the dance floor.</p>
        </Link>
        <Link to="/gallery" className="card quick-link">
          <h3>Photo Gallery</h3>
          <p className="muted">Upload and view photos from the celebration.</p>
        </Link>
      </div>
    </section>
  )
}
