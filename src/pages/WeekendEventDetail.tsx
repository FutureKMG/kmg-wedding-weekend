import { formatInTimeZone } from 'date-fns-tz'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageIntro } from '../components/PageIntro'
import { buildCalendarDataUri, buildCalendarFilename } from '../lib/calendar'
import { apiRequest } from '../lib/apiClient'
import { getTimelineState } from '../lib/time'
import type { WeddingEvent } from '../types'

const EVENT_TIMEZONE = 'America/New_York'
const WEDDING_DAY_EVENT_TITLES = new Set(['ceremony', 'cocktail hour', 'reception'])

function formatEventText(isoString: string, pattern: string, fallback: string): string {
  try {
    return formatInTimeZone(isoString, EVENT_TIMEZONE, pattern)
  } catch {
    return fallback
  }
}

function formatDurationLabel(startAt: string, endAt: string): string {
  const start = new Date(startAt)
  const end = new Date(endAt)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return 'Duration to be confirmed'
  }

  const totalMinutes = Math.round((end.getTime() - start.getTime()) / 60_000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours > 0 && minutes > 0) {
    return `${hours} hr ${minutes} min`
  }
  if (hours > 0) {
    return `${hours} hr`
  }
  return `${minutes} min`
}

function buildDirectionsUrl(location: string): string {
  return `https://maps.apple.com/?q=${encodeURIComponent(`${location}, Tampa, Florida`)}`
}

function isWeddingDayCoreEvent(eventTitle: string): boolean {
  return WEDDING_DAY_EVENT_TITLES.has(eventTitle.trim().toLowerCase())
}

export function WeekendEventDetailPage() {
  const { eventId } = useParams()
  const [events, setEvents] = useState<WeddingEvent[]>([])
  const [eventsError, setEventsError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadEvents() {
      try {
        const payload = await apiRequest<{ events: WeddingEvent[] }>('/api/events')
        setEvents(payload.events)
        setEventsError('')
      } catch (requestError) {
        const message = requestError instanceof Error ? requestError.message : 'Could not load event details'
        setEventsError(message)
        setEvents([])
      } finally {
        setIsLoading(false)
      }
    }

    void loadEvents()
  }, [])

  const weddingDayEvents = useMemo(
    () => events.filter((event) => isWeddingDayCoreEvent(event.title)),
    [events],
  )

  const weddingDayAgenda = useMemo(
    () =>
      [...weddingDayEvents]
        .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
        .map((event) => ({
          id: event.id,
          title: event.title,
          startLabel: formatEventText(event.startAt, 'h:mm a', 'Time TBD'),
          location: event.location,
        })),
    [weddingDayEvents],
  )

  const event = useMemo(() => {
    if (!eventId) {
      return null
    }

    if (eventId === 'wedding-day') {
      if (weddingDayEvents.length === 0) {
        return null
      }

      const sortedByStart = [...weddingDayEvents].sort(
        (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
      )
      const locations = Array.from(new Set(sortedByStart.map((item) => item.location.trim()).filter(Boolean)))

      return {
        id: 'wedding-day',
        title: 'Ceremony + Cocktail Hour + Reception',
        location: locations.join(' · '),
        startAt: sortedByStart[0].startAt,
        endAt: sortedByStart[sortedByStart.length - 1].endAt,
        sortOrder: sortedByStart[0].sortOrder,
      }
    }

    return events.find((item) => item.id === eventId) ?? null
  }, [eventId, events, weddingDayEvents])

  const timelineState = useMemo(() => getTimelineState(events, new Date()), [events])
  const isCurrent = Boolean(
    event &&
      (event.id === 'wedding-day'
        ? weddingDayEvents.some((item) => item.id === timelineState.currentEvent?.id)
        : timelineState.currentEvent?.id === event.id),
  )
  const isNext = Boolean(
    event &&
      (event.id === 'wedding-day'
        ? weddingDayEvents.some((item) => item.id === timelineState.nextEvent?.id)
        : timelineState.nextEvent?.id === event.id),
  )

  if (isLoading) {
    return (
      <section className="stack">
        <nav className="breadcrumb reveal" aria-label="Breadcrumb">
          <Link to="/weekend" className="breadcrumb-link">
            Weekend
          </Link>
          <span aria-hidden="true">/</span>
          <span>Event Details</span>
        </nav>
        <article className="card reveal">
          <p className="muted">Loading event details...</p>
        </article>
      </section>
    )
  }

  if (eventsError) {
    return (
      <section className="stack">
        <nav className="breadcrumb reveal" aria-label="Breadcrumb">
          <Link to="/weekend" className="breadcrumb-link">
            Weekend
          </Link>
          <span aria-hidden="true">/</span>
          <span>Event Details</span>
        </nav>
        <article className="card reveal">
          <p className="error-text">{eventsError}</p>
          <Link to="/weekend#full-schedule" className="button-link secondary-button-link">
            Back to Weekend Schedule
          </Link>
        </article>
      </section>
    )
  }

  if (!event) {
    return (
      <section className="stack">
        <nav className="breadcrumb reveal" aria-label="Breadcrumb">
          <Link to="/weekend" className="breadcrumb-link">
            Weekend
          </Link>
          <span aria-hidden="true">/</span>
          <span>Event Not Found</span>
        </nav>
        <article className="card reveal">
          <h3>Event not found</h3>
          <p className="muted">This event may have been updated or removed from the schedule.</p>
          <Link to="/weekend#full-schedule" className="button-link secondary-button-link">
            Back to Weekend Schedule
          </Link>
        </article>
      </section>
    )
  }

  const calendarDataUri = buildCalendarDataUri(event)
  const calendarFilename = buildCalendarFilename(event)
  const eventDate = formatEventText(event.startAt, 'EEEE, MMMM d, yyyy', 'Date TBD')
  const eventStart = formatEventText(event.startAt, 'h:mm a', 'Start TBD')
  const eventEnd = formatEventText(event.endAt, 'h:mm a', 'End TBD')
  const eventDuration = formatDurationLabel(event.startAt, event.endAt)
  const directionsBaseLocation =
    event.id === 'wedding-day' && weddingDayEvents.length > 0 ? weddingDayEvents[0].location : event.location
  const directionsUrl = buildDirectionsUrl(directionsBaseLocation)

  return (
    <section className="stack">
      <nav className="breadcrumb reveal" aria-label="Breadcrumb">
        <Link to="/weekend" className="breadcrumb-link">
          Weekend
        </Link>
        <span aria-hidden="true">/</span>
        <span>{event.title}</span>
      </nav>

      <PageIntro
        eyebrow="Event Details"
        title={event.title}
        description="Calendar-ready details, directions, and a quick path back to the full weekend schedule."
      />

      <article className="card reveal event-detail-card">
        <p className="eyebrow">When & Where</p>
        <h3>{eventDate}</h3>
        <p className="muted">
          {eventStart} - {eventEnd} ET
        </p>
        <p className="muted">{event.location}</p>
        {isCurrent ? <p className="status-pill">Happening now</p> : null}
        {!isCurrent && isNext ? <p className="status-pill">Up next</p> : null}

        <div className="event-detail-grid">
          <article className="event-detail-item">
            <p className="eyebrow">Duration</p>
            <p>{eventDuration}</p>
          </article>
          <article className="event-detail-item">
            <p className="eyebrow">Location</p>
            <p>{event.location}</p>
          </article>
        </div>

        {event.id === 'wedding-day' ? (
          <article className="event-detail-item event-detail-agenda">
            <p className="eyebrow">Wedding Day Sequence</p>
            <ul>
              {weddingDayAgenda.map((agendaItem) => (
                <li key={agendaItem.id}>
                  <span>{agendaItem.startLabel}</span>
                  <span>{agendaItem.title}</span>
                  <span>{agendaItem.location}</span>
                </li>
              ))}
            </ul>
          </article>
        ) : null}

        <div className="button-row">
          <a className="button-link" href={calendarDataUri} download={calendarFilename}>
            Add to Calendar
          </a>
          <a className="button-link secondary-button-link" href={directionsUrl} target="_blank" rel="noreferrer">
            Get Directions
          </a>
          <Link to="/weekend#full-schedule" className="button-link secondary-button-link">
            Back to Weekend Schedule
          </Link>
        </div>
      </article>
    </section>
  )
}
