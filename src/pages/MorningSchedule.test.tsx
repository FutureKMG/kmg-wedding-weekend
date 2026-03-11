import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { MorningSchedulePage } from './MorningSchedule'

vi.mock('../lib/auth', () => ({
  useAuth: vi.fn(),
}))

const mockedUseAuth = vi.mocked(useAuth)

function mockGuest(firstName: string, lastName: string) {
  mockedUseAuth.mockReturnValue({
    guest: {
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
    },
    isLoading: false,
    login: vi.fn(async () => {}),
    loginVendor: vi.fn(async () => {}),
    logout: vi.fn(async () => {}),
    refreshGuest: vi.fn(async () => {}),
  })
}

function renderMorningSchedule() {
  render(
    <MemoryRouter initialEntries={['/morning-schedule']}>
      <Routes>
        <Route path="/" element={<div>Home</div>} />
        <Route path="/morning-schedule" element={<MorningSchedulePage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('MorningSchedulePage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-14T08:00:00-04:00'))
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  test('filters Your Schedule for Kara Margraf and shows bride services', () => {
    mockGuest('Kara', 'Margraf')
    renderMorningSchedule()

    const yourScheduleRegion = screen.getByRole('region', { name: 'Your Schedule' })
    expect(within(yourScheduleRegion).getByText('Bride Makeup')).toBeInTheDocument()
    expect(within(yourScheduleRegion).getAllByText(/^Bride Hair/)).toHaveLength(2)
    expect(within(yourScheduleRegion).getByText('10:00 AM')).toBeInTheDocument()
    expect(within(yourScheduleRegion).getByText('11:45 AM')).toBeInTheDocument()
    expect(within(yourScheduleRegion).getByText('12:45 PM')).toBeInTheDocument()
    expect(within(yourScheduleRegion).getAllByText('with Ayla')).toHaveLength(2)
    expect(within(yourScheduleRegion).getByText('with Hollie')).toBeInTheDocument()
  })

  test('filters Your Schedule for Gabrielle Jackson and shows makeup at 8:45 and hair at 10:30', () => {
    mockGuest('Gabrielle', 'Jackson')
    renderMorningSchedule()

    const yourScheduleRegion = screen.getByRole('region', { name: 'Your Schedule' })
    expect(within(yourScheduleRegion).getByText('Hair')).toBeInTheDocument()
    expect(within(yourScheduleRegion).getByText('Makeup')).toBeInTheDocument()
    expect(within(yourScheduleRegion).getByText('8:45 AM')).toBeInTheDocument()
    expect(within(yourScheduleRegion).getByText('10:30 AM')).toBeInTheDocument()
    expect(within(yourScheduleRegion).getByText('with Hollie')).toBeInTheDocument()
    expect(within(yourScheduleRegion).getByText('with Maddie')).toBeInTheDocument()
    expect(within(yourScheduleRegion).queryByText('Bride Makeup')).not.toBeInTheDocument()
  })

  test('filters Your Schedule for Ainsley Lang and shows one JR hair-only service', () => {
    mockGuest('Ainsley', 'Lang')
    renderMorningSchedule()

    const yourScheduleRegion = screen.getByRole('region', { name: 'Your Schedule' })
    expect(within(yourScheduleRegion).getByText('JR Hair only')).toBeInTheDocument()
    expect(within(yourScheduleRegion).getByText('11:15 AM')).toBeInTheDocument()
    expect(within(yourScheduleRegion).getByText('with Ayla')).toBeInTheDocument()
    expect(within(yourScheduleRegion).queryByText(/^Makeup$/)).not.toBeInTheDocument()
  })

  test('redirects Shelby Turner to home when accessing morning schedule directly', () => {
    mockGuest('Shelby', 'Turner')
    renderMorningSchedule()

    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.queryByText('Wedding Morning Schedule')).not.toBeInTheDocument()
  })
})
