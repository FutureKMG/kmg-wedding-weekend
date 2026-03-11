import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { HomePage } from './Home'
import { useAuth } from '../lib/auth'
import { apiRequest } from '../lib/apiClient'

vi.mock('../lib/auth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../lib/apiClient', () => ({
  apiRequest: vi.fn(),
}))

const mockedUseAuth = vi.mocked(useAuth)
const mockedApiRequest = vi.mocked(apiRequest)

describe('HomePage notification integration', () => {
  beforeEach(() => {
    mockedUseAuth.mockReturnValue({
      guest: {
        id: 'guest-id',
        firstName: 'Kara',
        lastName: 'Margraf',
        tableLabel: 'Table 1',
        canUpload: true,
        canEditContent: false,
        canAccessGirlsRoom: true,
        accountType: 'guest',
        vendorName: null,
        canAccessVendorForum: false,
        rsvpReception: 'Attending',
        canAccessPhilliesWelcome: true,
      },
      isLoading: false,
      login: vi.fn(async () => {}),
      loginVendor: vi.fn(async () => {}),
      logout: vi.fn(async () => {}),
      refreshGuest: vi.fn(async () => {}),
    })

    mockedApiRequest.mockImplementation(async (path) => {
      if (path === '/api/content-text') return { content: {} }
      if (path === '/api/events') return { events: [] }
      if (path === '/api/photos?scope=feed&limit=24') return { photos: [] }
      if (path === '/api/feed-updates?limit=12') return { updates: [] }
      if (path === '/api/flight-details') return { party: [] }
      return {}
    })

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          current: {
            temperature_2m: 78,
            apparent_temperature: 80,
            weather_code: 1,
            wind_speed_10m: 8,
            is_day: 1,
          },
          daily: {
            temperature_2m_max: [82],
            temperature_2m_min: [71],
          },
        }),
      })),
    )
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  test('renders notification opt-in card and settings link on Home', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Stay in the Loop' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Manage Notification Settings' })).toHaveAttribute(
      'href',
      '/notifications',
    )
  })
})
