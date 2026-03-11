import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  enableNotifications,
  initializeNotificationReminders,
  isNotificationSupported,
  loadNotificationSettings,
} from '../lib/notifications'

export function NotificationToggle() {
  const [settings, setSettings] = useState(() => loadNotificationSettings())
  const [error, setError] = useState('')
  const [isEnabling, setIsEnabling] = useState(false)

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
        return
      }

      initializeNotificationReminders()
    } finally {
      setIsEnabling(false)
    }
  }

  return (
    <article className="card reveal notifications-toggle-card">
      <p className="eyebrow">Stay in the Loop</p>
      <h3>Stay in the Loop</h3>
      <p className="muted">Get reminders and updates during the wedding weekend.</p>

      {!isEnabled ? (
        <button
          type="button"
          className="button-link notifications-enable-button"
          onClick={handleEnable}
          disabled={isEnabling || !isNotificationSupported()}
        >
          {isEnabling ? 'Enabling...' : 'Enable Notifications'}
        </button>
      ) : (
        <>
          <p className="success-text">Notifications enabled 🎉</p>
          <p className="muted">We&apos;ll remind you before wedding events so you never miss a moment.</p>
        </>
      )}

      <Link to="/notifications" className="button-link secondary-button-link">
        Manage Notification Settings
      </Link>

      {error ? <p className="error-text">{error}</p> : null}
    </article>
  )
}
