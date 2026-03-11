import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import App from './App'
import { useAuth } from './lib/auth'
import { apiRequest } from './lib/apiClient'

vi.mock('./lib/auth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('./lib/apiClient', () => ({
  apiRequest: vi.fn(),
}))

const mockedUseAuth = vi.mocked(useAuth)
const mockedApiRequest = vi.mocked(apiRequest)

describe('App notifications route', () => {
  beforeEach(() => {
    mockedUseAuth.mockReturnValue({
      guest: {
        id: 'guest-id',
        firstName: 'Kara',
        lastName: 'Margraf',
        tableLabel: null,
        canUpload: true,
        canEditContent: false,
        canAccessGirlsRoom: true,
        accountType: 'guest',
        vendorName: null,
        canAccessVendorForum: false,
        rsvpReception: null,
        canAccessPhilliesWelcome: false,
      },
      isLoading: false,
      login: vi.fn(async () => {}),
      loginVendor: vi.fn(async () => {}),
      logout: vi.fn(async () => {}),
      refreshGuest: vi.fn(async () => {}),
    })

    mockedApiRequest.mockResolvedValue({ content: {} })
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  test('renders /notifications route from the app router', async () => {
    render(
      <MemoryRouter initialEntries={['/notifications']}>
        <App />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { level: 2, name: 'Notification Settings' })).toBeInTheDocument()
  })
})
