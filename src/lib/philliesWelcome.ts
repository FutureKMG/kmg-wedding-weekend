export type PhilliesWelcomeDetailItem = {
  id: string
  label: string
  value: string
}

export type PhilliesWelcomeSection = {
  label: string
  hero: {
    title: string
    body: string
  }
  details: {
    title: string
    items: PhilliesWelcomeDetailItem[]
  }
  meet: {
    title: string
    body: string
  }
}

async function parseJsonSafe<T>(response: Response): Promise<T | null> {
  const text = await response.text()
  if (!text) {
    return null
  }

  try {
    return JSON.parse(text) as T
  } catch {
    return null
  }
}

export async function fetchPhilliesWelcomeSection(): Promise<{
  section: PhilliesWelcomeSection | null
  restricted: boolean
  error: string | null
}> {
  const response = await fetch('/api/weekend/phillies-welcome', {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  })

  if (response.status === 401 || response.status === 403) {
    return { section: null, restricted: true, error: null }
  }

  if (!response.ok) {
    const payload = await parseJsonSafe<{ message?: string }>(response)
    return { section: null, restricted: false, error: payload?.message ?? 'Could not load welcome party details.' }
  }

  const payload = await parseJsonSafe<{ section?: PhilliesWelcomeSection }>(response)
  if (!payload?.section) {
    return { section: null, restricted: false, error: 'Could not load welcome party details.' }
  }

  return { section: payload.section, restricted: false, error: null }
}
