import { getSupabaseAdminClient } from './supabaseAdmin.js'
import { getSessionFromRequest } from './session.js'
import { canEditContentByFullNameNorm } from './contentEditor.js'

export async function requireGuest(req) {
  const session = await getSessionFromRequest(req)
  if (!session) {
    return null
  }

  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from('guests')
    .select('id, first_name, table_label, can_upload, full_name_norm')
    .eq('id', session.guestId)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  return {
    id: data.id,
    firstName: data.first_name,
    tableLabel: data.table_label,
    canUpload: Boolean(data.can_upload),
    canEditContent: canEditContentByFullNameNorm(data.full_name_norm),
  }
}
