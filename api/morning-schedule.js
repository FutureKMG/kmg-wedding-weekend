import { requireGuest } from './_lib/guest.js'
import { methodNotAllowed, sendJson, setPrivateCache, unauthorized } from './_lib/http.js'
import { getSupabaseAdminClient } from './_lib/supabaseAdmin.js'

const FALLBACK_LOCATION = 'Fenway Hotel'
const SERVICE_LABELS = {
  hair: 'Hair',
  makeup: 'Makeup',
  bride_hair: 'Bride Hair',
  bride_makeup: 'Bride Makeup',
  junior_hair: 'Junior Hair',
}

function toAssignment(row) {
  return {
    id: row.id,
    serviceType: row.service_type,
    serviceLabel: SERVICE_LABELS[row.service_type] ?? row.service_type,
    artistName: row.artist_name,
    startAt: row.start_at,
    location: row.location || FALLBACK_LOCATION,
    notes: row.notes ?? null,
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

  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from('morning_schedule_assignments')
    .select('id, service_type, artist_name, start_at, location, notes')
    .eq('guest_id', guest.id)
    .eq('is_active', true)
    .order('start_at', { ascending: true })

  if (error?.message?.includes('relation "public.morning_schedule_assignments" does not exist')) {
    return sendJson(res, 200, {
      location: FALLBACK_LOCATION,
      timezone: 'America/New_York',
      weddingDate: '2026-03-14',
      finishTime: '2026-03-14T14:15:00-04:00',
      photoReadyTime: '2026-03-14T14:30:00-04:00',
      arrivalLeadMinutes: 15,
      assignments: [],
      migrationRequired: true,
    })
  }

  if (error) {
    return sendJson(res, 500, { message: 'Could not load morning schedule' })
  }

  const assignments = (data ?? []).map(toAssignment)
  const location = assignments[0]?.location ?? FALLBACK_LOCATION

  setPrivateCache(res, 20, 40)
  return sendJson(res, 200, {
    location,
    timezone: 'America/New_York',
    weddingDate: '2026-03-14',
    finishTime: '2026-03-14T14:15:00-04:00',
    photoReadyTime: '2026-03-14T14:30:00-04:00',
    arrivalLeadMinutes: 15,
    assignments,
  })
}
