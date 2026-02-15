export function isMethod(req, method) {
  return (req.method ?? '').toUpperCase() === method
}

export function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

export async function readJson(req) {
  if (!req.body) {
    const chunks = []
    for await (const chunk of req) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
    }
    const raw = Buffer.concat(chunks).toString('utf-8')
    return raw ? JSON.parse(raw) : {}
  }

  if (typeof req.body === 'string') {
    return req.body ? JSON.parse(req.body) : {}
  }

  return req.body
}

export function methodNotAllowed(res) {
  sendJson(res, 405, { message: 'Method not allowed' })
}

export function unauthorized(res) {
  sendJson(res, 401, { message: 'Please sign in first' })
}

export function serverError(res, errorMessage = 'Internal server error') {
  sendJson(res, 500, { message: errorMessage })
}
