import { clearSessionCookie } from './_lib/session.js'
import { methodNotAllowed, sendJson } from './_lib/http.js'

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res)
  }

  clearSessionCookie(res)
  return sendJson(res, 200, { ok: true })
}
