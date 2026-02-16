import { z } from 'zod'
import { requireGuest } from './_lib/guest.js'
import { methodNotAllowed, readJson, sendJson, unauthorized } from './_lib/http.js'
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

    return sendJson(res, 200, { detail: mapFlightDetail(data) })
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

    return sendJson(res, 200, { ok: true, detail: mapFlightDetail(data) })
  }

  return methodNotAllowed(res)
}
