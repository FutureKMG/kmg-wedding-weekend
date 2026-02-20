import { requireGuest } from './_lib/guest.js'
import { formatGuestDisplayName } from './_lib/displayName.js'
import { methodNotAllowed, sendJson, setPrivateCache, unauthorized } from './_lib/http.js'
import { getSupabaseAdminClient } from './_lib/supabaseAdmin.js'

function getPhotoLimit(req, scope) {
  const raw = Array.isArray(req.query?.limit) ? req.query.limit[0] : req.query?.limit
  const parsed = Number.parseInt(raw ?? '', 10)
  const defaultLimit = scope === 'feed' ? 48 : 320
  const maxLimit = scope === 'feed' ? 120 : 600

  if (Number.isNaN(parsed)) {
    return defaultLimit
  }

  return Math.max(1, Math.min(parsed, maxLimit))
}

async function createSignedUrlMap(supabase, bucketName, storagePaths, expiresInSeconds) {
  const paths = Array.from(new Set(storagePaths.filter(Boolean)))
  const signedUrlByPath = new Map()

  if (paths.length === 0) {
    return signedUrlByPath
  }

  const bucket = supabase.storage.from(bucketName)
  const batch = await bucket.createSignedUrls(paths, expiresInSeconds)

  if (!batch.error && Array.isArray(batch.data)) {
    for (let index = 0; index < batch.data.length; index += 1) {
      const item = batch.data[index]
      const path = item?.path ?? paths[index]
      if (path && item?.signedUrl) {
        signedUrlByPath.set(path, item.signedUrl)
      }
    }
  }

  if (signedUrlByPath.size === paths.length) {
    return signedUrlByPath
  }

  await Promise.all(
    paths.map(async (path) => {
      if (signedUrlByPath.has(path)) {
        return
      }

      const single = await bucket.createSignedUrl(path, expiresInSeconds)
      if (!single.error && single.data?.signedUrl) {
        signedUrlByPath.set(path, single.data.signedUrl)
      }
    }),
  )

  return signedUrlByPath
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return methodNotAllowed(res)
  }

  const guest = await requireGuest(req)
  if (!guest) {
    return unauthorized(res)
  }

  const bucketName = process.env.PHOTO_BUCKET_NAME ?? 'wedding-photos'
  const scope = Array.isArray(req.query?.scope)
    ? req.query.scope[0]
    : req.query?.scope
  const limit = getPhotoLimit(req, scope)

  const supabase = getSupabaseAdminClient()
  const ownerSelectVendorAware = 'guests(first_name,last_name,account_type,vendor_name)'
  const ownerSelectLegacy = 'guests(first_name,last_name)'
  let ownerSelect = ownerSelectVendorAware

  let query = supabase
    .from('photos')
    .select(
      `id, guest_id, caption, storage_path, created_at, is_feed_post, ${ownerSelect}`,
    )
    .order('created_at', { ascending: false })
    .limit(limit)

  if (scope === 'feed') {
    query = query.eq('is_feed_post', true)
  }

  let { data, error } = await query
  let hasFeedColumn = true

  if (error?.message?.includes('account_type')) {
    ownerSelect = ownerSelectLegacy
    let legacyQuery = supabase
      .from('photos')
      .select(`id, guest_id, caption, storage_path, created_at, is_feed_post, ${ownerSelect}`)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (scope === 'feed') {
      legacyQuery = legacyQuery.eq('is_feed_post', true)
    }

    ;({ data, error } = await legacyQuery)
  }

  if (error?.message?.includes('photos.is_feed_post')) {
    hasFeedColumn = false
    ;({ data, error } = await supabase
      .from('photos')
      .select(`id, guest_id, caption, storage_path, created_at, ${ownerSelect}`)
      .order('created_at', { ascending: false })
      .limit(limit))
  }

  if (error) {
    return sendJson(res, 500, { message: 'Could not load photos' })
  }

  const rows = data ?? []
  const signedUrlByPath = await createSignedUrlMap(
    supabase,
    bucketName,
    rows.map((row) => row.storage_path),
    60 * 60,
  )

  const photos = rows.map((photo) => {
    const signedUrl = signedUrlByPath.get(photo.storage_path)
    if (!signedUrl) {
      return null
    }

    const uploadOwner = Array.isArray(photo.guests) ? photo.guests[0] : photo.guests
    const fullName = formatGuestDisplayName(uploadOwner)

    return {
      id: photo.id,
      imageUrl: signedUrl,
      caption: photo.caption,
      uploadedBy: fullName,
      createdAt: photo.created_at,
      isFeedPost: hasFeedColumn ? Boolean(photo.is_feed_post) : true,
      isOwner: photo.guest_id === guest.id,
    }
  })

  setPrivateCache(res, 15, 45)
  return sendJson(res, 200, {
    photos: photos.filter(Boolean),
  })
}
