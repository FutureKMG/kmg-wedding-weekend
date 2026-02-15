import { formatDistanceStrict } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import type { WeddingEvent } from '../types'

const EVENT_TIMEZONE = 'America/New_York'

type TimelineState = {
  currentEvent: WeddingEvent | null
  nextEvent: WeddingEvent | null
  countdown: string | null
}

export function getTimelineState(
  events: WeddingEvent[],
  now = new Date(),
): TimelineState {
  if (events.length === 0) {
    return { currentEvent: null, nextEvent: null, countdown: null }
  }

  const currentEvent =
    events.find((event) => {
      const start = new Date(event.startAt)
      const end = new Date(event.endAt)
      return now >= start && now < end
    }) ?? null

  const nextEvent =
    events.find((event) => {
      const start = new Date(event.startAt)
      return now < start
    }) ?? null

  const countdown = nextEvent
    ? formatDistanceStrict(new Date(nextEvent.startAt), now)
    : null

  return { currentEvent, nextEvent, countdown }
}

export function formatEventClock(isoString: string): string {
  return formatInTimeZone(isoString, EVENT_TIMEZONE, 'h:mm a')
}
