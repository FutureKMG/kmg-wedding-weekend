import { z } from 'zod'
import { canAccessVendorForum, canModerateVendorForum } from '../_lib/moderation.js'
import { requireGuest } from '../_lib/guest.js'
import { methodNotAllowed, readJson, sendJson, setNoStore, unauthorized } from '../_lib/http.js'
import { getSupabaseAdminClient } from '../_lib/supabaseAdmin.js'

const deleteReplySchema = z.object({
  replyId: z.string().uuid(),
})

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res)
  }

  const guest = await requireGuest(req)
  if (!guest) {
    return unauthorized(res)
  }

  if (!canAccessVendorForum(guest)) {
    return sendJson(res, 403, { message: 'Only vendors can access Vendor Forum.' })
  }

  const payload = await readJson(req)
  const parsed = deleteReplySchema.safeParse(payload)
  if (!parsed.success) {
    return sendJson(res, 400, { message: 'Invalid reply payload' })
  }

  const supabase = getSupabaseAdminClient()
  const existingReply = await supabase
    .from('vendor_forum_replies')
    .select('id, guest_id')
    .eq('id', parsed.data.replyId)
    .maybeSingle()

  if (existingReply.error?.message?.includes('relation "public.vendor_forum_replies" does not exist')) {
    return sendJson(res, 503, {
      message: 'Vendor Forum is not enabled yet. Run the latest Supabase migration.',
    })
  }

  if (existingReply.error) {
    return sendJson(res, 500, { message: 'Could not load reply details' })
  }

  if (!existingReply.data) {
    return sendJson(res, 404, { message: 'Reply not found' })
  }

  const canDelete = existingReply.data.guest_id === guest.id || canModerateVendorForum(guest)
  if (!canDelete) {
    return sendJson(res, 403, { message: 'You can only delete your own reply' })
  }

  const { error } = await supabase
    .from('vendor_forum_replies')
    .delete()
    .eq('id', parsed.data.replyId)

  if (error) {
    return sendJson(res, 500, { message: 'Could not delete reply' })
  }

  setNoStore(res)
  return sendJson(res, 200, { ok: true })
}
