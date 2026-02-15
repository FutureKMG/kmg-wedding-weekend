import { useEffect, useState } from 'react'
import { GuideCard } from '../components/GuideCard'
import { PageIntro } from '../components/PageIntro'
import { apiRequest } from '../lib/apiClient'
import type { GuideItem } from '../types'

export function GuidePage() {
  const [items, setItems] = useState<GuideItem[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadGuide() {
      try {
        const payload = await apiRequest<{ items: GuideItem[] }>('/api/guide')
        setItems(payload.items)
      } catch (requestError) {
        const message =
          requestError instanceof Error ? requestError.message : 'Could not load guide items'
        setError(message)
      }
    }

    void loadGuide()
  }, [])

  return (
    <section className="stack">
      <PageIntro
        eyebrow="Explore"
        title="Dunedin & Tampa Guide"
        description="A few hand-picked spots to round out the weekend."
      />

      {error && <p className="error-text">{error}</p>}

      <div className="stack">
        {items.map((item) => (
          <GuideCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  )
}
