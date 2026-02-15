import { describe, expect, it } from 'vitest'
import { getTimelineState } from './time'
import type { WeddingEvent } from '../types'

const events: WeddingEvent[] = [
  {
    id: '1',
    title: 'Ceremony',
    location: 'Front Lawn',
    startAt: '2026-03-14T21:30:00.000Z',
    endAt: '2026-03-14T22:00:00.000Z',
    sortOrder: 1,
  },
  {
    id: '2',
    title: 'Cocktail Hour',
    location: 'Caladesi Terrace',
    startAt: '2026-03-14T22:00:00.000Z',
    endAt: '2026-03-14T23:00:00.000Z',
    sortOrder: 2,
  },
]

describe('getTimelineState', () => {
  it('returns current event when within event window', () => {
    const state = getTimelineState(events, new Date('2026-03-14T21:40:00.000Z'))
    expect(state.currentEvent?.title).toBe('Ceremony')
  })

  it('returns next event before first event starts', () => {
    const state = getTimelineState(events, new Date('2026-03-14T21:00:00.000Z'))
    expect(state.currentEvent).toBeNull()
    expect(state.nextEvent?.title).toBe('Ceremony')
    expect(state.countdown).toBeTruthy()
  })
})
