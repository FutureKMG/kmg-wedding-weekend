import { useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../lib/apiClient'
import { EventCard } from '../components/EventCard'
import { getTimelineState } from '../lib/time'
import type { WeddingEvent } from '../types'

export function TimelinePage() {
  const [events, setEvents] = useState<WeddingEvent[]>([])
  const [error, setError] = useState('')
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    async function loadEvents() {
      try {
        const payload = await apiRequest<{ events: WeddingEvent[] }>('/api/events')
        setEvents(payload.events)
      } catch (requestError) {
        const message =
          requestError instanceof Error ? requestError.message : 'Could not load timeline'
        setError(message)
      }
    }

    void loadEvents()
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  const timelineState = useMemo(() => getTimelineState(events, now), [events, now])

  return (
    <section className="stack">
      <article className="card">
        <h2>Wedding Day Timeline</h2>
        {timelineState.currentEvent ? (
          <p className="muted">
            Happening now: {timelineState.currentEvent.title} at{' '}
            {timelineState.currentEvent.location}
          </p>
        ) : timelineState.nextEvent ? (
          <p className="muted">
            Up next: {timelineState.nextEvent.title} in {timelineState.countdown}
          </p>
        ) : (
          <p className="muted">The formal timeline has wrapped for tonight.</p>
        )}
      </article>

      {error && <p className="error-text">{error}</p>}

      <div className="stack">
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            isCurrent={timelineState.currentEvent?.id === event.id}
          />
        ))}
      </div>
    </section>
  )
}
