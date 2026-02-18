import type { WeddingEvent } from '../types'

const CALENDAR_UID_DOMAIN = 'gilmore-wedding-weekend.app'

function escapeIcsValue(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
}

function formatIcsDate(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z')
}

function fallbackEndDate(startDate: Date): Date {
  return new Date(startDate.getTime() + 60 * 60 * 1000)
}

export function buildCalendarFilename(event: WeddingEvent): string {
  const slug = event.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${slug || 'wedding-event'}.ics`
}

export function buildCalendarIcs(event: WeddingEvent): string {
  const parsedStart = new Date(event.startAt)
  const startDate = Number.isNaN(parsedStart.getTime()) ? new Date() : parsedStart

  const parsedEnd = new Date(event.endAt)
  const endDate =
    Number.isNaN(parsedEnd.getTime()) || parsedEnd <= startDate
      ? fallbackEndDate(startDate)
      : parsedEnd

  const location = event.location
    ? `${event.location}, Tampa Bay, Florida`
    : 'Tampa Bay, Florida'

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//A Gilmore Wedding Weekend//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${escapeIcsValue(`${event.id}@${CALENDAR_UID_DOMAIN}`)}`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(startDate)}`,
    `DTEND:${formatIcsDate(endDate)}`,
    `SUMMARY:${escapeIcsValue(event.title)}`,
    `LOCATION:${escapeIcsValue(location)}`,
    `DESCRIPTION:${escapeIcsValue(`A Gilmore Wedding Weekend: ${event.title}`)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]

  return `${lines.join('\r\n')}\r\n`
}

export function buildCalendarDataUri(event: WeddingEvent): string {
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(buildCalendarIcs(event))}`
}
