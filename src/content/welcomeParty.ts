const welcomePartyTitle = 'Welcome Party: Phillies vs. Orioles Spring Training Game'
const welcomePartyLocationName = 'BayCare Ballpark'
const welcomePartyAddress = '601 Old Coachman Road, Clearwater, FL 33765'
const welcomePartyStartIso = '2026-03-13T12:00:00-05:00'
const welcomePartyEndIso = '2026-03-13T16:00:00-05:00'

export const welcomePartyContent = {
  title: welcomePartyTitle,
  subtitle: 'The Game Before',
  matchup: 'Phillies vs. Orioles',
  venue: welcomePartyLocationName,
  dateLabel: 'Friday, March 13, 2026',
  timeLabel: '12:00 PM - 4:00 PM',
  dateStartIso: welcomePartyStartIso,
  dateEndIso: welcomePartyEndIso,
  timezone: 'America/New_York',
  locationName: welcomePartyLocationName,
  locationAddress: welcomePartyAddress,
  sectionLabel: 'Private Picnic Terrace',
  buffetLabel: 'All-you-can-eat buffet from 12:00 PM - 2:00 PM',
  timelineMicrocopy: 'Tap for Game Details ->',
  mapsUrl: 'https://maps.google.com/?cid=742843336731204491',
  icsFilename: 'kara-kevin-welcome-party.ics',
  description:
    "We can't wait to kick off the weekend with you at BayCare Ballpark. Instead of a traditional \"Night Before,\" we're hosting a \"Game Before\" to ease into the celebrations.",
  descriptionContinued:
    "We've reserved a private section of the Picnic Terrace with an all-you-can-eat buffet from 12:00 PM to 2:00 PM. Arrive anytime after gates open for baseball, sunshine, and ballpark snacks.",
  attire:
    "Attire: Casual and comfortable. We'll be in a reserved part of the Picnic Terrace, so breezy outfits and comfy shoes are perfect for a sunny afternoon at the ballpark.",
}

function toGoogleDate(dateIso: string): string {
  return new Date(dateIso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
}

function escapeIcsText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n')
}

export function getWelcomePartyGoogleCalendarUrl(): string {
  const startUtc = toGoogleDate(welcomePartyContent.dateStartIso)
  const endUtc = toGoogleDate(welcomePartyContent.dateEndIso)
  const details = encodeURIComponent(
    `${welcomePartyContent.description}\n\n${welcomePartyContent.descriptionContinued}`,
  )

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: welcomePartyContent.title,
    dates: `${startUtc}/${endUtc}`,
    details,
    location: `${welcomePartyContent.locationName}, ${welcomePartyContent.locationAddress}`,
    ctz: welcomePartyContent.timezone,
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export function getWelcomePartyIcsText(): string {
  const createdAtUtc = toGoogleDate(new Date().toISOString())
  const startUtc = toGoogleDate(welcomePartyContent.dateStartIso)
  const endUtc = toGoogleDate(welcomePartyContent.dateEndIso)

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Kara and Kevin Wedding Weekend//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:welcome-party-${startUtc}@kara-kevin-weekend`,
    `DTSTAMP:${createdAtUtc}`,
    `DTSTART:${startUtc}`,
    `DTEND:${endUtc}`,
    `SUMMARY:${escapeIcsText(welcomePartyContent.title)}`,
    `LOCATION:${escapeIcsText(`${welcomePartyContent.locationName}, ${welcomePartyContent.locationAddress}`)}`,
    `DESCRIPTION:${escapeIcsText(`${welcomePartyContent.description}\n\n${welcomePartyContent.descriptionContinued}`)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}
