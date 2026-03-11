import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageIntro } from '../components/PageIntro'
import {
  enableNotifications,
  initializeNotificationReminders,
  loadNotificationSettings,
  saveNotificationSettings,
  type NotificationSettings,
} from '../lib/notifications'

type SettingToggleKey = 'eventReminders' | 'shuttleUpdates' | 'scheduleChanges'

export function NotificationsPage() {
  const [settings, setSettings] = useState(() => loadNotificationSettings())
  const [isEnabling, setIsEnabling] = useState(false)
  const [error, setError] = useState('')

  const isEnabled = useMemo(
    () => settings.enabled && settings.permission === 'granted',
    [settings.enabled, settings.permission],
  )

  async function handleEnable() {
    setError('')
    setIsEnabling(true)

    try {
      const result = await enableNotifications()
      const latest = loadNotificationSettings()
      setSettings(latest)

      if (!result.enabled) {
        if (result.reason === 'unsupported') {
          setError('Notifications are not supported in this browser.')
        } else if (result.reason === 'denied') {
          setError('Notification permission was denied. You can enable it in browser settings.')
        } else {
          setError('Could not enable notifications.')
        }
      }
    } finally {
      setIsEnabling(false)
    }
  }

  function handleToggle(key: SettingToggleKey) {
    const nextSettings: NotificationSettings = saveNotificationSettings({
      [key]: !settings[key],
    })
    setSettings(nextSettings)
    initializeNotificationReminders()
  }

  return (
    <section className="stack notifications-page">
      <PageIntro
        eyebrow="Notifications"
        title="Notification Settings"
        description="Choose which reminders and updates you want during wedding weekend."
      />

      <article className="card reveal notifications-settings-card">
        <p className="eyebrow">Push Notifications</p>
        <h3>Stay in the Loop</h3>
        <p className="muted">Get reminders and updates during the wedding weekend.</p>

        {!isEnabled ? (
          <button type="button" className="button-link notifications-enable-button" onClick={handleEnable} disabled={isEnabling}>
            {isEnabling ? 'Enabling...' : 'Enable Notifications'}
          </button>
        ) : (
          <>
            <p className="success-text">Notifications enabled 🎉</p>
            <p className="muted">We&apos;ll remind you before wedding events so you never miss a moment.</p>
          </>
        )}

        <div className="notifications-toggle-list">
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={settings.eventReminders}
              onChange={() => handleToggle('eventReminders')}
            />
            <span>Event reminders</span>
          </label>

          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={settings.shuttleUpdates}
              onChange={() => handleToggle('shuttleUpdates')}
            />
            <span>Shuttle updates</span>
          </label>

          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={settings.scheduleChanges}
              onChange={() => handleToggle('scheduleChanges')}
            />
            <span>Schedule changes</span>
          </label>
        </div>

        {error ? <p className="error-text">{error}</p> : null}

        <Link to="/" className="button-link secondary-button-link">
          Back to Home
        </Link>
      </article>
    </section>
  )
}
