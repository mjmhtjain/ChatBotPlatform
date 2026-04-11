import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import TopBar from './TopBar'

// Mock getInitials so tests don't depend on real JWT decoding
vi.mock('../../lib/auth', () => ({
  getInitials: vi.fn(() => 'MJ'),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

function renderTopBar() {
  return render(
    <MemoryRouter>
      <TopBar />
    </MemoryRouter>
  )
}

beforeEach(() => {
  localStorage.setItem('access_token', 'fake.token.here')
})

afterEach(() => {
  localStorage.clear()
  mockNavigate.mockReset()
})

describe('TopBar', () => {
  it('renders the brand name', () => {
    renderTopBar()
    expect(screen.getByText(/chatbot platform/i)).toBeInTheDocument()
  })

  it('renders the avatar with initials', () => {
    renderTopBar()
    expect(screen.getByRole('button', { name: /user menu/i })).toHaveTextContent('MJ')
  })

  it('dropdown is hidden by default', () => {
    renderTopBar()
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('opens the dropdown when avatar is clicked', async () => {
    const user = userEvent.setup()
    renderTopBar()
    await user.click(screen.getByRole('button', { name: /user menu/i }))
    expect(screen.getByRole('menu')).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /profile/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /logout/i })).toBeInTheDocument()
  })

  it('closes the dropdown when clicking outside', async () => {
    const user = userEvent.setup()
    renderTopBar()
    await user.click(screen.getByRole('button', { name: /user menu/i }))
    expect(screen.getByRole('menu')).toBeInTheDocument()
    await user.click(document.body)
    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })
  })

  it('logout clears access_token and navigates to /login', async () => {
    const user = userEvent.setup()
    renderTopBar()
    await user.click(screen.getByRole('button', { name: /user menu/i }))
    await user.click(screen.getByRole('menuitem', { name: /logout/i }))
    expect(localStorage.getItem('access_token')).toBeNull()
    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })

  it('profile item navigates to /profile', async () => {
    const user = userEvent.setup()
    renderTopBar()
    await user.click(screen.getByRole('button', { name: /user menu/i }))
    await user.click(screen.getByRole('menuitem', { name: /profile/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/profile')
  })
})
