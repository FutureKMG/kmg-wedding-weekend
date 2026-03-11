async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text()
  if (!text) {
    return {} as T
  }

  try {
    return JSON.parse(text) as T
  } catch {
    return {} as T
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    credentials: 'include',
  })

  if (!response.ok) {
    const payload = await parseJson<{ message?: string }>(response)
    const apiRouteMissing =
      path.startsWith('/api/') &&
      response.status === 404 &&
      (!payload.message || payload.message === 'Request failed')
    const message = apiRouteMissing
      ? 'Local API route not found. Run the app with `npm run dev` (Vercel dev) instead of Vite-only mode.'
      : (payload.message ?? 'Request failed')
    throw new Error(message)
  }

  return parseJson<T>(response)
}
