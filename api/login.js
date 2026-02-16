import { z } from 'zod'
import { assertRequiredEnv } from './_lib/env.js'
import { methodNotAllowed, readJson, sendJson } from './_lib/http.js'
import { normalizeFullName } from './_lib/nameNormalization.js'
import { createSessionToken, setSessionCookie } from './_lib/session.js'
import { getSupabaseAdminClient } from './_lib/supabaseAdmin.js'
import { canEditContentByFullNameNorm } from './_lib/contentEditor.js'

const loginSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
})

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

    const { data, error } = await supabase
      .from('guests')
      .select('id, first_name, table_label, can_upload, full_name_norm')
      .eq('full_name_norm', fullNameNorm)
      .maybeSingle()

    if (error) {
      return sendJson(res, 500, { message: 'Could not validate guest list' })
    }

    if (!data) {
      return sendJson(res, 404, { message: 'Name not found' })
    }

    const { token, expiresAt } = await createSessionToken(data.id)
    setSessionCookie(res, token)

    return sendJson(res, 200, {
      guest: {
        id: data.id,
        firstName: data.first_name,
        tableLabel: data.table_label,
        canUpload: Boolean(data.can_upload),
        canEditContent: canEditContentByFullNameNorm(data.full_name_norm),
      },
      expiresAt,
    })
  } catch {
    return sendJson(res, 500, { message: 'Server unavailable' })
  }
}
