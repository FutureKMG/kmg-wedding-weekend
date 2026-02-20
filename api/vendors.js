import { methodNotAllowed, sendJson, setPrivateCache } from './_lib/http.js'
import { getSupabaseAdminClient } from './_lib/supabaseAdmin.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return methodNotAllowed(res)
  }

  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from('guests')
    .select('vendor_name, account_type')
    .eq('account_type', 'vendor')

  if (error?.message?.includes('account_type')) {
    return sendJson(res, 200, { vendors: [], migrationRequired: true })
  }

  if (error) {
    return sendJson(res, 500, { message: 'Could not load vendors' })
  }

  const vendors = (data ?? [])
    .map((row) => row.vendor_name)
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right))

  setPrivateCache(res, 60, 120)
  return sendJson(res, 200, { vendors })
}
