import { useEffect, useMemo, useState } from 'react'
import { EventCard } from '../components/EventCard'
import { PageIntro } from '../components/PageIntro'
import { WeekendMapCard } from '../components/WeekendMapCard'
import { apiRequest } from '../lib/apiClient'
import { useAuth } from '../lib/auth'
import { formatEventClock, getTimelineState } from '../lib/time'
import type { WeddingEvent } from '../types'

const WEDDING_DAY_EVENT_TITLES = new Set(['ceremony', 'cocktail hour', 'reception'])

// EDT (UTC-4) — DST begins March 8, 2026
const WELCOME_PARTY_START = new Date('2026-03-13T12:00:00-04:00')
const WEDDING_START = new Date('2026-03-14T17:30:00-04:00')

function isWeddingDayCoreEvent(eventTitle: string): boolean {
  return WEDDING_DAY_EVENT_TITLES.has(eventTitle.trim().toLowerCase())
}

function formatCountdown(target: Date, now: Date): string | null {
  const ms = target.getTime() - now.getTime()
  if (ms <= 0) return null
  const totalMinutes = Math.floor(ms / 60_000)
  const days = Math.floor(totalMinutes / 1440)
  const hours = Math.floor((totalMinutes % 1440) / 60)
  const minutes = totalMinutes % 60
  if (days >= 2) return `${days} days`
  if (days === 1) return hours > 0 ? `1 day, ${hours} hrs` : '1 day'
  if (hours > 0) return minutes > 0 ? `${hours} hrs, ${minutes} min` : `${hours} hrs`
  return `${minutes} min`
}

export function WeekendPage() {
  const { guest } = useAuth()
  const [events, setEvents] = useState<WeddingEvent[]>([])
  const [eventsError, setEventsError] = useState('')
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
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  const timelineState = useMemo(() => getTimelineState(events, now), [events, now])

  const weddingCountdown = useMemo(() => formatCountdown(WEDDING_START, now), [now])
  const welcomePartyCountdown = useMemo(
    () => (guest?.canAccessPhilliesWelcome ? formatCountdown(WELCOME_PARTY_START, now) : null),
    [guest, now],
  )

  const weddingDayEvents = useMemo(
    () => events.filter((event) => isWeddingDayCoreEvent(event.title)),
    [events],
  )

  const combinedWeddingDayEvent = useMemo<WeddingEvent | null>(() => {
    if (weddingDayEvents.length === 0) return null
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
    if (!timelineState.currentEvent) return false
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

  const countdownItems = [
    welcomePartyCountdown
      ? { countdown: welcomePartyCountdown, event: 'Welcome Party', detail: 'March 13 · BayCare Ballpark' }
      : null,
    weddingCountdown
      ? { countdown: weddingCountdown, event: 'Wedding Day', detail: 'March 14 · The Fenway Hotel' }
      : null,
  ].filter(Boolean) as Array<{ countdown: string; event: string; detail: string }>

  return (
    <section className="stack weekend-page">
      <PageIntro
        eyebrow="Weekend"
        title="Weekend"
        description="A simple agenda for the full weekend."
      />

      <WeekendMapCard id="weekend-map" />

      <article id="now-next" className="card reveal">
        <p className="eyebrow">Now & Next</p>
        {timelineState.currentEvent ? (
          <>
            <h3>{timelineState.currentEvent.title}</h3>
            <p className="muted">Happening now at {timelineState.currentEvent.location}.</p>
          </>
        ) : countdownItems.length > 0 ? (
          <div className="weekend-countdown-grid" data-items={String(countdownItems.length)}>
            {countdownItems.map((item) => (
              <div key={item.event} className="weekend-countdown-item">
                <p className="weekend-countdown-number">{item.countdown}</p>
                <p className="weekend-countdown-event">{item.event}</p>
                <p className="weekend-countdown-detail">{item.detail}</p>
              </div>
            ))}
          </div>
        ) : (
          <>
            <h3>Schedule Complete</h3>
            <p className="muted">The formal timeline has wrapped for the weekend.</p>
          </>
        )}
      </article>

      {eventsError ? <p className="error-text">{eventsError}</p> : null}

      <div className="stack">
        {weekendCards.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            isCurrent={
              event.id === 'wedding-day' ? weddingDayIsCurrent : timelineState.currentEvent?.id === event.id
            }
            detailPath={event.id === 'wedding-day' ? '/weekend/events/wedding-day' : undefined}
            agendaItems={event.id === 'wedding-day' ? weddingDayAgenda : undefined}
          />
        ))}
      </div>
    </section>
  )
}
