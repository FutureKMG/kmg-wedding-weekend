import { z } from 'zod'
import { assertRequiredEnv } from '../_lib/env.js'
import { methodNotAllowed, readJson, sendJson } from '../_lib/http.js'
import { normalizeNamePart } from '../_lib/nameNormalization.js'
import { createSessionToken, setSessionCookie } from '../_lib/session.js'
import { getSupabaseAdminClient } from '../_lib/supabaseAdmin.js'

const vendorLoginSchema = z.object({
  vendorName: z.string().trim().min(1).max(160),
})

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res)
  }

  try {
    assertRequiredEnv()
    const payload = await readJson(req)
    const parsed = vendorLoginSchema.safeParse(payload)
    if (!parsed.success) {
      return sendJson(res, 400, { message: 'Invalid vendor login payload' })
    }

    const requestedVendor = normalizeNamePart(parsed.data.vendorName)
    const supabase = getSupabaseAdminClient()

    const { data, error } = await supabase
      .from('guests')
      .select('id, first_name, last_name, table_label, can_upload, is_admin, account_type, vendor_name, can_access_vendor_forum')
      .eq('account_type', 'vendor')

    if (error?.message?.includes('account_type')) {
      return sendJson(res, 503, {
        message: 'Vendor login is not enabled yet. Run the latest database migration.',
      })
    }

    if (error) {
      return sendJson(res, 500, { message: 'Could not validate vendor login' })
    }

    const match = (data ?? []).find((row) => normalizeNamePart(row.vendor_name ?? '') === requestedVendor)
    if (!match) {
      return sendJson(res, 404, { message: 'Vendor not found' })
    }

    const { token, expiresAt } = await createSessionToken(match.id)
    setSessionCookie(res, token)

    return sendJson(res, 200, {
      guest: {
        id: match.id,
        firstName: match.first_name,
        lastName: match.last_name,
        tableLabel: match.table_label,
        canUpload: Boolean(match.can_upload),
        canEditContent: Boolean(match.is_admin),
        canAccessGirlsRoom: true,
        accountType: match.account_type ?? 'vendor',
        vendorName: match.vendor_name ?? parsed.data.vendorName,
        canAccessVendorForum: Boolean(match.can_access_vendor_forum),
      },
      expiresAt,
    })
  } catch {
    return sendJson(res, 500, { message: 'Server unavailable' })
  }
}
