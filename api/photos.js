import { requireGuest } from './_lib/guest.js'
import { methodNotAllowed, sendJson, unauthorized } from './_lib/http.js'
import { getSupabaseAdminClient } from './_lib/supabaseAdmin.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return methodNotAllowed(res)
  }

  const guest = await requireGuest(req)
  if (!guest) {
    return unauthorized(res)
  }

  const scope = Array.isArray(req.query?.scope)
    ? req.query.scope[0]
    : req.query?.scope

  const supabase = getSupabaseAdminClient()

  let query = supabase
    .from('photos')
    .select(
      'id, caption, storage_path, created_at, is_feed_post, guests(first_name,last_name)',
    )
    .order('created_at', { ascending: false })

  if (scope === 'feed') {
    query = query.eq('is_feed_post', true)
  }

  let { data, error } = await query
  let hasFeedColumn = true

  if (error?.message?.includes('photos.is_feed_post')) {
    hasFeedColumn = false
    ;({ data, error } = await supabase
      .from('photos')
      .select('id, caption, storage_path, created_at, guests(first_name,last_name)')
      .order('created_at', { ascending: false }))
  }

  if (error) {
    return sendJson(res, 500, { message: 'Could not load photos' })
  }

  const photos = await Promise.all(
    (data ?? []).map(async (photo) => {
      const uploadOwner = Array.isArray(photo.guests) ? photo.guests[0] : photo.guests
      const fullName = uploadOwner
        ? `${uploadOwner.first_name} ${uploadOwner.last_name}`
        : 'Guest'

      const { data: signed, error: signedError } = await supabase.storage
        .from('wedding-photos')
        .createSignedUrl(photo.storage_path, 60 * 60)

      if (signedError || !signed) {
        return null
      }

      return {
        id: photo.id,
        imageUrl: signed.signedUrl,
        caption: photo.caption,
        uploadedBy: fullName,
        createdAt: photo.created_at,
        isFeedPost: hasFeedColumn ? Boolean(photo.is_feed_post) : true,
      }
    }),
  )

  return sendJson(res, 200, {
    photos: photos.filter(Boolean),
  })
}
