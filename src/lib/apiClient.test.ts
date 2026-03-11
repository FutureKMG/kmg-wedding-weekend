import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiRequest } from './apiClient'

describe('apiRequest', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns a local-dev hint when an /api route is missing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('Not Found', { status: 404, statusText: 'Not Found' })),
    )

    await expect(apiRequest('/api/login')).rejects.toThrow(
      'Local API route not found. Run the app with `npm run dev` (Vercel dev) instead of Vite-only mode.',
    )
  })

  it('returns server error payload message when provided', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({ message: 'Name not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    )

    await expect(apiRequest('/api/login')).rejects.toThrow('Name not found')
  })
})
