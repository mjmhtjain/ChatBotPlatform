import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import LoginPage from './LoginPage'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

function renderLoginPage() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  )
}

afterEach(() => {
  mockNavigate.mockReset()
})

describe('LoginPage', () => {
  it('renders email input, password input, and sign-in button', () => {
    renderLoginPage()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows a spinner and disables the button while submitting', async () => {
    const user = userEvent.setup()
    renderLoginPage()

    await user.type(screen.getByLabelText(/email/i), 'admin@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')

    // Click but don't await further — spinner appears synchronously before the 600ms timer fires
    user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/signing in/i)).toBeInTheDocument()
      expect(screen.getByRole('button')).toBeDisabled()
    })
  })

  it('navigates to /projects after submit completes', async () => {
    const user = userEvent.setup()
    renderLoginPage()

    await user.type(screen.getByLabelText(/email/i), 'admin@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    // Wait up to 2s for the 600ms setTimeout in LoginPage to fire
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/projects')
    }, { timeout: 2000 })
  })
})
