import { act, cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { WeekendPage } from './Weekend'
import { apiRequest } from '../lib/apiClient'
import type { WeddingEvent } from '../types'

vi.mock('../lib/apiClient', () => ({
  apiRequest: vi.fn(),
}))

const mockedApiRequest = vi.mocked(apiRequest)

const EVENT_FIXTURES: WeddingEvent[] = [
  {
    id: 'ceremony',
    title: 'Ceremony',
    location: 'The Fenway Hotel Front Lawn',
    startAt: '2026-03-14T21:30:00Z',
    endAt: '2026-03-14T22:00:00Z',
    sortOrder: 1,
  },
  {
    id: 'cocktail-hour',
    title: 'Cocktail Hour',
    location: 'Caladesi Terrace',
    startAt: '2026-03-14T22:00:00Z',
    endAt: '2026-03-14T23:00:00Z',
    sortOrder: 2,
  },
  {
    id: 'reception',
    title: 'Reception',
    location: 'Front Lawn',
    startAt: '2026-03-14T23:00:00Z',
    endAt: '2026-03-15T03:00:00Z',
    sortOrder: 3,
  },
  {
    id: 'after-party',
    title: 'After Party',
    location: 'Location shared closer to wedding',
    startAt: '2026-03-15T03:00:00Z',
    endAt: '2026-03-15T06:00:00Z',
    sortOrder: 4,
  },
]

function renderWeekend() {
  render(
    <MemoryRouter>
      <WeekendPage />
    </MemoryRouter>,
  )
}

async function flushEffects() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
}

describe('WeekendPage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-10T10:00:00-04:00'))
    mockedApiRequest.mockResolvedValue({ events: EVENT_FIXTURES })
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  test('renders Welcome Party card above Wedding Day with detail and calendar actions', async () => {
    renderWeekend()
    await flushEffects()

    const welcomeHeading = screen.getByRole('heading', { name: 'Welcome Party' })
    const weddingHeading = screen.getByRole('heading', {
      name: 'Ceremony + Cocktail Hour + Reception',
    })

    expect(welcomeHeading.compareDocumentPosition(weddingHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getByText('Phillies vs. Orioles Spring Training Game')).toBeInTheDocument()

    const welcomeCard = welcomeHeading.closest('.event-calendar-card')
    expect(welcomeCard).toBeTruthy()
    if (!(welcomeCard instanceof HTMLElement)) {
      throw new Error('Welcome Party card missing')
    }

    const welcomeCardScope = within(welcomeCard)
    expect(welcomeCardScope.getByRole('link', { name: 'View Details' })).toHaveAttribute(
      'href',
      '/weekend/events/welcome-party',
    )
    expect(welcomeCardScope.getByRole('link', { name: 'Add to Calendar' })).toHaveAttribute(
      'download',
      'welcome-party.ics',
    )
  })

  test('shows Welcome Party before Wedding Day in Now & Next', async () => {
    renderWeekend()
    await flushEffects()
    screen.getByRole('heading', { name: 'Welcome Party' })

    const nowNextCard = screen.getByText('Now & Next').closest('article')
    expect(nowNextCard).toBeTruthy()
    if (!nowNextCard) {
      throw new Error('Now & Next card missing')
    }

    const nowNextScope = within(nowNextCard)
    expect(nowNextScope.getByText('March 13 · BayCare Ballpark')).toBeInTheDocument()
    const welcomeEventLabel = nowNextScope.getByText('Welcome Party')
    const weddingEventLabel = nowNextScope.getByText('Wedding Day')
    expect(welcomeEventLabel.compareDocumentPosition(weddingEventLabel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})
