import { describe, expect, test } from 'vitest'
import {
  getWelcomePartyGoogleCalendarUrl,
  getWelcomePartyIcsText,
  welcomePartyContent,
} from './welcomeParty'

describe('welcome party calendar helpers', () => {
  test('builds a google calendar url with title and timezone', () => {
    const url = getWelcomePartyGoogleCalendarUrl()
    const parsed = new URL(url)
    const title = parsed.searchParams.get('text')

    expect(url).toContain('calendar.google.com/calendar/render')
    expect(title).toBe(welcomePartyContent.title)
    expect(url).toContain('ctz=America%2FNew_York')
  })

  test('builds ics content with event details', () => {
    const ics = getWelcomePartyIcsText()

    expect(ics).toContain('BEGIN:VCALENDAR')
    expect(ics).toContain(`SUMMARY:${welcomePartyContent.title}`)
    expect(ics).toContain('DTSTART:')
    expect(ics).toContain('DTEND:')
  })
})
