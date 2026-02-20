import { getSupabaseAdminClient } from './supabaseAdmin.js'
import { getSessionFromRequest } from './session.js'

export async function requireGuest(req) {
  const session = await getSessionFromRequest(req)
  if (!session) {
    return null
  }

  const supabase = getSupabaseAdminClient()
  let { data, error } = await supabase
    .from('guests')
    .select('id, first_name, last_name, table_label, can_upload, is_admin, account_type, vendor_name, can_access_vendor_forum')
    .eq('id', session.guestId)
    .maybeSingle()

  if (error?.message?.includes('account_type')) {
    ;({ data, error } = await supabase
      .from('guests')
      .select('id, first_name, last_name, table_label, can_upload, is_admin')
      .eq('id', session.guestId)
      .maybeSingle())
  }

  if (error || !data) {
    return null
  }

  return {
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
  }
}
