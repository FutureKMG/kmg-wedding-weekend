export const NOTIFICATION_SETTINGS_KEY = 'wedding.notifications.settings'
export const NOTIFICATION_SUBSCRIPTION_KEY = 'wedding.notifications.subscription'
export const NOTIFICATION_SENT_REMINDERS_KEY = 'wedding.notifications.sentReminders'

export type NotificationSettings = {
  enabled: boolean
  permission: NotificationPermission | 'unsupported'
  eventReminders: boolean
  shuttleUpdates: boolean
  scheduleChanges: boolean
  updatedAt: string
}

type ReminderEvent = {
  id: 'welcome-party' | 'wedding-ceremony' | 'after-party'
  title: string
  startAt: string
  location?: string
}

export type ReminderPayload = {
  title: string
  body: string
}

export type ReminderJob = {
  reminderId: string
  eventId: ReminderEvent['id']
  offsetMinutes: number
  triggerAt: Date
  payload: ReminderPayload
}

type ReminderScheduleOptions = {
  now?: Date
  settings?: NotificationSettings
  permission?: NotificationPermission | 'unsupported'
  setTimeoutFn?: (callback: () => void, delayMs: number) => unknown
  notifier?: (payload: ReminderPayload) => void
}

const REMINDER_OFFSETS_MINUTES = [60, 30] as const

const REMINDER_EVENTS: ReminderEvent[] = [
  {
    id: 'welcome-party',
    title: 'Welcome Party',
    startAt: '2026-03-13T12:00:00-04:00',
    location: 'BayCare Ballpark',
  },
  {
    id: 'wedding-ceremony',
    title: 'Wedding Ceremony',
    startAt: '2026-03-14T17:30:00-04:00',
    location: 'The Fenway Hotel',
  },
  {
    id: 'after-party',
    title: 'After Party',
    startAt: '2026-03-14T23:00:00-04:00',
  },
]

let reminderTimeoutHandles: unknown[] = []

const defaultSettings: NotificationSettings = {
  enabled: false,
  permission: 'default',
  eventReminders: true,
  shuttleUpdates: true,
  scheduleChanges: true,
  updatedAt: new Date(0).toISOString(),
}

function readStorageJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') {
    return fallback
  }

  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) {
      return fallback
    }
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeStorageJson<T>(key: string, value: T) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore storage errors.
  }
}

function formatOffsetLabel(offsetMinutes: number): string {
  return offsetMinutes === 60 ? '1 hour' : `${offsetMinutes} minutes`
}

function canSendReminders(
  settings: NotificationSettings,
  permission: NotificationPermission | 'unsupported',
): boolean {
  return settings.enabled && settings.eventReminders && permission === 'granted'
}

function setSentReminder(reminderId: string) {
  const sent = loadSentReminderIds()
  sent[reminderId] = new Date().toISOString()
  writeStorageJson(NOTIFICATION_SENT_REMINDERS_KEY, sent)
}

function defaultNotifier(payload: ReminderPayload) {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return
  }

  if (Notification.permission !== 'granted') {
    return
  }

  new Notification(payload.title, {
    body: payload.body,
    icon: '/wedding-icon.png',
    badge: '/badge-icon.png',
  })
}

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator
}

export function loadNotificationSettings(): NotificationSettings {
  const settings = readStorageJson<NotificationSettings>(NOTIFICATION_SETTINGS_KEY, defaultSettings)

  if (settings.permission === 'unsupported') {
    return settings
  }

  if (typeof Notification !== 'undefined') {
    return { ...settings, permission: Notification.permission }
  }

  return settings
}

export function saveNotificationSettings(
  next: Partial<NotificationSettings>,
): NotificationSettings {
  const merged: NotificationSettings = {
    ...loadNotificationSettings(),
    ...next,
    updatedAt: new Date().toISOString(),
  }
  writeStorageJson(NOTIFICATION_SETTINGS_KEY, merged)
  return merged
}

export function loadSentReminderIds(): Record<string, string> {
  return readStorageJson<Record<string, string>>(NOTIFICATION_SENT_REMINDERS_KEY, {})
}

export function clearReminderTimers() {
  if (typeof window === 'undefined') {
    return
  }

  for (const handle of reminderTimeoutHandles) {
    window.clearTimeout(handle as number)
  }
  reminderTimeoutHandles = []
}

export function loadPushSubscriptionSnapshot(): PushSubscriptionJSON | null {
  return readStorageJson<PushSubscriptionJSON | null>(NOTIFICATION_SUBSCRIPTION_KEY, null)
}

export function savePushSubscriptionSnapshot(subscription: PushSubscriptionJSON | null) {
  writeStorageJson(NOTIFICATION_SUBSCRIPTION_KEY, subscription)
}

export function buildReminderPayload(
  eventId: ReminderEvent['id'],
  offsetMinutes: number,
): ReminderPayload {
  const offsetText = formatOffsetLabel(offsetMinutes)

  if (eventId === 'welcome-party') {
    return {
      title: 'Welcome Party Starting Soon ⚾',
      body: `Phillies vs Orioles game starts in ${offsetText} at BayCare Ballpark.`,
    }
  }

  if (eventId === 'wedding-ceremony') {
    return {
      title: 'Wedding Ceremony Starting Soon 💍',
      body: `The ceremony starts in ${offsetText} at The Fenway Hotel.`,
    }
  }

  return {
    title: 'After Party Starting Soon 🎉',
    body: `The after party starts in ${offsetText}.`,
  }
}

export function createReminderJobs(now = new Date()): ReminderJob[] {
  return REMINDER_EVENTS.flatMap((event) =>
    REMINDER_OFFSETS_MINUTES.map((offsetMinutes) => {
      const startAt = new Date(event.startAt)
      const triggerAt = new Date(startAt.getTime() - offsetMinutes * 60_000)
      return {
        reminderId: `${event.id}:${offsetMinutes}`,
        eventId: event.id,
        offsetMinutes,
        triggerAt,
        payload: buildReminderPayload(event.id, offsetMinutes),
      }
    }),
  ).filter((job) => job.triggerAt.getTime() > now.getTime())
}

export function scheduleEventReminderNotifications(
  options: ReminderScheduleOptions = {},
): unknown[] {
  const now = options.now ?? new Date()
  const settings = options.settings ?? loadNotificationSettings()
  const permission =
    options.permission ??
    (typeof Notification === 'undefined' ? 'unsupported' : Notification.permission)
  const setTimeoutFn = options.setTimeoutFn ?? ((callback, delayMs) => window.setTimeout(callback, delayMs))
  const notifier = options.notifier ?? defaultNotifier

  if (!canSendReminders(settings, permission)) {
    return []
  }

  const alreadySent = loadSentReminderIds()
  const jobs = createReminderJobs(now).filter((job) => !alreadySent[job.reminderId])
  const handles = jobs.map((job) => {
    const delayMs = Math.max(0, job.triggerAt.getTime() - now.getTime())
    return setTimeoutFn(() => {
      const sent = loadSentReminderIds()
      if (sent[job.reminderId]) {
        return
      }

      notifier(job.payload)
      setSentReminder(job.reminderId)
    }, delayMs)
  })

  return handles
}

export function initializeNotificationReminders() {
  clearReminderTimers()
  reminderTimeoutHandles = scheduleEventReminderNotifications()
}

export async function registerNotificationServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null
  }

  try {
    return await navigator.serviceWorker.register('/sw.js')
  } catch {
    return null
  }
}

export async function enableNotifications(): Promise<{
  enabled: boolean
  permission: NotificationPermission | 'unsupported'
  reason?: string
}> {
  if (!isNotificationSupported()) {
    const settings = saveNotificationSettings({ enabled: false, permission: 'unsupported' })
    return { enabled: false, permission: settings.permission, reason: 'unsupported' }
  }

  await registerNotificationServiceWorker()

  let permission: NotificationPermission = Notification.permission
  if (permission !== 'granted') {
    permission = await Notification.requestPermission()
  }

  if (permission !== 'granted') {
    saveNotificationSettings({ enabled: false, permission })
    return { enabled: false, permission, reason: 'denied' }
  }

  let subscriptionJson: PushSubscriptionJSON | null = null
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    subscriptionJson = subscription ? subscription.toJSON() : null
  } catch {
    subscriptionJson = null
  }

  savePushSubscriptionSnapshot(subscriptionJson)
  saveNotificationSettings({ enabled: true, permission: 'granted' })
  initializeNotificationReminders()
  return { enabled: true, permission: 'granted' }
}
