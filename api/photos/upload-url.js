import { z } from 'zod'
import { requireGuest } from '../_lib/guest.js'
import { methodNotAllowed, readJson, sendJson, unauthorized } from '../_lib/http.js'
import { getSupabaseAdminClient } from '../_lib/supabaseAdmin.js'

const uploadSchema = z.object({
  filename: z.string().trim().min(1).max(255),
})

function sanitizeFilename(filename) {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, '-')
    .replace(/-+/g, '-')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res)
  }

  const guest = await requireGuest(req)
  if (!guest) {
    return unauthorized(res)
  }

  if (!guest.canUpload) {
    return sendJson(res, 403, { message: 'Photo uploads are disabled for this guest' })
  }

  const payload = await readJson(req)
  const parsed = uploadSchema.safeParse(payload)

  if (!parsed.success) {
    return sendJson(res, 400, { message: 'Invalid upload payload' })
  }

  const safeFilename = sanitizeFilename(parsed.data.filename)
  const path = `${guest.id}/${Date.now()}-${safeFilename}`

  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase.storage
    .from('wedding-photos')
    .createSignedUploadUrl(path)

  if (error || !data) {
    return sendJson(res, 500, { message: 'Could not create upload URL' })
  }

  return sendJson(res, 200, {
    path: data.path,
    token: data.token,
  })
}
