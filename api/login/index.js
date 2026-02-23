import { z } from 'zod'
import { assertRequiredEnv } from '../_lib/env.js'
import { methodNotAllowed, readJson, sendJson } from '../_lib/http.js'
import { normalizeFullName } from '../_lib/nameNormalization.js'
import { canAccessPhilliesWelcome } from '../_lib/rsvpAccess.js'
import { createSessionToken, setSessionCookie } from '../_lib/session.js'
import { getSupabaseAdminClient } from '../_lib/supabaseAdmin.js'

const loginSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
})

const FULL_GUEST_SELECT =
  'id, first_name, last_name, table_label, can_upload, is_admin, account_type, vendor_name, can_access_vendor_forum, rsvp_reception'
const LEGACY_GUEST_SELECT = 'id, first_name, last_name, table_label, can_upload, is_admin, rsvp_reception'
const FALLBACK_LOGIN_ALIASES = {
  'katie margraf': 'katie jaffe',
}

async function getGuestByField(supabase, field, value) {
  let { data, error } = await supabase
    .from('guests')
    .select(FULL_GUEST_SELECT)
    .eq(field, value)
    .maybeSingle()

  if (error?.message?.includes('account_type') || error?.message?.includes('rsvp_reception')) {
    ;({ data, error } = await supabase
      .from('guests')
      .select(LEGACY_GUEST_SELECT)
      .eq(field, value)
      .maybeSingle())
  }

  return { data, error }
}

function mapGuestPayload(data) {
  const guest = {
    id: data.id,
    firstName: data.first_name,
    lastName: data.last_name,
    tableLabel: data.table_label,
    canUpload: Boolean(data.can_upload),
    canEditContent: Boolean(data.is_admin),
    canAccessGirlsRoom: true,
    accountType: data.account_type ?? 'guest',
    vendorName: data.vendor_name ?? null,
    canAccessVendorForum: Boolean(data.can_access_vendor_forum),
    rsvpReception: data.rsvp_reception ?? null,
    canAccessPhilliesWelcome: false,
  }
  guest.canAccessPhilliesWelcome = canAccessPhilliesWelcome(guest)
  return guest
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res)
  }

  try {
    assertRequiredEnv()

    const payload = await readJson(req)
    const parsed = loginSchema.safeParse(payload)

    if (!parsed.success) {
      return sendJson(res, 400, { message: 'Invalid login payload' })
    }

    const fullNameNorm = normalizeFullName(parsed.data.firstName, parsed.data.lastName)
    const supabase = getSupabaseAdminClient()

    let { data, error } = await getGuestByField(supabase, 'full_name_norm', fullNameNorm)

    if (error) {
      return sendJson(res, 500, { message: 'Could not validate guest list' })
    }

    if (!data) {
      const aliasLookup = await supabase
        .from('guest_login_aliases')
        .select('guest_id')
        .eq('alias_full_name_norm', fullNameNorm)
        .maybeSingle()

      if (aliasLookup.error && !aliasLookup.error.message?.includes('relation "public.guest_login_aliases" does not exist')) {
        return sendJson(res, 500, { message: 'Could not validate guest list' })
      }

      if (aliasLookup.data?.guest_id) {
        const fromAlias = await getGuestByField(supabase, 'id', aliasLookup.data.guest_id)
        if (fromAlias.error) {
          return sendJson(res, 500, { message: 'Could not validate guest list' })
        }
        data = fromAlias.data
      }

      if (!data && FALLBACK_LOGIN_ALIASES[fullNameNorm]) {
        const fallbackAlias = await getGuestByField(supabase, 'full_name_norm', FALLBACK_LOGIN_ALIASES[fullNameNorm])
        if (fallbackAlias.error) {
          return sendJson(res, 500, { message: 'Could not validate guest list' })
        }
        data = fallbackAlias.data
      }
    }

    if (!data) {
      return sendJson(res, 404, { message: 'Name not found' })
    }

    const guest = mapGuestPayload(data)

    const { token, expiresAt } = await createSessionToken(data.id)
    setSessionCookie(res, token)

    return sendJson(res, 200, {
      guest,
      expiresAt,
    })
  } catch {
    return sendJson(res, 500, { message: 'Server unavailable' })
  }
}
