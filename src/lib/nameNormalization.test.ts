import { describe, expect, it } from 'vitest'
import { normalizeFullName, normalizeNamePart } from './nameNormalization'

describe('nameNormalization', () => {
  it('normalizes whitespace and case for a single part', () => {
    expect(normalizeNamePart('  KaRa   ')).toBe('kara')
  })

  it('normalizes a full name consistently', () => {
    expect(normalizeFullName(' Kara ', '  GILMORE ')).toBe('kara gilmore')
  })
})
