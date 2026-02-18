import { useEffect, useMemo, useState } from 'react'
import { EventCard } from '../components/EventCard'
import { GuideCard } from '../components/GuideCard'
import { PageIntro } from '../components/PageIntro'
import { WeekendMapCard } from '../components/WeekendMapCard'
import { apiRequest } from '../lib/apiClient'
import { formatEventClock, getTimelineState } from '../lib/time'
import type { GuideItem, WeddingEvent } from '../types'

const WEDDING_DAY_EVENT_TITLES = new Set(['ceremony', 'cocktail hour', 'reception'])

function isWeddingDayCoreEvent(eventTitle: string): boolean {
  return WEDDING_DAY_EVENT_TITLES.has(eventTitle.trim().toLowerCase())
}

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
  const weddingDayEvents = useMemo(
    () => events.filter((event) => isWeddingDayCoreEvent(event.title)),
    [events],
  )

  const combinedWeddingDayEvent = useMemo<WeddingEvent | null>(() => {
    if (weddingDayEvents.length === 0) {
      return null
    }

    const sortedByStart = [...weddingDayEvents].sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
    )
    const locations = Array.from(new Set(sortedByStart.map((event) => event.location.trim()).filter(Boolean)))

    return {
      id: 'wedding-day',
      title: 'Ceremony + Cocktail Hour + Reception',
      location: locations.join(' · '),
      startAt: sortedByStart[0].startAt,
      endAt: sortedByStart[sortedByStart.length - 1].endAt,
      sortOrder: sortedByStart[0].sortOrder,
    }
  }, [weddingDayEvents])

  const weddingDayAgenda = useMemo(
    () =>
      [...weddingDayEvents]
        .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
        .map((event) => ({
          time: formatEventClock(event.startAt),
          label: event.title,
        })),
    [weddingDayEvents],
  )

  const weddingDayIsCurrent = useMemo(() => {
    if (!timelineState.currentEvent) {
      return false
    }
    return weddingDayEvents.some((event) => event.id === timelineState.currentEvent?.id)
  }, [timelineState.currentEvent, weddingDayEvents])

  const individualEvents = useMemo(
    () => events.filter((event) => !isWeddingDayCoreEvent(event.title)),
    [events],
  )

  const weekendCards = useMemo(() => {
    const combined = combinedWeddingDayEvent ? [combinedWeddingDayEvent, ...individualEvents] : individualEvents
    return [...combined].sort((a, b) => a.sortOrder - b.sortOrder)
  }, [combinedWeddingDayEvent, individualEvents])

  const visibleGuideItems = useMemo(
    () => guideItems.filter((item) => item.title.trim().toLowerCase() !== 'fenway hotel room block'),
    [guideItems],
  )

  return (
    <section className="stack weekend-page">
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
        {weekendCards.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            isCurrent={event.id === 'wedding-day' ? weddingDayIsCurrent : timelineState.currentEvent?.id === event.id}
            detailPath={event.id === 'wedding-day' ? '/weekend/events/wedding-day' : undefined}
            agendaItems={event.id === 'wedding-day' ? weddingDayAgenda : undefined}
          />
        ))}
      </div>

      <article id="free-time" className="card reveal">
        <p className="eyebrow">Free Time</p>
        <h3>Tampa & Dunedin Picks</h3>
        <p className="muted">Curated recommendations for downtime between events.</p>
      </article>

      {guideError ? <p className="error-text">{guideError}</p> : null}

      <div className="stack">
        {visibleGuideItems.map((item) => (
          <GuideCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  )
}
