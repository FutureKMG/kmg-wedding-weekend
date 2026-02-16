import { z } from 'zod'
import { requireGuest } from '../_lib/guest.js'
import { methodNotAllowed, readJson, sendJson, unauthorized } from '../_lib/http.js'
import { getSupabaseAdminClient } from '../_lib/supabaseAdmin.js'

const keySchema = z.string().trim().min(1).max(80).regex(/^[a-z0-9._-]+$/)
const valueSchema = z.string().max(1600)

const saveSchema = z.object({
  content: z.record(keySchema, valueSchema),
})

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res)
  }

  const guest = await requireGuest(req)
  if (!guest) {
    return unauthorized(res)
  }

  if (!guest.canEditContent) {
    return sendJson(res, 403, { message: 'Only Kara can edit dashboard text.' })
  }

  const payload = await readJson(req)
  const parsed = saveSchema.safeParse(payload)
  if (!parsed.success) {
    return sendJson(res, 400, { message: 'Invalid content payload' })
  }

  const entries = Object.entries(parsed.data.content)
  if (entries.length === 0) {
    return sendJson(res, 400, { message: 'No text content provided' })
  }

  const rows = entries.map(([contentKey, contentValue]) => ({
    content_key: contentKey,
    content_value: contentValue,
    updated_by_guest_id: guest.id,
    updated_at: new Date().toISOString(),
  }))

  const supabase = getSupabaseAdminClient()
  const { error } = await supabase
    .from('app_text_content')
    .upsert(rows, { onConflict: 'content_key' })

  if (error?.message?.includes('relation "public.app_text_content" does not exist')) {
    return sendJson(res, 503, {
      message: 'Content editing is not enabled yet. Run the latest Supabase migration.',
    })
  }

  if (error) {
    return sendJson(res, 500, { message: 'Could not save content text' })
  }

  return sendJson(res, 200, { ok: true, saved: rows.length })
}
