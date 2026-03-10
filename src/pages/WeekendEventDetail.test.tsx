import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { WeekendEventDetailPage } from './WeekendEventDetail'
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

function renderDetail(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/weekend/events/:eventId" element={<WeekendEventDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('WeekendEventDetailPage', () => {
  beforeEach(() => {
    mockedApiRequest.mockResolvedValue({ events: EVENT_FIXTURES })
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  test('keeps generic wedding-day detail behavior', async () => {
    renderDetail('/weekend/events/wedding-day')

    expect(await screen.findByRole('heading', { level: 2, name: 'Ceremony + Cocktail Hour + Reception' })).toBeInTheDocument()
    expect(screen.getByText('Wedding Day Sequence')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Add to Calendar' })).toBeInTheDocument()
  })

  test('keeps generic non-wedding event detail behavior', async () => {
    renderDetail('/weekend/events/after-party')

    expect(await screen.findByRole('heading', { level: 2, name: 'After Party' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Add to Calendar' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to Weekend Schedule' })).toBeInTheDocument()
  })
})
