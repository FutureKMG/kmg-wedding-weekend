import type { GuideItem } from '../types'

export function GuideCard({ item }: { item: GuideItem }) {
  const actionLabel =
    item.mapsUrl &&
    (item.mapsUrl.includes('maps.google.com') || item.mapsUrl.includes('google.com/maps'))
      ? 'Open map'
      : 'Open link'

  return (
    <article className="card reveal">
      <p className="eyebrow">{item.category}</p>
      <h3>{item.title}</h3>
      <p className="muted">{item.description}</p>
      {item.address && <p>{item.address}</p>}
      {item.mapsUrl && (
        <a href={item.mapsUrl} target="_blank" rel="noreferrer" className="inline-link">
          {actionLabel}
        </a>
      )}
    </article>
  )
}
