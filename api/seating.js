import { requireGuest } from './_lib/guest.js'
import { methodNotAllowed, sendJson, setPrivateCache, unauthorized } from './_lib/http.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return methodNotAllowed(res)
  }

  const guest = await requireGuest(req)
  if (!guest) {
    return unauthorized(res)
  }

  setPrivateCache(res, 60, 180)
  return sendJson(res, 200, { tableLabel: guest.tableLabel })
}
