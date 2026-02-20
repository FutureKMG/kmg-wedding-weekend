import { requireGuest } from '../_lib/guest.js'
import { methodNotAllowed, sendJson, setPrivateCache, unauthorized } from '../_lib/http.js'
import { getSupabaseAdminClient } from '../_lib/supabaseAdmin.js'

const PHILLIES_TEXT_DEFAULTS = {
  'weekend.phillies.label': 'Wedding Weekend Kickoff',
  'weekend.phillies.hero.title': 'Welcome to the Big Leagues',
  'weekend.phillies.hero.body':
    'High school sweethearts, 14+ years side by side, and still choosing each other every day. Loyalty built this love story, and the ballpark is where we begin this wedding weekend together.',
  'weekend.phillies.details.title': 'Game Day Details',
  'weekend.phillies.details.location.label': 'Location',
  'weekend.phillies.details.location.value': 'BayCare Ballpark',
  'weekend.phillies.details.date.label': 'Date',
  'weekend.phillies.details.date.value': 'Friday, March 13, 2026',
  'weekend.phillies.details.arrival.label': 'Arrival Time',
  'weekend.phillies.details.arrival.value': 'Plan to arrive by 11:30 AM so everyone can settle before first pitch.',
  'weekend.phillies.details.ticket.label': 'Ticket Access',
  'weekend.phillies.details.ticket.value':
    'Your digital ticket will be shared ahead of game day and available at check-in if you need help.',
  'weekend.phillies.details.wear.label': 'What to Wear',
  'weekend.phillies.details.wear.value':
    'Phillies gear, red/navy accents, or relaxed ballpark outfits. Keep it comfortable and weather-ready.',
  'weekend.phillies.details.transport.label': 'Parking & Transportation',
  'weekend.phillies.details.transport.value':
    'On-site parking is available. Rideshare drop-off is recommended for quick arrivals and easy exits.',
  'weekend.phillies.details.notes.label': 'Ballpark Notes',
  'weekend.phillies.details.notes.value':
    'Use a clear bag, expect sun and changing temps, and arrive early for smoother entry and concessions.',
  'weekend.phillies.meet.title': 'Meet Us at the Ballpark',
  'weekend.phillies.meet.body':
    "Meet us near the Picnic Terrace after you enter. Our wedding group seats will be marked, and we'll gather for a group photo after the 3rd inning before post-game plans.",
}

const PHILLIES_KEYS = Object.keys(PHILLIES_TEXT_DEFAULTS)

function toSection(text) {
  return {
    label: text['weekend.phillies.label'],
    hero: {
      title: text['weekend.phillies.hero.title'],
      body: text['weekend.phillies.hero.body'],
    },
    details: {
      title: text['weekend.phillies.details.title'],
      items: [
        {
          id: 'location',
          label: text['weekend.phillies.details.location.label'],
          value: text['weekend.phillies.details.location.value'],
        },
        {
          id: 'date',
          label: text['weekend.phillies.details.date.label'],
          value: text['weekend.phillies.details.date.value'],
        },
        {
          id: 'arrival',
          label: text['weekend.phillies.details.arrival.label'],
          value: text['weekend.phillies.details.arrival.value'],
        },
        {
          id: 'ticket',
          label: text['weekend.phillies.details.ticket.label'],
          value: text['weekend.phillies.details.ticket.value'],
        },
        {
          id: 'wear',
          label: text['weekend.phillies.details.wear.label'],
          value: text['weekend.phillies.details.wear.value'],
        },
        {
          id: 'transport',
          label: text['weekend.phillies.details.transport.label'],
          value: text['weekend.phillies.details.transport.value'],
        },
        {
          id: 'notes',
          label: text['weekend.phillies.details.notes.label'],
          value: text['weekend.phillies.details.notes.value'],
        },
      ],
    },
    meet: {
      title: text['weekend.phillies.meet.title'],
      body: text['weekend.phillies.meet.body'],
    },
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return methodNotAllowed(res)
  }

  const guest = await requireGuest(req)
  if (!guest) {
    return unauthorized(res)
  }

  if (!guest.canAccessPhilliesWelcome) {
    return sendJson(res, 403, { message: 'This section is only available for RSVP-attending guests.' })
  }

  const text = { ...PHILLIES_TEXT_DEFAULTS }
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from('app_text_content')
    .select('content_key, content_value')
    .in('content_key', PHILLIES_KEYS)

  if (!error && data) {
    for (const row of data) {
      if (typeof row.content_value === 'string' && row.content_key in text) {
        text[row.content_key] = row.content_value
      }
    }
  }

  setPrivateCache(res, 20, 40)
  return sendJson(res, 200, {
    section: toSection(text),
    updatedAt: new Date().toISOString(),
  })
}
