import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, test } from 'vitest'
import { OotdPage } from './Ootd'

describe('OotdPage', () => {
  afterEach(() => cleanup())

  test('renders the editorial hero copy', () => {
    render(<OotdPage />)

    expect(screen.getByRole('heading', { level: 1, name: 'Garden Formal' })).toBeInTheDocument()
    expect(screen.getByText('Whimsical. Chic. Ready to Celebrate')).toBeInTheDocument()
    expect(
      screen.getByText(
        'We want you to feel relaxed, confident, and ready to celebrate from ceremony through dancing under the stars.',
      ),
    ).toBeInTheDocument()
  })

  test('renders exactly three pinterest inspiration cards with safe external link attributes', () => {
    render(<OotdPage />)

    expect(screen.getByText("Women's Outfit Inspiration")).toBeInTheDocument()
    expect(screen.getByText("Women's Shoe Inspiration (Grass-Friendly)")).toBeInTheDocument()
    expect(screen.getByText("Men's Outfit Inspiration")).toBeInTheDocument()

    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(3)
    for (const link of links) {
      expect(link.getAttribute('href')).toMatch(/pinterest\.com/)
      expect(link).toHaveAttribute('target', '_blank')
      const rel = link.getAttribute('rel') ?? ''
      expect(rel).toContain('noopener')
      expect(rel).toContain('noreferrer')
    }
  })

  test('renders concise guidance columns and keeps the weather module', () => {
    render(<OotdPage />)

    expect(screen.getByRole('heading', { level: 2, name: 'For Women' })).toBeInTheDocument()
    expect(
      screen.getByText(/Flowing silhouettes, midi-to-floor lengths, florals, and soft texture/),
    ).toBeInTheDocument()

    expect(screen.getByRole('heading', { level: 2, name: 'For Men' })).toBeInTheDocument()
    expect(
      screen.getByText(/Lightweight suiting and linen blends are a natural fit for the setting/),
    ).toBeInTheDocument()

    expect(screen.getByText('Dunedin Weather')).toBeInTheDocument()
  })

  test('does not render duplicate #OOTD text or pocket square references', () => {
    render(<OotdPage />)

    expect(screen.queryByText(/#OOTD/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/pocket square/i)).not.toBeInTheDocument()
  })
})
