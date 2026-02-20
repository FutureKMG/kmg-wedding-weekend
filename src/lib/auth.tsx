/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { apiRequest } from './apiClient'
import type { GuestProfile } from '../types'

type AuthContextValue = {
  guest: GuestProfile | null
  isLoading: boolean
  login: (firstName: string, lastName: string) => Promise<void>
  loginVendor: (vendorName: string) => Promise<void>
  logout: () => Promise<void>
  refreshGuest: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [guest, setGuest] = useState<GuestProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshGuest = useCallback(async () => {
    try {
      const payload = await apiRequest<{ guest: GuestProfile }>('/api/me')
      setGuest(payload.guest)
    } catch {
      setGuest(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshGuest()
  }, [refreshGuest])

  const login = useCallback(async (firstName: string, lastName: string) => {
    const payload = await apiRequest<{ guest: GuestProfile }>('/api/login', {
      method: 'POST',
      body: JSON.stringify({ firstName, lastName }),
    })

    setGuest(payload.guest)
  }, [])

  const loginVendor = useCallback(async (vendorName: string) => {
    const payload = await apiRequest<{ guest: GuestProfile }>('/api/login/vendor', {
      method: 'POST',
      body: JSON.stringify({ vendorName }),
    })

    setGuest(payload.guest)
  }, [])

  const logout = useCallback(async () => {
    await apiRequest('/api/logout', { method: 'POST' })
    setGuest(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      guest,
      isLoading,
      login,
      loginVendor,
      logout,
      refreshGuest,
    }),
    [guest, isLoading, login, loginVendor, logout, refreshGuest],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}
