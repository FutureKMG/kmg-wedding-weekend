import { describe, expect, it } from 'vitest'
import { canAccessMorningSchedule, inferGuestRole, isBridalPartyGuest } from './guestRole'

describe('guestRole morning schedule allowlist', () => {
  it('allows explicitly allowlisted guests', () => {
    expect(canAccessMorningSchedule({ firstName: 'Nina', lastName: 'Sennott' })).toBe(true)
    expect(canAccessMorningSchedule({ firstName: 'Kara', lastName: 'Margraf' })).toBe(true)
    expect(canAccessMorningSchedule({ firstName: 'Jennifer', lastName: 'Lang' })).toBe(true)
  })

  it('denies non-allowlisted guests', () => {
    expect(canAccessMorningSchedule({ firstName: 'Shelby', lastName: 'Turner' })).toBe(false)
    expect(canAccessMorningSchedule({ firstName: 'Justin', lastName: 'Lang' })).toBe(false)
    expect(canAccessMorningSchedule({ firstName: 'Unknown', lastName: 'Guest' })).toBe(false)
  })

  it('normalizes case and whitespace when matching names', () => {
    expect(canAccessMorningSchedule({ firstName: '  mckenna ', lastName: '  MAGRIPLES  ' })).toBe(true)
    expect(canAccessMorningSchedule({ name: '  JENNIFER   lang  ' })).toBe(true)
  })

  it('keeps inferGuestRole and isBridalPartyGuest consistent with allowlist access', () => {
    expect(inferGuestRole({ firstName: 'Alissa', lastName: 'Murphy' })).toBe('bridal_party')
    expect(isBridalPartyGuest({ firstName: 'Alissa', lastName: 'Murphy' })).toBe(true)

    expect(inferGuestRole({ firstName: 'Gabrielle', lastName: 'Jackson' })).toBe('bridal_party')
    expect(isBridalPartyGuest({ firstName: 'Gabrielle', lastName: 'Jackson' })).toBe(true)
    expect(inferGuestRole({ firstName: 'Michael', lastName: 'Margraf' })).toBe('guest')
    expect(isBridalPartyGuest({ firstName: 'Michael', lastName: 'Margraf' })).toBe(false)
  })
})
