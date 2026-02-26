import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, test } from 'vitest'
import { OotdPage } from './Ootd'

describe('OotdPage', () => {
  afterEach(() => cleanup())

  test('renders title, subtitle, required sections, and inspiration tiles', () => {
    render(<OotdPage />)

    expect(screen.getByRole('heading', { name: '#OOTD' })).toBeInTheDocument()
    expect(screen.getByText('Garden Formal Attire FAQ')).toBeInTheDocument()

    expect(screen.getByRole('button', { name: 'What does Garden Formal mean?' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'For Women' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'For Men' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Footwear on Grass (important)' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Florida in March' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Quick FAQs' })).toBeInTheDocument()

    const topCallout = screen.getByRole('note', { name: 'Grass-Friendly Shoes' })
    expect(topCallout).toHaveTextContent(
      'Both the ceremony and reception are on grass. If you’re choosing heels, consider block heels, wedges, stable heeled sandals, or a chic flat. Stilettos may sink into the lawn.',
    )

    expect(screen.getByText('Midi Dress')).toBeInTheDocument()
    expect(screen.getByText('Floor-Length Gown')).toBeInTheDocument()
    expect(screen.getByText('Elevated Cocktail Dress')).toBeInTheDocument()
    expect(screen.getByText('Navy Suit')).toBeInTheDocument()
    expect(screen.getByText('Charcoal Suit')).toBeInTheDocument()
    expect(screen.getByText('Linen-Blend Suit')).toBeInTheDocument()
  })

  test('opens quick FAQ item and updates accordion accessibility state', async () => {
    const user = userEvent.setup()
    render(<OotdPage />)

    const blackTieQuestion = screen.getByRole('button', { name: 'Is this black tie?' })
    expect(blackTieQuestion).toHaveAttribute('aria-expanded', 'false')

    await user.click(blackTieQuestion)

    expect(blackTieQuestion).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('No — this is formal, but not black tie.')).toBeInTheDocument()
  })

  test('supports arrow-key navigation between accordion triggers', async () => {
    const user = userEvent.setup()
    render(<OotdPage />)

    const meaningButton = screen.getByRole('button', { name: 'What does Garden Formal mean?' })
    const womenButton = screen.getByRole('button', { name: 'For Women' })

    meaningButton.focus()
    await user.keyboard('{ArrowDown}')

    expect(womenButton).toHaveFocus()
  })
})
