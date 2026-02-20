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
import { formatGuestDisplayName } from './_lib/displayName.js'
import { getSupabaseAdminClient } from './_lib/supabaseAdmin.js'

const updateSchema = z.object({
  message: z.string().trim().min(1).max(280),
})

function getQueryLimit(req) {
  const raw = Array.isArray(req.query?.limit) ? req.query.limit[0] : req.query?.limit
  const parsed = Number.parseInt(raw ?? '20', 10)
  if (Number.isNaN(parsed)) {
    return 20
  }

  return Math.max(1, Math.min(parsed, 100))
}

export default async function handler(req, res) {
  const guest = await requireGuest(req)
  if (!guest) {
    return unauthorized(res)
  }

  const supabase = getSupabaseAdminClient()

  if (req.method === 'GET') {
    const limit = getQueryLimit(req)
    let { data, error } = await supabase
      .from('feed_updates')
      .select('id, guest_id, message, created_at, guests(first_name,last_name,account_type,vendor_name)')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error?.message?.includes('account_type')) {
      ;({ data, error } = await supabase
        .from('feed_updates')
        .select('id, guest_id, message, created_at, guests(first_name,last_name)')
        .order('created_at', { ascending: false })
        .limit(limit))
    }

    if (error?.message?.includes('relation "public.feed_updates" does not exist')) {
      return sendJson(res, 200, { updates: [], migrationRequired: true })
    }

    if (error) {
      return sendJson(res, 500, { message: 'Could not load wedding feed updates' })
    }

    const updates = (data ?? []).map((item) => {
      const owner = Array.isArray(item.guests) ? item.guests[0] : item.guests
      return {
        id: item.id,
        message: item.message,
        createdAt: item.created_at,
        postedBy: formatGuestDisplayName(owner),
        isOwner: item.guest_id === guest.id,
      }
    })

    setPrivateCache(res, 8, 20)
    return sendJson(res, 200, { updates })
  }

  if (req.method === 'POST') {
    const payload = await readJson(req)
    const parsed = updateSchema.safeParse(payload)
    if (!parsed.success) {
      return sendJson(res, 400, { message: 'Please add a short update (1-280 characters).' })
    }

    const { error } = await supabase.from('feed_updates').insert({
      guest_id: guest.id,
      message: parsed.data.message,
    })

    if (error?.message?.includes('relation "public.feed_updates" does not exist')) {
      return sendJson(res, 503, {
        message: 'Feed updates are not enabled yet. Run the latest Supabase migration.',
      })
    }

    if (error) {
      return sendJson(res, 500, { message: 'Could not post update' })
    }

    setNoStore(res)
    return sendJson(res, 200, { ok: true })
  }

  return methodNotAllowed(res)
}
