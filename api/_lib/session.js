import { jwtVerify, SignJWT } from 'jose'
import { parse, serialize } from 'cookie'
import { getRequiredEnv } from './env.js'

const SESSION_COOKIE_NAME = 'wedding_session'
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7

function getSessionSecret() {
  return new TextEncoder().encode(getRequiredEnv('SESSION_SECRET'))
}

export async function createSessionToken(guestId) {
  const now = Math.floor(Date.now() / 1000)
  const expiresAt = now + SESSION_DURATION_SECONDS

  const token = await new SignJWT({ guestId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(expiresAt)
    .sign(getSessionSecret())

  return { token, expiresAt: new Date(expiresAt * 1000).toISOString() }
}

export async function getSessionFromRequest(req) {
  const cookies = parse(req.headers.cookie ?? '')
  const token = cookies[SESSION_COOKIE_NAME]

  if (!token) {
    return null
  }

  try {
    const { payload } = await jwtVerify(token, getSessionSecret())
    const guestId = payload.guestId

    if (typeof guestId !== 'string' || guestId.length === 0) {
      return null
    }

    return { guestId }
  } catch {
    return null
  }
}

export function setSessionCookie(res, token) {
  const cookie = serialize(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION_SECONDS,
  })

  res.setHeader('Set-Cookie', cookie)
}

export function clearSessionCookie(res) {
  const cookie = serialize(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })

  res.setHeader('Set-Cookie', cookie)
}
