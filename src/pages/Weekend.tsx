import { useEffect, useMemo, useState } from 'react'
import { EventCard } from '../components/EventCard'
import { GuideCard } from '../components/GuideCard'
import { PageIntro } from '../components/PageIntro'
import { WeekendMapCard } from '../components/WeekendMapCard'
import { apiRequest } from '../lib/apiClient'
import { getTimelineState } from '../lib/time'
import type { GuideItem, WeddingEvent } from '../types'

export function WeekendPage() {
  const [events, setEvents] = useState<WeddingEvent[]>([])
  const [guideItems, setGuideItems] = useState<GuideItem[]>([])
  const [eventsError, setEventsError] = useState('')
  const [guideError, setGuideError] = useState('')
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    async function loadEvents() {
      try {
        const payload = await apiRequest<{ events: WeddingEvent[] }>('/api/events')
        setEvents(payload.events)
      } catch (requestError) {
        const message = requestError instanceof Error ? requestError.message : 'Could not load weekend schedule'
        setEventsError(message)
      }
    }

    void loadEvents()
  }, [])

  useEffect(() => {
    async function loadGuide() {
      try {
        const payload = await apiRequest<{ items: GuideItem[] }>('/api/guide')
        setGuideItems(payload.items)
      } catch (requestError) {
        const message =
          requestError instanceof Error ? requestError.message : 'Could not load free-time recommendations'
        setGuideError(message)
      }
    }

    void loadGuide()
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  const timelineState = useMemo(() => getTimelineState(events, now), [events, now])

  return (
    <section className="stack">
      <PageIntro
        eyebrow="Weekend"
        title="Weekend"
        description="Everything in one place: live status, full schedule, and free-time plans."
      />

      <WeekendMapCard id="weekend-map" />

      <article id="now-next" className="card reveal">
        <p className="eyebrow">Now & Next</p>
        {timelineState.currentEvent ? (
          <>
            <h3>{timelineState.currentEvent.title}</h3>
            <p className="muted">Happening now at {timelineState.currentEvent.location}.</p>
          </>
        ) : timelineState.nextEvent ? (
          <>
            <h3>Up Next: {timelineState.nextEvent.title}</h3>
            <p className="muted">
              Starts in {timelineState.countdown} at {timelineState.nextEvent.location}.
            </p>
          </>
        ) : (
          <>
            <h3>Schedule Complete</h3>
            <p className="muted">The formal timeline has wrapped for tonight.</p>
          </>
        )}
      </article>

      <article id="full-schedule" className="card reveal">
        <p className="eyebrow">Weekend Itinerary</p>
        <h3>Tap Any Event Card for Full Details</h3>
        <p className="muted">Each card includes quick actions for event details and Add to Calendar.</p>
      </article>

      {eventsError ? <p className="error-text">{eventsError}</p> : null}

      <div className="stack">
        {events.map((event) => (
          <EventCard key={event.id} event={event} isCurrent={timelineState.currentEvent?.id === event.id} />
        ))}
      </div>

      <article id="free-time" className="card reveal">
        <p className="eyebrow">Free Time</p>
        <h3>Tampa & Dunedin Picks</h3>
        <p className="muted">Curated recommendations for downtime between events.</p>
      </article>

      {guideError ? <p className="error-text">{guideError}</p> : null}

      <div className="stack">
        {guideItems.map((item) => (
          <GuideCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  )
}
