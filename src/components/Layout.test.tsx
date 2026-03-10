import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './Layout'
import { useAuth } from '../lib/auth'
import { apiRequest } from '../lib/apiClient'
import type { GuestProfile } from '../types'

vi.mock('../lib/auth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../lib/apiClient', () => ({
  apiRequest: vi.fn(),
}))

const mockedUseAuth = vi.mocked(useAuth)
const mockedApiRequest = vi.mocked(apiRequest)

function buildGuest(firstName: string, lastName: string): GuestProfile {
  return {
    id: 'guest-id',
    firstName,
    lastName,
    tableLabel: null,
    canUpload: true,
    canEditContent: false,
    canAccessGirlsRoom: true,
    accountType: 'guest',
    vendorName: null,
    canAccessVendorForum: false,
    rsvpReception: null,
    canAccessPhilliesWelcome: false,
  }
}

function mockAuthGuest(guest: GuestProfile) {
  mockedUseAuth.mockReturnValue({
    guest,
    isLoading: false,
    login: vi.fn(async () => {}),
    loginVendor: vi.fn(async () => {}),
    logout: vi.fn(async () => {}),
    refreshGuest: vi.fn(async () => {}),
  })
}

function renderLayout() {
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<div>Home</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('Layout morning schedule tab visibility', () => {
  beforeEach(() => {
    mockedApiRequest.mockResolvedValue({ content: {} })
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  test('shows Morning Schedule tab for allowlisted guests', () => {
    mockAuthGuest(buildGuest('Nina', 'Sennott'))
    renderLayout()

    expect(screen.getByRole('link', { name: 'Morning Schedule' })).toBeInTheDocument()
  })

  test('hides Morning Schedule tab for non-allowlisted guests', () => {
    mockAuthGuest(buildGuest('Gabrielle', 'Jackson'))
    renderLayout()

    expect(screen.queryByRole('link', { name: 'Morning Schedule' })).not.toBeInTheDocument()
  })
})
