import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Layout from './Layout'

// Stub TopBar — layout tests don't need to re-test topbar behaviour
vi.mock('./TopBar', () => ({
  default: () => <div data-testid="topbar" />,
}))

function renderLayout(children: React.ReactNode) {
  return render(
    <MemoryRouter>
      <Layout>{children}</Layout>
    </MemoryRouter>
  )
}

describe('Layout', () => {
  it('renders the TopBar', () => {
    renderLayout(<p>content</p>)
    expect(screen.getByTestId('topbar')).toBeInTheDocument()
  })

  it('renders its children', () => {
    renderLayout(<p>hello world</p>)
    expect(screen.getByText('hello world')).toBeInTheDocument()
  })
})
