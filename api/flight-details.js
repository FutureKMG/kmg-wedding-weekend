import { z } from 'zod'
import { requireGuest } from './_lib/guest.js'
import {
  methodNotAllowed,
  readJson,
  sendJson,
  setNoStore,
  setPrivateCache,
  unauthorized,
} from './_lib/http.js'
import { getSupabaseAdminClient } from './_lib/supabaseAdmin.js'

const FLIGHT_AIRPORTS = ['TPA', 'PIE']

const flightSaveSchema = z.object({
  arrivalAirport: z.enum(FLIGHT_AIRPORTS),
  arrivalTime: z.string().trim().min(1).max(64),
  airline: z.string().trim().max(80).optional(),
  flightNumber: z.string().trim().max(24).optional(),
  notes: z.string().trim().max(280).optional(),
})

function mapFlightDetail(row) {
  if (!row) {
    return null
  }

  return {
    arrivalAirport: row.arrival_airport,
    arrivalTime: row.arrival_time,
    airline: row.airline,
    flightNumber: row.flight_number,
    notes: row.notes,
    updatedAt: row.updated_at,
  }
}

function mapSharedFlight(row) {
  if (!row) {
    return null
  }

  const guestRow = Array.isArray(row.guests) ? row.guests[0] : row.guests
  if (!guestRow) {
    return null
  }

  return {
    guestId: row.guest_id,
    firstName: guestRow.first_name,
    lastName: guestRow.last_name,
    arrivalAirport: row.arrival_airport,
    arrivalTime: row.arrival_time,
    airline: row.airline,
    flightNumber: row.flight_number,
    notes: row.notes,
    updatedAt: row.updated_at,
  }
}

async function loadGuestSharingContext(supabase, guestId) {
  const { data, error } = await supabase
    .from('guests')
    .select('id, last_name, flight_group_key')
    .eq('id', guestId)
    .maybeSingle()

  if (error?.message?.includes('guests.flight_group_key')) {
    const fallback = await supabase
      .from('guests')
      .select('id, last_name')
      .eq('id', guestId)
      .maybeSingle()

    if (fallback.error || !fallback.data) {
      return { context: null, error: fallback.error }
    }

    return {
      context: {
        id: fallback.data.id,
        last_name: fallback.data.last_name,
        flight_group_key: null,
      },
      error: null,
    }
  }

  if (error || !data) {
    return { context: null, error }
  }

  return { context: data, error: null }
}

async function loadSharedGuestIds(supabase, guest) {
  const guestIds = new Set()

  if (guest.last_name) {
    const { data: familyRows, error: familyError } = await supabase
      .from('guests')
      .select('id')
      .ilike('last_name', guest.last_name)
      .neq('id', guest.id)

    if (!familyError) {
      for (const row of familyRows ?? []) {
        guestIds.add(row.id)
      }
    }
  }

  const groupKey = guest.flight_group_key?.trim()
  if (groupKey) {
    const { data: groupRows, error: groupError } = await supabase
      .from('guests')
      .select('id')
      .eq('flight_group_key', groupKey)
      .neq('id', guest.id)

    if (!groupError) {
      for (const row of groupRows ?? []) {
        guestIds.add(row.id)
      }
    }
  }

  return Array.from(guestIds)
}

export default async function handler(req, res) {
  const guest = await requireGuest(req)
  if (!guest) {
    return unauthorized(res)
  }

  const supabase = getSupabaseAdminClient()

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('flight_details')
      .select('arrival_airport, arrival_time, airline, flight_number, notes, updated_at')
      .eq('guest_id', guest.id)
      .maybeSingle()

    if (error?.message?.includes('relation "public.flight_details" does not exist')) {
      return sendJson(res, 200, { detail: null, migrationRequired: true })
    }

    if (error) {
      return sendJson(res, 500, { message: 'Could not load flight details' })
    }

    const { context, error: contextError } = await loadGuestSharingContext(supabase, guest.id)
    if (contextError || !context) {
      setPrivateCache(res, 20, 40)
      return sendJson(res, 200, { detail: mapFlightDetail(data), party: [] })
    }

    const sharedGuestIds = await loadSharedGuestIds(supabase, context)
    if (sharedGuestIds.length === 0) {
      setPrivateCache(res, 20, 40)
      return sendJson(res, 200, { detail: mapFlightDetail(data), party: [] })
    }

    const { data: partyRows, error: partyError } = await supabase
      .from('flight_details')
      .select(
        'guest_id, arrival_airport, arrival_time, airline, flight_number, notes, updated_at, guests!inner(first_name,last_name)',
      )
      .in('guest_id', sharedGuestIds)
      .order('arrival_time', { ascending: true })

    if (partyError) {
      setPrivateCache(res, 20, 40)
      return sendJson(res, 200, { detail: mapFlightDetail(data), party: [] })
    }

    const party = (partyRows ?? [])
      .map(mapSharedFlight)
      .filter(Boolean)

    setPrivateCache(res, 20, 40)
    return sendJson(res, 200, { detail: mapFlightDetail(data), party })
  }

  if (req.method === 'POST') {
    const payload = await readJson(req)
    const parsed = flightSaveSchema.safeParse(payload)
    if (!parsed.success) {
      return sendJson(res, 400, { message: 'Invalid flight detail payload' })
    }

    const arrivalDate = new Date(parsed.data.arrivalTime)
    if (Number.isNaN(arrivalDate.getTime())) {
      return sendJson(res, 400, { message: 'Arrival date/time is invalid' })
    }

    const row = {
      guest_id: guest.id,
      arrival_airport: parsed.data.arrivalAirport,
      arrival_time: arrivalDate.toISOString(),
      airline: parsed.data.airline || null,
      flight_number: parsed.data.flightNumber || null,
      notes: parsed.data.notes || null,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('flight_details')
      .upsert(row, { onConflict: 'guest_id' })
      .select('arrival_airport, arrival_time, airline, flight_number, notes, updated_at')
      .maybeSingle()

    if (error?.message?.includes('relation "public.flight_details" does not exist')) {
      return sendJson(res, 503, {
        message: 'Flight details are not enabled yet. Run the latest Supabase migration.',
      })
    }

    if (error) {
      return sendJson(res, 500, { message: 'Could not save flight details' })
    }

    setNoStore(res)
    return sendJson(res, 200, { ok: true, detail: mapFlightDetail(data) })
  }

  return methodNotAllowed(res)
}
