import { formatInTimeZone } from 'date-fns-tz'
import { Link } from 'react-router-dom'
import { buildCalendarDataUri, buildCalendarFilename } from '../lib/calendar'
import { formatEventClock } from '../lib/time'
import type { WeddingEvent } from '../types'

const EVENT_TIMEZONE = 'America/New_York'

function formatEventDate(isoString: string, pattern: string, fallback: string): string {
  try {
    return formatInTimeZone(isoString, EVENT_TIMEZONE, pattern)
  } catch {
    return fallback
  }
}

export function EventCard({
  event,
  isCurrent,
  detailPath,
  agendaItems = [],
}: {
  event: WeddingEvent
  isCurrent: boolean
  detailPath?: string
  agendaItems?: Array<{ label: string; time: string }>
}) {
  const eventMonth = formatEventDate(event.startAt, 'MMM', 'TBD').toUpperCase()
  const eventDay = formatEventDate(event.startAt, 'd', '--')
  const eventDayName = formatEventDate(event.startAt, 'EEEE', 'Day TBD')
  const eventDateLabel = formatEventDate(event.startAt, 'EEEE, MMMM d', 'Date pending')
  const eventDetailPath = detailPath ?? `/weekend/events/${encodeURIComponent(event.id)}`
  const calendarDataUri = buildCalendarDataUri(event)
  const calendarFilename = buildCalendarFilename(event)

  return (
    <article className={isCurrent ? 'card card-current reveal event-calendar-card' : 'card reveal event-calendar-card'}>
      <Link to={eventDetailPath} className="event-calendar-main">
        <div className="event-calendar-date">
          <span className="event-calendar-month">{eventMonth}</span>
          <span className="event-calendar-day">{eventDay}</span>
        </div>
        <div className="event-calendar-copy">
          <p className="eyebrow">{eventDayName}</p>
          <h3>{event.title}</h3>
          <p className="muted">
            {eventDateLabel} · {formatEventClock(event.startAt)} - {formatEventClock(event.endAt)}
          </p>
          <p className="muted">{event.location}</p>
          {agendaItems.length > 0 ? (
            <ul className="event-card-agenda">
              {agendaItems.map((agendaItem) => (
                <li key={`${agendaItem.time}-${agendaItem.label}`}>
                  <span>{agendaItem.time}</span>
                  <span>{agendaItem.label}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {isCurrent ? <p className="status-pill">Happening now</p> : null}
        </div>
      </Link>

      <div className="event-calendar-actions">
        <Link to={eventDetailPath} className="button-link secondary-button-link">
          View Details
        </Link>
        <a className="button-link" href={calendarDataUri} download={calendarFilename}>
          Add to Calendar
        </a>
      </div>
    </article>
  )
}
