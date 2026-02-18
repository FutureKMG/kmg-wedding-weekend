import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { DecoDivider } from '../components/DecoDivider'
import { useAuth } from '../lib/auth'

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
        <section className="login-card">
          <p className="eyebrow">Kara & Kevin</p>
          <h1>Step Into the Weekend</h1>
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

        <article className="guest-note guest-note-login login-note-panel">
          <p className="eyebrow">A Note to Our Favorite People</p>
          <p>Our hope for this weekend is simple. A deep exhale.</p>
          <p>
            Life has been busy and heavy at times. This is our invitation to pause it all for a little while and just
            be together.
          </p>
          <p>
            We did not plan this to be a perfect wedding. We planned it to be a joyful one. A meaningful one. A
            weekend with the people who have loved and shaped us into who we are.
          </p>
          <p>We will never have this exact group in one place again. That feels rare and worth celebrating.</p>
          <p>Come as you are. Leave the stress behind. Stay out late. Laugh loudly. Dance freely.</p>
          <p>Whatever happens, we will call it a memory.</p>
          <p>We are so grateful you are here with us.</p>
          <p className="guest-note-signoff">With love, Kevin &amp; Kara</p>
        </article>

        <div className="invite-hero-panel">
          <picture className="invite-hero-media login-cigar-media">
            <img src="/theme/kevkaracigar.png" alt="Kara and Kevin smoking a cigar" loading="lazy" />
          </picture>
        </div>
      </section>
    </main>
  )
}
