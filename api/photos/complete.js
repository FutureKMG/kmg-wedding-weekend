import { z } from 'zod'
import { requireGuest } from '../_lib/guest.js'
import { methodNotAllowed, readJson, sendJson, unauthorized } from '../_lib/http.js'
import { getSupabaseAdminClient } from '../_lib/supabaseAdmin.js'

const completeSchema = z.object({
  path: z.string().trim().min(1).max(500),
  caption: z.string().trim().max(160).optional(),
  shareToFeed: z.boolean().optional(),
})

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res)
  }

  const guest = await requireGuest(req)
  if (!guest) {
    return unauthorized(res)
  }

  const payload = await readJson(req)
  const parsed = completeSchema.safeParse(payload)

  if (!parsed.success) {
    return sendJson(res, 400, { message: 'Invalid photo payload' })
  }

  const supabase = getSupabaseAdminClient()
  const insertPayload = {
    guest_id: guest.id,
    storage_path: parsed.data.path,
    caption: parsed.data.caption ?? null,
    is_feed_post: parsed.data.shareToFeed ?? true,
  }

  let { error } = await supabase.from('photos').insert(insertPayload)

  if (error?.message?.includes('is_feed_post')) {
    const fallbackPayload = {
      guest_id: guest.id,
      storage_path: parsed.data.path,
      caption: parsed.data.caption ?? null,
    }
    ;({ error } = await supabase.from('photos').insert(fallbackPayload))
  }

  if (error) {
    return sendJson(res, 500, { message: 'Could not save photo metadata' })
  }

  return sendJson(res, 200, { ok: true })
}
