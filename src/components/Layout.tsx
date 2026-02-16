import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { mergeDashboardText } from '../content/dashboardText'
import { apiRequest } from '../lib/apiClient'
import { useAuth } from '../lib/auth'
import { DecoDivider } from './DecoDivider'

export function Layout() {
  const { guest, logout } = useAuth()
  const navigate = useNavigate()
  const [contentOverrides, setContentOverrides] = useState<Record<string, string>>({})

  useEffect(() => {
    async function loadContentText() {
      try {
        const payload = await apiRequest<{ content: Record<string, string> }>('/api/content-text')
        setContentOverrides(payload.content ?? {})
      } catch {
        setContentOverrides({})
      }
    }

    void loadContentText()
  }, [])

  const text = useMemo(
    () => mergeDashboardText(contentOverrides),
    [contentOverrides],
  )
  const headerGuestName = guest?.firstName ?? 'Guest'
  const headerTitle = text['layout.title'].replace('{GuestFirstName}', headerGuestName)

  const links = useMemo(() => {
    const baseLinks = [
      { to: '/', label: 'Home' },
      { to: '/timeline', label: 'Timeline' },
      { to: '/guide', label: 'Guide' },
      { to: '/seating', label: 'Seating' },
      { to: '/songs', label: 'Songs' },
      { to: '/gallery', label: 'Gallery' },
    ]

    if (guest?.canEditContent) {
      baseLinks.push({ to: '/content-editor', label: 'Edit Content' })
    }

    return baseLinks
  }, [guest?.canEditContent])

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <div className="app-frame reveal">
      <header className="site-header">
        <div className="brand-lockup">
          <p className="eyebrow">{text['layout.eyebrow']}</p>
          <p className="header-meta">{text['layout.meta']}</p>
          <h1 className="title">{headerTitle}</h1>
          <p className="subtitle">{text['layout.subtitle']}</p>
        </div>
        <button className="secondary-button" onClick={handleLogout}>
          Log out
        </button>
      </header>

      <DecoDivider />

      <nav className="tabs" aria-label="App sections">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              isActive ? 'tab-link tab-link-active' : 'tab-link'
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <main className="content-shell">
        <Outlet />
      </main>
    </div>
  )
}
