import { z } from 'zod'
import { requireGuest } from '../_lib/guest.js'
import { methodNotAllowed, readJson, sendJson, setNoStore, unauthorized } from '../_lib/http.js'
import { getSupabaseAdminClient } from '../_lib/supabaseAdmin.js'

const createReplySchema = z.object({
  threadId: z.string().uuid(),
  message: z.string().trim().min(1).max(320),
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
  const parsed = createReplySchema.safeParse(payload)
  if (!parsed.success) {
    return sendJson(res, 400, { message: 'Please add a short reply.' })
  }

  const supabase = getSupabaseAdminClient()
  const existingThread = await supabase
    .from('girls_room_threads')
    .select('id')
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

  const { error } = await supabase.from('girls_room_replies').insert({
    thread_id: parsed.data.threadId,
    guest_id: guest.id,
    message: parsed.data.message,
  })

  if (error?.message?.includes('relation "public.girls_room_replies" does not exist')) {
    return sendJson(res, 503, {
      message: 'Girls Room is not enabled yet. Run the latest Supabase migration.',
    })
  }

  if (error) {
    return sendJson(res, 500, { message: 'Could not post reply' })
  }

  setNoStore(res)
  return sendJson(res, 200, { ok: true })
}
