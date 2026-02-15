import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { DecoDivider } from '../components/DecoDivider'
import { HeroImage } from '../components/HeroImage'

type LocationState = {
  from?: {
    pathname?: string
  }
}

export function LoginPage() {
  const { guest, login } = useAuth()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const state = location.state as LocationState | null
  const redirectPath = state?.from?.pathname ?? '/'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await login(firstName, lastName)
      navigate(redirectPath, { replace: true })
    } catch {
      setError(
        'We could not find that name on the guest list. Please check spelling or contact Kara and Kevin.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (guest) {
    return <Navigate to="/" replace />
  }

  return (
    <main className="login-shell reveal">
      <section className="login-stage">
        <div className="invite-hero-panel">
          <HeroImage alt="Fenway-inspired watercolor invitation artwork" className="invite-hero-media" />
          <div className="invite-hero-copy">
            <p className="eyebrow">March 14, 2026</p>
            <h2>Fenway Hotel, Dunedin</h2>
            <p className="muted">
              A watercolor weekend with art deco charm, warm light, and the people we love.
            </p>
          </div>
        </div>

        <section className="login-card">
          <p className="eyebrow">Kara & Kevin</p>
          <h1>Step Into the Evening</h1>
          <p className="muted">Please enter your first and last name to continue.</p>

          <DecoDivider />

          <form onSubmit={handleSubmit} className="stack">
            <label className="field">
              First name
              <input
                autoComplete="given-name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                required
              />
            </label>

            <label className="field">
              Last name
              <input
                autoComplete="family-name"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                required
              />
            </label>

            {error && <p className="error-text">{error}</p>}

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Checking guest list...' : 'Enter the Weekend'}
            </button>
          </form>
        </section>
      </section>
    </main>
  )
}
