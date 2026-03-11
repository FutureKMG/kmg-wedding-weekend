import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { NotificationToggle } from './NotificationToggle'
import {
  NOTIFICATION_SETTINGS_KEY,
  NOTIFICATION_SUBSCRIPTION_KEY,
} from '../lib/notifications'

class MockNotification {
  static permission: NotificationPermission = 'default'
  static requestPermission = vi.fn(async () => {
    MockNotification.permission = 'granted'
    return 'granted'
  })

  constructor(_title: string, _options?: NotificationOptions) {}
}

describe('NotificationToggle', () => {
  let registerSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    window.localStorage.clear()
    MockNotification.permission = 'default'
    MockNotification.requestPermission.mockClear()
    vi.stubGlobal('Notification', MockNotification)

    registerSpy = vi.fn(async () => ({
      pushManager: {
        getSubscription: vi.fn(async () => null),
      },
    }))

    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        register: registerSpy,
        ready: Promise.resolve({
          pushManager: {
            getSubscription: vi.fn(async () => null),
          },
        }),
      },
    })
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  test('enables notifications and persists settings/subscription when the button is clicked', async () => {
    render(
      <MemoryRouter>
        <NotificationToggle />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Enable Notifications' }))

    await waitFor(() => {
      expect(screen.getByText('Notifications enabled 🎉')).toBeInTheDocument()
    })

    expect(MockNotification.requestPermission).toHaveBeenCalledTimes(1)
    expect(registerSpy).toHaveBeenCalledWith('/sw.js')
    expect(screen.getByRole('link', { name: 'Manage Notification Settings' })).toHaveAttribute(
      'href',
      '/notifications',
    )

    const settings = JSON.parse(window.localStorage.getItem(NOTIFICATION_SETTINGS_KEY) ?? '{}')
    expect(settings.enabled).toBe(true)
    expect(settings.permission).toBe('granted')

    expect(window.localStorage.getItem(NOTIFICATION_SUBSCRIPTION_KEY)).toBe('null')
  })
})
