import { useEffect, useState } from 'react'
import { apiRequest } from '../lib/apiClient'

export function SeatingPage() {
  const [tableLabel, setTableLabel] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadSeating() {
      try {
        const payload = await apiRequest<{ tableLabel: string | null }>('/api/seating')
        setTableLabel(payload.tableLabel)
      } catch (requestError) {
        const message =
          requestError instanceof Error ? requestError.message : 'Could not load seating info'
        setError(message)
      }
    }

    void loadSeating()
  }, [])

  return (
    <section className="stack">
      <article className="card">
        <h2>Your Table</h2>
        {tableLabel ? (
          <p className="table-callout">{tableLabel}</p>
        ) : (
          <p className="muted">Your table assignment has not been posted yet.</p>
        )}
      </article>

      {error && <p className="error-text">{error}</p>}
    </section>
  )
}
