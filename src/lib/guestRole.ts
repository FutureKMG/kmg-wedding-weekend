import { MORNING_SCHEDULE_SOURCE, normalizeScheduleName } from '../content/morningSchedule'

export type GuestRole = 'bridal_party' | 'guest'

type GuestLike = {
  firstName?: string | null
  lastName?: string | null
  role?: GuestRole
} | null

const BRIDAL_PARTY_NAMES = new Set(
  MORNING_SCHEDULE_SOURCE.map((entry) => normalizeScheduleName(entry.name)),
)

export function inferGuestRole(guest: GuestLike): GuestRole {
  if (!guest) {
    return 'guest'
  }

  if (guest.role === 'bridal_party' || guest.role === 'guest') {
    return guest.role
  }

  const fullName = normalizeScheduleName(`${guest.firstName ?? ''} ${guest.lastName ?? ''}`)
  return BRIDAL_PARTY_NAMES.has(fullName) ? 'bridal_party' : 'guest'
}

export function isBridalPartyGuest(guest: GuestLike): boolean {
  return inferGuestRole(guest) === 'bridal_party'
}
