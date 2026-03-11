import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { NotificationsPage } from './Notifications'
import { NOTIFICATION_SETTINGS_KEY } from '../lib/notifications'

describe('NotificationsPage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.localStorage.setItem(
      NOTIFICATION_SETTINGS_KEY,
      JSON.stringify({
        enabled: true,
        permission: 'granted',
        eventReminders: true,
        shuttleUpdates: true,
        scheduleChanges: false,
        updatedAt: new Date().toISOString(),
      }),
    )
  })

  afterEach(() => cleanup())

  test('rehydrates stored notification settings and persists toggle changes', () => {
    render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('Notifications enabled 🎉')).toBeInTheDocument()

    const eventReminders = screen.getByRole('checkbox', { name: 'Event reminders' }) as HTMLInputElement
    const shuttleUpdates = screen.getByRole('checkbox', { name: 'Shuttle updates' }) as HTMLInputElement
    const scheduleChanges = screen.getByRole('checkbox', { name: 'Schedule changes' }) as HTMLInputElement

    expect(eventReminders.checked).toBe(true)
    expect(shuttleUpdates.checked).toBe(true)
    expect(scheduleChanges.checked).toBe(false)

    fireEvent.click(shuttleUpdates)

    const saved = JSON.parse(window.localStorage.getItem(NOTIFICATION_SETTINGS_KEY) ?? '{}')
    expect(saved.shuttleUpdates).toBe(false)
  })
})
