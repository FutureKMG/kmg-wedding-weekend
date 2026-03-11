import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  NOTIFICATION_SENT_REMINDERS_KEY,
  buildReminderPayload,
  createReminderJobs,
  scheduleEventReminderNotifications,
  type NotificationSettings,
} from './notifications'

const ENABLED_SETTINGS: NotificationSettings = {
  enabled: true,
  permission: 'granted',
  eventReminders: true,
  shuttleUpdates: true,
  scheduleChanges: true,
  updatedAt: new Date().toISOString(),
}

describe('notifications utility', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('creates reminder jobs only for upcoming windows', () => {
    const now = new Date('2026-03-14T16:20:00-04:00')
    const jobs = createReminderJobs(now)

    expect(jobs.map((job) => job.reminderId)).toEqual([
      'wedding-ceremony:60',
      'wedding-ceremony:30',
      'after-party:60',
      'after-party:30',
    ])
  })

  it('schedules reminders at expected delays for 60 and 30 minutes before events', () => {
    const now = new Date('2026-03-14T16:20:00-04:00')
    const delays: number[] = []
    const setTimeoutSpy = vi.fn((callback: () => void, delayMs: number) => {
      delays.push(delayMs)
      return callback
    })

    scheduleEventReminderNotifications({
      now,
      settings: ENABLED_SETTINGS,
      permission: 'granted',
      setTimeoutFn: setTimeoutSpy,
      notifier: vi.fn(),
    })

    expect(setTimeoutSpy).toHaveBeenCalledTimes(4)
    expect(delays).toEqual([
      10 * 60 * 1000,
      40 * 60 * 1000,
      340 * 60 * 1000,
      370 * 60 * 1000,
    ])
  })

  it('skips reminders that have already been sent', () => {
    window.localStorage.setItem(
      NOTIFICATION_SENT_REMINDERS_KEY,
      JSON.stringify({ 'wedding-ceremony:60': '2026-03-14T16:30:00-04:00' }),
    )

    const setTimeoutSpy = vi.fn((callback: () => void, _delayMs: number) => callback)

    scheduleEventReminderNotifications({
      now: new Date('2026-03-14T16:20:00-04:00'),
      settings: ENABLED_SETTINGS,
      permission: 'granted',
      setTimeoutFn: setTimeoutSpy,
      notifier: vi.fn(),
    })

    expect(setTimeoutSpy).toHaveBeenCalledTimes(3)
  })

  it('builds expected payload copy for each supported reminder event', () => {
    expect(buildReminderPayload('welcome-party', 30)).toEqual({
      title: 'Welcome Party Starting Soon ⚾',
      body: 'Phillies vs Orioles game starts in 30 minutes at BayCare Ballpark.',
    })

    expect(buildReminderPayload('wedding-ceremony', 60)).toEqual({
      title: 'Wedding Ceremony Starting Soon 💍',
      body: 'The ceremony starts in 1 hour at The Fenway Hotel.',
    })

    expect(buildReminderPayload('after-party', 30)).toEqual({
      title: 'After Party Starting Soon 🎉',
      body: 'The after party starts in 30 minutes.',
    })
  })
})
