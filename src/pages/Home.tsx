import { Link } from 'react-router-dom'
import { DecoDivider } from '../components/DecoDivider'
import { HeroImage } from '../components/HeroImage'
import { useAuth } from '../lib/auth'

export function HomePage() {
  const { guest } = useAuth()

  return (
    <section className="stack">
      <article className="card home-hero reveal">
        <div className="home-hero-copy">
          <p className="eyebrow">Welcome, {guest?.firstName}</p>
          <h2>Your concierge for the weekend</h2>
          <p className="muted">
            Keep everything in one place: timeline, seating, songs, photos, and local picks.
          </p>
          <DecoDivider />
          <p className="hero-note">Fenway-aligned palette, art deco lines, watercolor calm.</p>
        </div>

        <HeroImage alt="Fenway watercolor scene" className="home-hero-media" />
      </article>

      <div className="quick-grid">
        <Link to="/timeline" className="card quick-link reveal">
          <p className="eyebrow">Now & Next</p>
          <h3>Wedding Timeline</h3>
          <p className="muted">See what is happening now and what is coming up next.</p>
        </Link>
        <Link to="/guide" className="card quick-link reveal">
          <p className="eyebrow">Around Town</p>
          <h3>Local Guide</h3>
          <p className="muted">Curated Dunedin and Tampa recommendations for guests.</p>
        </Link>
        <Link to="/seating" className="card quick-link reveal">
          <p className="eyebrow">Reception</p>
          <h3>Seating</h3>
          <p className="muted">Find your table assignment quickly.</p>
        </Link>
        <Link to="/songs" className="card quick-link reveal">
          <p className="eyebrow">Dance Floor</p>
          <h3>Song Requests</h3>
          <p className="muted">Share a song for the DJ list.</p>
        </Link>
        <Link to="/gallery" className="card quick-link reveal">
          <p className="eyebrow">Memories</p>
          <h3>Wedding Feed & Gallery</h3>
          <p className="muted">Post to the feed or browse every photo from the weekend.</p>
        </Link>
      </div>
    </section>
  )
}
