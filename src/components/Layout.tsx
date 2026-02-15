import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

const links = [
  { to: '/', label: 'Home' },
  { to: '/timeline', label: 'Timeline' },
  { to: '/guide', label: 'Guide' },
  { to: '/seating', label: 'Seating' },
  { to: '/songs', label: 'Songs' },
  { to: '/gallery', label: 'Gallery' },
]

export function Layout() {
  const { guest, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <div className="app-frame">
      <header className="site-header">
        <div>
          <p className="eyebrow">Kara & Kevin</p>
          <h1 className="title">Wedding Weekend Companion</h1>
          <p className="muted">Welcome, {guest?.firstName ?? 'Guest'}</p>
        </div>
        <button className="secondary-button" onClick={handleLogout}>
          Log out
        </button>
      </header>

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
