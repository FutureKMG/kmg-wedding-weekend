import { z } from 'zod'
import { requireGuest } from '../_lib/guest.js'
import { methodNotAllowed, readJson, sendJson, unauthorized } from '../_lib/http.js'
import { getSupabaseAdminClient } from '../_lib/supabaseAdmin.js'

const deleteSchema = z.object({
  photoId: z.string().uuid(),
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
  const parsed = deleteSchema.safeParse(payload)

  if (!parsed.success) {
    return sendJson(res, 400, { message: 'Invalid photo payload' })
  }

  const supabase = getSupabaseAdminClient()
  const { data: photo, error: photoError } = await supabase
    .from('photos')
    .select('id, guest_id, storage_path')
    .eq('id', parsed.data.photoId)
    .maybeSingle()

  if (photoError) {
    return sendJson(res, 500, { message: 'Could not load photo details' })
  }

  if (!photo) {
    return sendJson(res, 404, { message: 'Photo not found' })
  }

  if (photo.guest_id !== guest.id) {
    return sendJson(res, 403, { message: 'You can only delete your own photos' })
  }

  const bucketName = process.env.PHOTO_BUCKET_NAME ?? 'wedding-photos'
  const { error: storageError } = await supabase.storage
    .from(bucketName)
    .remove([photo.storage_path])

  if (storageError) {
    return sendJson(res, 500, { message: 'Could not delete photo file' })
  }

  const { error: deleteError } = await supabase
    .from('photos')
    .delete()
    .eq('id', photo.id)

  if (deleteError) {
    return sendJson(res, 500, { message: 'Could not delete photo record' })
  }

  return sendJson(res, 200, { ok: true })
}
