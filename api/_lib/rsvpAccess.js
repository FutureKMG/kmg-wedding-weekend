import { isKaraMargraf } from './moderation.js'

function normalizeRsvp(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
}

export function canAccessPhilliesWelcome(guest) {
  return (
    normalizeRsvp(guest?.rsvpReception) === 'attending' ||
    Boolean(guest?.canEditContent) ||
    isKaraMargraf(guest)
  )
}
