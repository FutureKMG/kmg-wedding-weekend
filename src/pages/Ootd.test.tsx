import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { OotdPage } from './Ootd'

describe('OotdPage', () => {
  afterEach(() => cleanup())

  test('renders editorial header, intro, section headings, and encouragement copy', () => {
    render(<OotdPage />)

    expect(screen.getByRole('heading', { name: '#OOTD' })).toBeInTheDocument()
    expect(screen.getByText('Garden-Formal Outfit Inspiration')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Our wedding will be on the lawn and terrace of the Fenway Hotel — a historic, jazz-age inspired venue in Dunedin, Florida. With waterfront views and a refined garden-formal setting, we want everyone to look and feel great from ceremony through dancing under the stars.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Women’s Style Gallery' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Men’s Style Gallery' })).toBeInTheDocument()
    expect(screen.getByText('Structured cocktail dresses & midi gowns')).toBeInTheDocument()
    expect(screen.getByText('Ties optional but welcome')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Grass considerations ➤ Wedges & block heels photograph and perform beautifully on lawns.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('If you love a pocket square moment — this is your event.')).toBeInTheDocument()
  })

  test('renders all inspiration links with encoded Pinterest URLs and safe external attrs', () => {
    render(<OotdPage />)

    const links = screen.getAllByRole('link', { name: /inspiration$/i })
    expect(links).toHaveLength(10)
    expect(links[0]).toHaveAttribute(
      'href',
      'https://www.pinterest.com/search/pins/?q=garden%20formal%20wedding%20guest%20dress%20Pinterest',
    )
    expect(links[9]).toHaveAttribute(
      'href',
      'https://www.pinterest.com/search/pins/?q=men%20wedding%20guest%20loafers%20dress%20shoes',
    )
    for (const link of links) {
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noreferrer')
    }
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

  test('inspiration links are keyboard focusable with clear accessible names', async () => {
    const user = userEvent.setup()
    render(<OotdPage />)

    await user.tab()
    expect(screen.getByRole('button', { name: 'Copy Link' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('link', { name: 'Garden-Formal Guest Dresses inspiration' })).toHaveFocus()
  })
})
