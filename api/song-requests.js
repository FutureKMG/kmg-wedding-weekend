import { z } from 'zod'
import { requireGuest } from './_lib/guest.js'
import { methodNotAllowed, readJson, sendJson, unauthorized } from './_lib/http.js'
import { getSupabaseAdminClient } from './_lib/supabaseAdmin.js'

const requestSchema = z.object({
  songTitle: z.string().trim().min(1).max(120),
  artist: z.string().trim().max(120).optional(),
  note: z.string().trim().max(240).optional(),
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
  const parsed = requestSchema.safeParse(payload)

  if (!parsed.success) {
    return sendJson(res, 400, { message: 'Invalid song request payload' })
  }

  const supabase = getSupabaseAdminClient()

  const { error } = await supabase.from('song_requests').insert({
    guest_id: guest.id,
    song_title: parsed.data.songTitle,
    artist: parsed.data.artist ?? null,
    note: parsed.data.note ?? null,
  })

  if (error) {
    return sendJson(res, 500, { message: 'Could not save song request' })
  }

  return sendJson(res, 200, { ok: true })
}
