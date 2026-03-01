import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, test } from 'vitest'
import { OotdPage } from './Ootd'

describe('OotdPage', () => {
  afterEach(() => cleanup())

  test('renders curated hero, women guidance, men guidance, and all visual card titles', () => {
    render(<OotdPage />)

    expect(screen.getByRole('heading', { level: 1, name: 'Garden-Formal Attire' })).toBeInTheDocument()
    expect(
      screen.getByText(
        'The ceremony and reception will take place on the lawn and terrace of the Fenway Hotel — a historic, jazz-age inspired waterfront setting in Dunedin, Florida.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Think refined, effortless, and comfortable from ceremony through dancing under the stars.',
      ),
    ).toBeInTheDocument()

    expect(screen.getByRole('heading', { level: 2, name: 'Garden-Formal for Women' })).toBeInTheDocument()
    expect(
      screen.getByText(
        'Structured silhouettes, flowing fabrics, and elevated simplicity feel right at home in this setting.',
      ),
    ).toBeInTheDocument()

    expect(screen.getByRole('heading', { level: 2, name: 'Garden-Formal for Gentlemen' })).toBeInTheDocument()
    expect(screen.getByText('Think tailored, effortless, and seasonally refined.')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Ties encouraged, but not required — choose what feels most like you.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Stable-soled dress shoes are recommended for lawn and terrace surfaces.',
      ),
    ).toBeInTheDocument()

    expect(screen.getByText('Structured Midi')).toBeInTheDocument()
    expect(screen.getByText('Polished, refined, and lawn-friendly.')).toBeInTheDocument()
    expect(screen.getByText('Flowing Maxi')).toBeInTheDocument()
    expect(screen.getByText('Soft movement for a waterfront setting.')).toBeInTheDocument()
    expect(screen.getByText('Pair with: block heels, elegant flats, or wedges.')).toBeInTheDocument()
    expect(screen.getByText('Pair with: low block heels or refined sandals.')).toBeInTheDocument()
    expect(screen.getByText('Navy or Charcoal Suit')).toBeInTheDocument()
    expect(screen.getByText('Timeless and well-suited for lawn + terrace.')).toBeInTheDocument()
    expect(screen.getByText('Pair with: brown loafers or classic oxfords.')).toBeInTheDocument()
    expect(screen.getByText('Light Gray or Seasonal Tone')).toBeInTheDocument()
    expect(screen.getByText('Breathable and refined for Florida evenings.')).toBeInTheDocument()
    expect(screen.getByText('Pair with: suede loafers or leather dress shoes.')).toBeInTheDocument()

    expect(screen.getByText('Dunedin Weather')).toBeInTheDocument()
  })

  test('shows pinterest source links while removing duplicate #OOTD header text and pocket square references', () => {
    render(<OotdPage />)

    expect(screen.queryByRole('heading', { name: '#OOTD' })).not.toBeInTheDocument()
    expect(screen.queryByText(/#OOTD/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/pocket square/i)).not.toBeInTheDocument()

    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(4)
    for (const link of links) {
      expect(link.getAttribute('href')).toMatch(/(pinterest\.com|pin\.it)/)
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', expect.stringMatching(/noreferrer|noopener/))
    }
  })

  test('does not render a Copy Link button in the header', () => {
    render(<OotdPage />)
    expect(screen.queryByRole('button', { name: 'Copy Link' })).not.toBeInTheDocument()
  })
})
