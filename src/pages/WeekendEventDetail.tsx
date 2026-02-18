import { formatInTimeZone } from 'date-fns-tz'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageIntro } from '../components/PageIntro'
import { buildCalendarDataUri, buildCalendarFilename } from '../lib/calendar'
import { apiRequest } from '../lib/apiClient'
import { getTimelineState } from '../lib/time'
import type { WeddingEvent } from '../types'

const EVENT_TIMEZONE = 'America/New_York'

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

  const event = useMemo(() => {
    if (!eventId) {
      return null
    }
    return events.find((item) => item.id === eventId) ?? null
  }, [events, eventId])

  const timelineState = useMemo(() => getTimelineState(events, new Date()), [events])
  const isCurrent = Boolean(event && timelineState.currentEvent?.id === event.id)
  const isNext = Boolean(event && timelineState.nextEvent?.id === event.id)

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
  const directionsUrl = buildDirectionsUrl(event.location)

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
