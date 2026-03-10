import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, test } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { WelcomePartyEventDetailPage } from './WelcomePartyEventDetail'

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/weekend/events/welcome-party']}>
      <Routes>
        <Route path="/weekend/events/welcome-party" element={<WelcomePartyEventDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('WelcomePartyEventDetailPage', () => {
  afterEach(() => cleanup())

  test('renders the welcome party details with title, subtitle, core sections, and calendar action', () => {
    renderPage()

    expect(screen.getByRole('heading', { level: 2, name: 'Welcome Party' })).toBeInTheDocument()
    expect(screen.getByText('Phillies vs. Orioles Spring Training Game')).toBeInTheDocument()
    expect(screen.getByText('12:00 PM – 4:00 PM')).toBeInTheDocument()
    expect(screen.getByText('BayCare Ballpark')).toBeInTheDocument()
    expect(screen.getByText('601 Old Coachman Road')).toBeInTheDocument()
    expect(screen.getByText('Clearwater, FL 33765')).toBeInTheDocument()
    expect(screen.getByText(/Casual and comfortable\./)).toBeInTheDocument()
    expect(screen.getByText(/We can’t wait to kick off the weekend/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Add to Calendar' })).toBeInTheDocument()
  })

  test('falls back to the existing welcome-party hero image when the phanatic image is unavailable', () => {
    renderPage()

    const heroImage = screen.getByRole('img', {
      name: 'Phillies-themed illustration for the Welcome Party spring training game.',
    }) as HTMLImageElement
    expect(heroImage.getAttribute('src')).toBe('/theme/phanatic-300x.png')

    fireEvent.error(heroImage)

    expect(heroImage.getAttribute('src')).toBe('/theme/welcome-party-hero.png')
  })
})
