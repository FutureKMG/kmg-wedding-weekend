import { normalizeScheduleName } from '../content/morningSchedule'

export type GuestRole = 'bridal_party' | 'guest'

type GuestLike = {
  firstName?: string | null
  lastName?: string | null
  role?: GuestRole
} | null

const MORNING_SCHEDULE_ALLOWED_NAMES = new Set(
  [
    'Nina Sennott',
    'Katie Margraf',
    'McKenna Magriples',
    'Alissa Murphy',
    'Carley Maleri',
    'Fatima Asis',
    'Ainsley Lang',
    'Ekaterina Scorcia',
    'Heather Margraf',
    'Kara Margraf',
  ].map((name) => normalizeScheduleName(name)),
)

export function canAccessMorningSchedule(guest: GuestLike): boolean {
  if (!guest) {
    return false
  }

  const fullName = normalizeScheduleName(`${guest.firstName ?? ''} ${guest.lastName ?? ''}`)
  return MORNING_SCHEDULE_ALLOWED_NAMES.has(fullName)
}

export function inferGuestRole(guest: GuestLike): GuestRole {
  return canAccessMorningSchedule(guest) ? 'bridal_party' : 'guest'
}

export function isBridalPartyGuest(guest: GuestLike): boolean {
  return canAccessMorningSchedule(guest)
}
