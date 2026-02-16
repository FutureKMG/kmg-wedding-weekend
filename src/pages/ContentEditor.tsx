import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { PageIntro } from '../components/PageIntro'
import {
  DASHBOARD_TEXT_DEFAULTS,
  DASHBOARD_TEXT_EDITOR_SECTIONS,
  type DashboardTextKey,
  mergeDashboardText,
} from '../content/dashboardText'
import { apiRequest } from '../lib/apiClient'
import { useAuth } from '../lib/auth'

export function ContentEditorPage() {
  const { guest } = useAuth()
  const [values, setValues] = useState(() => mergeDashboardText({}))
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    async function loadContent() {
      try {
        const payload = await apiRequest<{ content: Record<string, string> }>('/api/content-text')
        setValues(mergeDashboardText(payload.content))
      } catch (requestError) {
        const message =
          requestError instanceof Error ? requestError.message : 'Could not load editable content'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    void loadContent()
  }, [])

  const changedCount = useMemo(
    () =>
      (Object.keys(DASHBOARD_TEXT_DEFAULTS) as DashboardTextKey[]).filter(
        (key) => values[key] !== DASHBOARD_TEXT_DEFAULTS[key],
      ).length,
    [values],
  )

  if (!guest?.canEditContent) {
    return <Navigate to="/" replace />
  }

  function updateField(key: DashboardTextKey, value: string) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }))
    setSuccessMessage('')
    setError('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccessMessage('')
    setIsSaving(true)

    try {
      await apiRequest('/api/content-text/save', {
        method: 'POST',
        body: JSON.stringify({ content: values }),
      })
      setSuccessMessage('Dashboard text updated.')
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : 'Could not save content text'
      setError(message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="stack">
      <PageIntro
        eyebrow="Owner Controls"
        title="Edit Cards & Dashboard Text"
        description="These text updates apply across the app for all guests."
      >
        <p className="muted small-text">Changed from defaults: {changedCount}</p>
      </PageIntro>

      {isLoading ? (
        <article className="card">
          <p className="muted">Loading editable content...</p>
        </article>
      ) : (
        <form className="stack" onSubmit={handleSubmit}>
          {DASHBOARD_TEXT_EDITOR_SECTIONS.map((section) => (
            <article className="card stack reveal" key={section.title}>
              <h3>{section.title}</h3>
              <div className="editor-grid">
                {section.fields.map((field) => (
                  <label className="field" key={field.key}>
                    {field.label}
                    {field.multiline ? (
                      <textarea
                        value={values[field.key]}
                        onChange={(event) => updateField(field.key, event.target.value)}
                      />
                    ) : (
                      <input
                        value={values[field.key]}
                        onChange={(event) => updateField(field.key, event.target.value)}
                      />
                    )}
                    <button
                      type="button"
                      className="secondary-button content-reset-button"
                      onClick={() => updateField(field.key, DASHBOARD_TEXT_DEFAULTS[field.key])}
                    >
                      Reset to Default
                    </button>
                  </label>
                ))}
              </div>
            </article>
          ))}

          <article className="card stack reveal">
            {error ? <p className="error-text">{error}</p> : null}
            {successMessage ? <p className="success-text">{successMessage}</p> : null}
            <button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Dashboard Text'}
            </button>
          </article>
        </form>
      )}
    </section>
  )
}
