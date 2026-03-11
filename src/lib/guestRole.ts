import { normalizeScheduleName } from '../content/morningSchedule'

export type GuestRole = 'bridal_party' | 'guest'

type GuestLike = {
  name?: string | null
  firstName?: string | null
  lastName?: string | null
  role?: GuestRole
} | null

const MORNING_SCHEDULE_ALLOWED_NAMES = new Set(
  [
    'Kara Margraf',
    'Katie Jaffe',
    'Nina Sennott',
    'McKenna Magriples',
    'Alissa Murphy',
    'Heather Margraf',
    'Gabrielle Jackson',
    'Laine Kenny',
    'Fatima Asis',
    'Carley Maleri',
    'Ekaterina Scorcia',
    'Ainsley Lang',
    'Jennifer Lang',
  ].map((name) => normalizeScheduleName(name)),
)

export function canAccessMorningSchedule(guest: GuestLike): boolean {
  if (!guest) {
    return false
  }

  const fullName = normalizeScheduleName(
    guest.name?.trim() ? guest.name : `${guest.firstName ?? ''} ${guest.lastName ?? ''}`,
  )
  return MORNING_SCHEDULE_ALLOWED_NAMES.has(fullName)
}

export function inferGuestRole(guest: GuestLike): GuestRole {
  return canAccessMorningSchedule(guest) ? 'bridal_party' : 'guest'
}

export function isBridalPartyGuest(guest: GuestLike): boolean {
  return canAccessMorningSchedule(guest)
}
