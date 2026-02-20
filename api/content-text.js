import { requireGuest } from './_lib/guest.js'
import { methodNotAllowed, sendJson, setPrivateCache, unauthorized } from './_lib/http.js'
import { canAccessPhilliesWelcome } from './_lib/rsvpAccess.js'
import { getSupabaseAdminClient } from './_lib/supabaseAdmin.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return methodNotAllowed(res)
  }

  const guest = await requireGuest(req)
  if (!guest) {
    return unauthorized(res)
  }

  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from('app_text_content')
    .select('content_key, content_value')

  if (error?.message?.includes('relation "public.app_text_content" does not exist')) {
    return sendJson(res, 200, { content: {}, migrationRequired: true })
  }

  if (error) {
    return sendJson(res, 500, { message: 'Could not load content text' })
  }

  const content = {}
  const allowPhilliesKeys = canAccessPhilliesWelcome(guest)
  for (const item of data ?? []) {
    if (!allowPhilliesKeys && item.content_key.startsWith('weekend.phillies.')) {
      continue
    }
    content[item.content_key] = item.content_value
  }

  setPrivateCache(res, 20, 40)
  return sendJson(res, 200, { content })
}
