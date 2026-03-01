import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, test, vi } from 'vitest'
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
        'Dress shoes with stable soles are recommended for lawn and terrace surfaces.',
      ),
    ).toBeInTheDocument()

    expect(screen.getByText('Structured Midi Dress')).toBeInTheDocument()
    expect(screen.getByText('Flowing Maxi or Soft Gown')).toBeInTheDocument()
    expect(screen.getByText('Tailored Cocktail Dress')).toBeInTheDocument()
    expect(screen.getByText('Elegant Flats, Wedges, or Block Heels')).toBeInTheDocument()
    expect(screen.getByText('Navy or Charcoal Suit')).toBeInTheDocument()
    expect(screen.getByText('Light Gray or Seasonal Tone')).toBeInTheDocument()
    expect(screen.getByText('Lightweight Fabrics')).toBeInTheDocument()

    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')
  })

  test('removes pinterest links and duplicate #OOTD header text', () => {
    render(<OotdPage />)

    expect(screen.queryByRole('heading', { name: '#OOTD' })).not.toBeInTheDocument()
    expect(screen.queryByText(/#OOTD/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/pinterest/i)).not.toBeInTheDocument()
    expect(screen.queryAllByRole('link')).toHaveLength(0)
  })

  test('copy link button uses clipboard API and updates live status text', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })

    render(<OotdPage />)

    const copyButton = screen.getByRole('button', { name: 'Copy Link' })
    await user.click(copyButton)

    expect(writeText).toHaveBeenCalledWith('http://localhost:3000/ootd')
    expect(screen.getByRole('status')).toHaveTextContent('Link copied')
  })

  test('copy link control is keyboard focusable', async () => {
    const user = userEvent.setup()
    render(<OotdPage />)

    await user.tab()
    expect(screen.getByRole('button', { name: 'Copy Link' })).toHaveFocus()
  })
})
