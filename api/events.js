import { requireGuest } from './_lib/guest.js'
import { methodNotAllowed, sendJson, setPrivateCache, unauthorized } from './_lib/http.js'
import { getSupabaseAdminClient } from './_lib/supabaseAdmin.js'

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
    .from('events')
    .select('id, title, location, start_at, end_at, sort_order')
    .order('sort_order', { ascending: true })

  if (error) {
    return sendJson(res, 500, { message: 'Could not load events' })
  }

  setPrivateCache(res, 30, 90)
  return sendJson(res, 200, {
    events: (data ?? []).map((event) => ({
      id: event.id,
      title: event.title,
      location: event.location,
      startAt: event.start_at,
      endAt: event.end_at,
      sortOrder: event.sort_order,
    })),
  })
}
