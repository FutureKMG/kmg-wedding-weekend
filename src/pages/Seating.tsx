import { useEffect, useState } from 'react'
import { PageIntro } from '../components/PageIntro'
import { apiRequest } from '../lib/apiClient'
import type { SeatingInfo } from '../types'

export function SeatingPage() {
  const [seating, setSeating] = useState<SeatingInfo>({
    tableLabel: null,
    mealSelection: null,
    dietaryRestrictions: null,
  })
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadSeating() {
      try {
        const payload = await apiRequest<SeatingInfo>('/api/seating')
        setSeating(payload)
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
      <PageIntro
        eyebrow="Reception"
        title="Your Table"
        description="Your assignment is ready for a smooth arrival."
      >
        <div className="event-detail-grid">
          <article className="event-detail-item">
            <p className="eyebrow">Table</p>
            {seating.tableLabel ? (
              <p className="table-callout">{seating.tableLabel}</p>
            ) : (
              <p className="muted">Your table is not quite ready. We&apos;ll be updating this soon.</p>
            )}
          </article>

          <article className="event-detail-item">
            <p className="eyebrow">Meal Selection</p>
            <p>{seating.mealSelection ?? 'No meal selection on file yet.'}</p>
          </article>

          <article className="event-detail-item">
            <p className="eyebrow">Dietary Restrictions</p>
            <p>{seating.dietaryRestrictions ?? 'No dietary restrictions noted.'}</p>
          </article>
        </div>
      </PageIntro>

      {error && <p className="error-text">{error}</p>}
    </section>
  )
}
