import { useEffect, useMemo, useState } from 'react'
import { EventCard } from '../components/EventCard'
import { PageIntro } from '../components/PageIntro'
import { WelcomePartyCard } from '../components/WelcomePartyCard'
import { apiRequest } from '../lib/apiClient'
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
      <PageIntro
        eyebrow="Wedding Day"
        title="Timeline"
        description="Keep an eye on what is happening now and what is next."
      >
        {timelineState.currentEvent ? (
          <p className="muted">
            Happening now: {timelineState.currentEvent.title} at {timelineState.currentEvent.location}
          </p>
        ) : timelineState.nextEvent ? (
          <p className="muted">
            Up next: {timelineState.nextEvent.title} in {timelineState.countdown}
          </p>
        ) : (
          <p className="muted">The formal timeline has wrapped for tonight.</p>
        )}
      </PageIntro>

      {error && <p className="error-text">{error}</p>}

      <div className="stack">
        <WelcomePartyCard />
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
