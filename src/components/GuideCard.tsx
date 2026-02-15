import type { GuideItem } from '../types'

export function GuideCard({ item }: { item: GuideItem }) {
  return (
    <article className="card reveal">
      <p className="eyebrow">{item.category}</p>
      <h3>{item.title}</h3>
      <p className="muted">{item.description}</p>
      {item.address && <p>{item.address}</p>}
      {item.mapsUrl && (
        <a href={item.mapsUrl} target="_blank" rel="noreferrer" className="inline-link">
          Open map
        </a>
      )}
    </article>
  )
}
