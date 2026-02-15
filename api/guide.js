import { requireGuest } from './_lib/guest.js'
import { methodNotAllowed, sendJson, unauthorized } from './_lib/http.js'
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
    .from('guide_items')
    .select('id, title, category, description, address, maps_url, sort_order')
    .order('sort_order', { ascending: true })

  if (error) {
    return sendJson(res, 500, { message: 'Could not load guide items' })
  }

  return sendJson(res, 200, {
    items: (data ?? []).map((item) => ({
      id: item.id,
      title: item.title,
      category: item.category,
      description: item.description,
      address: item.address,
      mapsUrl: item.maps_url,
      sortOrder: item.sort_order,
    })),
  })
}
