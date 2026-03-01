import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { mergeDashboardText } from '../content/dashboardText'
import { apiRequest } from '../lib/apiClient'
import { useAuth } from '../lib/auth'
import { DecoDivider } from './DecoDivider'

type NavTab = {
  to: string
  label: string
  className?: string
}

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
    const baseLinks: NavTab[] = [
      { to: '/', label: 'Home' },
      { to: '/weekend', label: 'Weekend' },
      { to: '/morning-schedule', label: 'Morning Schedule' },
      { to: '/seating', label: 'Seating' },
      { to: '/songs', label: 'Songs' },
      { to: '/gallery', label: 'Feed' },
      { to: '/ootd', label: '#OOTD' },
      { to: '/girls-room', label: 'Girls Room' },
      { to: '/vendor-forum', label: 'Vendor Forum' },
    ]

    if (!guest?.canAccessGirlsRoom) {
      const girlsRoomIndex = baseLinks.findIndex((link) => link.to === '/girls-room')
      if (girlsRoomIndex >= 0) {
        baseLinks.splice(girlsRoomIndex, 1)
      }
    }

    if (!guest?.canAccessVendorForum && !guest?.canEditContent) {
      const vendorForumIndex = baseLinks.findIndex((link) => link.to === '/vendor-forum')
      if (vendorForumIndex >= 0) {
        baseLinks.splice(vendorForumIndex, 1)
      }
    }

    if (guest?.accountType === 'vendor' && !guest?.canEditContent) {
      const morningScheduleIndex = baseLinks.findIndex((link) => link.to === '/morning-schedule')
      if (morningScheduleIndex >= 0) {
        baseLinks.splice(morningScheduleIndex, 1)
      }
    }

    if (guest?.canEditContent) {
      baseLinks.push({ to: '/content-editor', label: 'Edit Content', className: 'tab-link-utility' })
    }

    return baseLinks
  }, [guest?.canAccessGirlsRoom, guest?.canAccessVendorForum, guest?.canEditContent, guest?.accountType])

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
            className={({ isActive }) => {
              const stateClass = isActive ? 'tab-link tab-link-active' : 'tab-link'
              return link.className ? `${stateClass} ${link.className}` : stateClass
            }}
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
