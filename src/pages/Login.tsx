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
          <article className="guest-note guest-note-handwritten guest-note-login">
            <p className="eyebrow">A Note to Our Favorite People</p>
            <p>Our hope for this weekend is simple. A deep exhale.</p>
            <p>
              Life has been busy and heavy at times. This is our invitation to pause it all for a little while and
              just be together.
            </p>
            <p>
              We did not plan this to be a perfect wedding. We planned it to be a joyful one. A meaningful one. A
              weekend with the people who have loved and shaped us into who we are.
            </p>
            <p>We may never have this exact group in one place again. That feels rare and worth celebrating.</p>
            <p>Come as you are. Leave the stress behind. Stay out late. Laugh loudly. Dance freely.</p>
            <p>Whatever happens, we will call it a memory.</p>
            <p>We are so grateful you are here with us.</p>
            <p className="guest-note-signoff">Kara &amp; Kevin</p>
          </article>
          <picture className="login-card-media">
            <source
              media="(max-width: 680px)"
              srcSet="/theme/home-lounge-portrait-one-mobile.avif"
              type="image/avif"
            />
            <source
              media="(max-width: 680px)"
              srcSet="/theme/home-lounge-portrait-one-mobile.webp"
              type="image/webp"
            />
            <source srcSet="/theme/home-lounge-portrait-one.avif" type="image/avif" />
            <source srcSet="/theme/home-lounge-portrait-one.webp" type="image/webp" />
            <img src="/theme/home-lounge-portrait-one.png" alt="Kara and Kevin together" loading="lazy" />
          </picture>
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

        <div className="invite-hero-panel">
          <picture className="invite-hero-media">
            <source
              media="(max-width: 680px)"
              srcSet="/theme/home-lounge-hero-mobile.avif"
              type="image/avif"
            />
            <source
              media="(max-width: 680px)"
              srcSet="/theme/home-lounge-hero-mobile.webp"
              type="image/webp"
            />
            <source srcSet="/theme/home-lounge-hero.avif" type="image/avif" />
            <source srcSet="/theme/home-lounge-hero.webp" type="image/webp" />
            <img src="/theme/home-lounge-hero.png" alt="Kara and Kevin in the lounge" loading="lazy" />
          </picture>
        </div>
      </section>
    </main>
  )
}
