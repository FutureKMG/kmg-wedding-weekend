import { Link } from 'react-router-dom'

type WeekendMapCardProps = {
  id?: string
  ctaTo?: string
  ctaLabel?: string
}

export function WeekendMapCard({ id, ctaTo, ctaLabel }: WeekendMapCardProps) {
  return (
    <article id={id} className="card weekend-map-card reveal">
      <p className="eyebrow">Area Guide</p>
      <h3>Your Tampa Weekend, Mapped with Love</h3>
      <p className="muted">
        Dunedin, Clearwater, Largo, and St. Pete in one visual guide for where to explore between events.
      </p>
      {ctaTo && ctaLabel ? (
        <Link to={ctaTo} className="button-link secondary-button-link">
          {ctaLabel}
        </Link>
      ) : null}
      <div className="weekend-map-media">
        <img
          src="/theme/tampa-weekend-map.jpg?v=20260218"
          alt="Illustrated map of Dunedin, Clearwater, Largo, and St. Petersburg for the wedding weekend."
          loading="lazy"
        />
      </div>
    </article>
  )
}
