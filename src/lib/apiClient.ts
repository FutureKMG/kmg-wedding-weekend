async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text()
  if (!text) {
    return {} as T
  }

  return JSON.parse(text) as T
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
    throw new Error(payload.message ?? 'Request failed')
  }

  return parseJson<T>(response)
}
