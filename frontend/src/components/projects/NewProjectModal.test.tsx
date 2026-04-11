import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NewProjectModal from './NewProjectModal'

vi.mock('../../lib/api', () => ({
  default: { post: vi.fn() },
}))

import api from '../../lib/api'

const sampleProject = {
  id: 'proj-1',
  name: 'My Bot',
  owner_email: 'admin@example.com',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

afterEach(() => {
  vi.mocked(api.post).mockReset()
})

describe('NewProjectModal', () => {
  it('renders with an empty input and a Create button', () => {
    render(<NewProjectModal onClose={vi.fn()} onCreated={vi.fn()} />)
    expect(screen.getByLabelText(/project name/i)).toHaveValue('')
    expect(screen.getByRole('button', { name: /^create$/i })).toBeInTheDocument()
  })

  it('calls onClose when Cancel is clicked', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<NewProjectModal onClose={onClose} onCreated={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /cancel/i }))

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('disables the Create button and shows "Creating…" while submitting', async () => {
    vi.mocked(api.post).mockReturnValue(new Promise(() => {}))
    const user = userEvent.setup()
    render(<NewProjectModal onClose={vi.fn()} onCreated={vi.fn()} />)

    await user.type(screen.getByLabelText(/project name/i), 'My Bot')
    user.click(screen.getByRole('button', { name: /^create$/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled()
    })
  })

  it('calls onCreated with the returned project on success', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: sampleProject })
    const onCreated = vi.fn()
    const user = userEvent.setup()
    render(<NewProjectModal onClose={vi.fn()} onCreated={onCreated} />)

    await user.type(screen.getByLabelText(/project name/i), 'My Bot')
    await user.click(screen.getByRole('button', { name: /^create$/i }))

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalledWith(sampleProject)
    })
  })

  it('shows a duplicate-name error on 409', async () => {
    vi.mocked(api.post).mockRejectedValue({ response: { status: 409 } })
    const user = userEvent.setup()
    render(<NewProjectModal onClose={vi.fn()} onCreated={vi.fn()} />)

    await user.type(screen.getByLabelText(/project name/i), 'My Bot')
    await user.click(screen.getByRole('button', { name: /^create$/i }))

    await waitFor(() => {
      expect(screen.getByText(/a project with that name already exists/i)).toBeInTheDocument()
    })
  })

  it('shows a generic error on non-409 failures', async () => {
    vi.mocked(api.post).mockRejectedValue({ response: { status: 500 } })
    const user = userEvent.setup()
    render(<NewProjectModal onClose={vi.fn()} onCreated={vi.fn()} />)

    await user.type(screen.getByLabelText(/project name/i), 'My Bot')
    await user.click(screen.getByRole('button', { name: /^create$/i }))

    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    })
  })
})
