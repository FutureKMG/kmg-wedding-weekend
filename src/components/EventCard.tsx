import { formatEventClock } from '../lib/time'
import type { WeddingEvent } from '../types'

export function EventCard({
  event,
  isCurrent,
}: {
  event: WeddingEvent
  isCurrent: boolean
}) {
  return (
    <article className={isCurrent ? 'card card-current' : 'card'}>
      <p className="eyebrow">{formatEventClock(event.startAt)}</p>
      <h3>{event.title}</h3>
      <p className="muted">{event.location}</p>
      {isCurrent && <p className="status-pill">Happening now</p>}
    </article>
  )
}
