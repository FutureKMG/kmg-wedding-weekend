import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { ContentEditorPage } from './pages/ContentEditor'
import { GalleryPage } from './pages/Gallery'
import { HomePage } from './pages/Home'
import { LoginPage } from './pages/Login'
import { SeatingPage } from './pages/Seating'
import { SongsPage } from './pages/Songs'
import { WeekendPage } from './pages/Weekend'
import { WelcomePartyPage } from './pages/WelcomeParty'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<HomePage />} />
        <Route path="/weekend" element={<WeekendPage />} />
        <Route path="/welcome-party" element={<WelcomePartyPage />} />
        <Route path="/seating" element={<SeatingPage />} />
        <Route path="/songs" element={<SongsPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/content-editor" element={<ContentEditorPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
