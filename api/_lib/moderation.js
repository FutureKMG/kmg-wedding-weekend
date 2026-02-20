import { normalizeNamePart } from './nameNormalization.js'

export function isKaraMargraf(guest) {
  return (
    normalizeNamePart(guest?.firstName) === 'kara' &&
    normalizeNamePart(guest?.lastName) === 'margraf'
  )
}

export function canModerateGirlsRoom(guest) {
  return Boolean(guest?.canEditContent) || isKaraMargraf(guest)
}

export function canAccessVendorForum(guest) {
  return Boolean(guest?.canAccessVendorForum) || Boolean(guest?.canEditContent) || isKaraMargraf(guest)
}

export function canModerateVendorForum(guest) {
  return Boolean(guest?.canEditContent) || isKaraMargraf(guest)
}
