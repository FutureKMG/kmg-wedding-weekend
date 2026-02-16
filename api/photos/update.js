import { z } from 'zod'
import { requireGuest } from '../_lib/guest.js'
import { methodNotAllowed, readJson, sendJson, unauthorized } from '../_lib/http.js'
import { getSupabaseAdminClient } from '../_lib/supabaseAdmin.js'

const updateSchema = z.object({
  photoId: z.string().uuid(),
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
  const parsed = updateSchema.safeParse(payload)

  if (!parsed.success) {
    return sendJson(res, 400, { message: 'Invalid photo payload' })
  }

  const hasCaption = Object.prototype.hasOwnProperty.call(payload, 'caption')
  const hasShare = Object.prototype.hasOwnProperty.call(payload, 'shareToFeed')
  if (!hasCaption && !hasShare) {
    return sendJson(res, 400, { message: 'Nothing to update' })
  }

  const supabase = getSupabaseAdminClient()
  const { data: existing, error: existingError } = await supabase
    .from('photos')
    .select('id, guest_id')
    .eq('id', parsed.data.photoId)
    .maybeSingle()

  if (existingError) {
    return sendJson(res, 500, { message: 'Could not load photo details' })
  }

  if (!existing) {
    return sendJson(res, 404, { message: 'Photo not found' })
  }

  if (existing.guest_id !== guest.id) {
    return sendJson(res, 403, { message: 'You can only edit your own photos' })
  }

  const updatePayload = {}
  if (hasCaption) {
    updatePayload.caption = parsed.data.caption && parsed.data.caption.length > 0
      ? parsed.data.caption
      : null
  }
  if (hasShare) {
    updatePayload.is_feed_post = parsed.data.shareToFeed ?? true
  }

  let { error } = await supabase
    .from('photos')
    .update(updatePayload)
    .eq('id', parsed.data.photoId)

  if (error?.message?.includes('is_feed_post')) {
    delete updatePayload.is_feed_post
    if (Object.keys(updatePayload).length === 0) {
      return sendJson(res, 503, {
        message: 'Photo feed settings are not enabled yet. Run the latest migration.',
      })
    }

    ;({ error } = await supabase
      .from('photos')
      .update(updatePayload)
      .eq('id', parsed.data.photoId))
  }

  if (error) {
    return sendJson(res, 500, { message: 'Could not update photo' })
  }

  return sendJson(res, 200, { ok: true })
}
