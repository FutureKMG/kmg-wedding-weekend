import { z } from 'zod'
import { requireGuest } from '../_lib/guest.js'
import { methodNotAllowed, readJson, sendJson, unauthorized } from '../_lib/http.js'
import { getSupabaseAdminClient } from '../_lib/supabaseAdmin.js'

const updateSchema = z.object({
  updateId: z.string().uuid(),
  message: z.string().trim().min(1).max(280),
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
    return sendJson(res, 400, { message: 'Please add a short update (1-280 characters).' })
  }

  const supabase = getSupabaseAdminClient()
  const { data: existing, error: existingError } = await supabase
    .from('feed_updates')
    .select('id, guest_id')
    .eq('id', parsed.data.updateId)
    .maybeSingle()

  if (existingError?.message?.includes('relation "public.feed_updates" does not exist')) {
    return sendJson(res, 503, {
      message: 'Feed updates are not enabled yet. Run the latest Supabase migration.',
    })
  }

  if (existingError) {
    return sendJson(res, 500, { message: 'Could not load update details' })
  }

  if (!existing) {
    return sendJson(res, 404, { message: 'Update not found' })
  }

  if (existing.guest_id !== guest.id) {
    return sendJson(res, 403, { message: 'You can only edit your own updates' })
  }

  const { error } = await supabase
    .from('feed_updates')
    .update({ message: parsed.data.message })
    .eq('id', parsed.data.updateId)

  if (error) {
    return sendJson(res, 500, { message: 'Could not save update' })
  }

  return sendJson(res, 200, { ok: true })
}
