import { requireGuest } from './_lib/guest.js'
import { methodNotAllowed, sendJson, setPrivateCache, unauthorized } from './_lib/http.js'
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
  let seatingPayload = {
    tableLabel: guest.tableLabel,
    mealSelection: null,
    dietaryRestrictions: null,
  }

  const { data, error } = await supabase
    .from('guests')
    .select('table_label, meal_selection, dietary_restrictions')
    .eq('id', guest.id)
    .maybeSingle()

  if (error?.message?.includes('meal_selection')) {
    const fallback = await supabase
      .from('guests')
      .select('table_label')
      .eq('id', guest.id)
      .maybeSingle()

    if (fallback.data) {
      seatingPayload = {
        ...seatingPayload,
        tableLabel: fallback.data.table_label,
      }
    }
    if (fallback.error) {
      return sendJson(res, 500, { message: 'Could not load seating info' })
    }
  } else if (error) {
    return sendJson(res, 500, { message: 'Could not load seating info' })
  } else if (!error && data) {
    seatingPayload = {
      tableLabel: data.table_label,
      mealSelection: data.meal_selection,
      dietaryRestrictions: data.dietary_restrictions,
    }
  }

  setPrivateCache(res, 60, 180)
  return sendJson(res, 200, seatingPayload)
}
