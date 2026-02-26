import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
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
    render(<MorningSchedulePage />)

    const yourScheduleRegion = screen.getByRole('region', { name: 'Your Schedule' })
    expect(within(yourScheduleRegion).getByText('Bride Makeup')).toBeInTheDocument()
    expect(within(yourScheduleRegion).getByText('Bride Hair')).toBeInTheDocument()
    expect(within(yourScheduleRegion).getByText('12:15 PM')).toBeInTheDocument()
    expect(within(yourScheduleRegion).getByText('1:00 PM')).toBeInTheDocument()
    expect(within(yourScheduleRegion).getAllByText('with Maddie')).toHaveLength(2)
  })

  test('filters Your Schedule for Katie Jaffe and shows two 8:30 services', () => {
    mockGuest('Katie', 'Jaffe')
    render(<MorningSchedulePage />)

    const yourScheduleRegion = screen.getByRole('region', { name: 'Your Schedule' })
    expect(within(yourScheduleRegion).getByText('Hair')).toBeInTheDocument()
    expect(within(yourScheduleRegion).getByText('Makeup')).toBeInTheDocument()
    expect(within(yourScheduleRegion).getAllByText('8:30 AM')).toHaveLength(2)
    expect(within(yourScheduleRegion).getByText('with Maddie')).toBeInTheDocument()
    expect(within(yourScheduleRegion).getByText('with Hollie')).toBeInTheDocument()
    expect(within(yourScheduleRegion).queryByText('Bride Hair')).not.toBeInTheDocument()
  })

  test('filters Your Schedule for Ainsley Lang and shows one junior hair service', () => {
    mockGuest('Ainsley', 'Lang')
    render(<MorningSchedulePage />)

    const yourScheduleRegion = screen.getByRole('region', { name: 'Your Schedule' })
    expect(within(yourScheduleRegion).getByText('Junior Hair')).toBeInTheDocument()
    expect(within(yourScheduleRegion).getByText('12:15 PM')).toBeInTheDocument()
    expect(within(yourScheduleRegion).getByText('with Ayla')).toBeInTheDocument()
    expect(within(yourScheduleRegion).queryByText(/^Makeup$/)).not.toBeInTheDocument()
  })

  test('shows empty-state for unknown user and full schedule table sorted by time', () => {
    mockGuest('Unknown', 'Guest')
    render(<MorningSchedulePage />)

    const yourScheduleRegion = screen.getByRole('region', { name: 'Your Schedule' })
    expect(
      within(yourScheduleRegion).getByText('You do not have hair or makeup scheduled.'),
    ).toBeInTheDocument()

    const fullTable = screen.getByRole('table', { name: 'Full Morning Schedule' })
    const rows = within(fullTable).getAllByRole('row')
    expect(rows).toHaveLength(23)

    const firstRow = rows[1]
    expect(within(firstRow).getByText('8:30 AM')).toBeInTheDocument()
    expect(within(firstRow).getByText('Hair')).toBeInTheDocument()
    expect(within(firstRow).getByText('Katie Jaffe')).toBeInTheDocument()
    expect(within(firstRow).getByText('Maddie')).toBeInTheDocument()

    const lastRow = rows[22]
    expect(within(lastRow).getByText('1:15 PM')).toBeInTheDocument()
    expect(within(lastRow).getByText('Hair')).toBeInTheDocument()
    expect(within(lastRow).getByText('Ekaterina Scorcia')).toBeInTheDocument()
    expect(within(lastRow).getByText('Ayla')).toBeInTheDocument()

    expect(screen.queryByText(/Fenway Hotel/i)).not.toBeInTheDocument()
  })
})
