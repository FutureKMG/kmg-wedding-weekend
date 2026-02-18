import { z } from 'zod'
import { canModerateGirlsRoom } from '../_lib/moderation.js'
import { requireGuest } from '../_lib/guest.js'
import { methodNotAllowed, readJson, sendJson, setNoStore, unauthorized } from '../_lib/http.js'
import { getSupabaseAdminClient } from '../_lib/supabaseAdmin.js'

const deleteThreadSchema = z.object({
  threadId: z.string().uuid(),
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
  const parsed = deleteThreadSchema.safeParse(payload)
  if (!parsed.success) {
    return sendJson(res, 400, { message: 'Invalid thread payload' })
  }

  const supabase = getSupabaseAdminClient()
  const existingThread = await supabase
    .from('girls_room_threads')
    .select('id, guest_id')
    .eq('id', parsed.data.threadId)
    .maybeSingle()

  if (existingThread.error?.message?.includes('relation "public.girls_room_threads" does not exist')) {
    return sendJson(res, 503, {
      message: 'Girls Room is not enabled yet. Run the latest Supabase migration.',
    })
  }

  if (existingThread.error) {
    return sendJson(res, 500, { message: 'Could not load thread details' })
  }

  if (!existingThread.data) {
    return sendJson(res, 404, { message: 'Thread not found' })
  }

  const canDelete = existingThread.data.guest_id === guest.id || canModerateGirlsRoom(guest)
  if (!canDelete) {
    return sendJson(res, 403, { message: 'You can only delete your own thread' })
  }

  const { error } = await supabase
    .from('girls_room_threads')
    .delete()
    .eq('id', parsed.data.threadId)

  if (error) {
    return sendJson(res, 500, { message: 'Could not delete thread' })
  }

  setNoStore(res)
  return sendJson(res, 200, { ok: true })
}
