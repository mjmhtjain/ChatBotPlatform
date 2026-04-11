import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RenameProjectModal from './RenameProjectModal'

vi.mock('../../lib/api', () => ({
  default: { patch: vi.fn() },
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
  vi.mocked(api.patch).mockReset()
})

describe('RenameProjectModal', () => {
  it('pre-fills the input with the current project name', () => {
    render(<RenameProjectModal project={sampleProject} onClose={vi.fn()} onRenamed={vi.fn()} />)
    expect(screen.getByLabelText(/project name/i)).toHaveValue('My Bot')
  })

  it('calls onClose when Cancel is clicked', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<RenameProjectModal project={sampleProject} onClose={onClose} onRenamed={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /cancel/i }))

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('disables the Save button and shows "Saving…" while submitting', async () => {
    vi.mocked(api.patch).mockReturnValue(new Promise(() => {}))
    const user = userEvent.setup()
    render(<RenameProjectModal project={sampleProject} onClose={vi.fn()} onRenamed={vi.fn()} />)

    user.click(screen.getByRole('button', { name: /^save$/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled()
    })
  })

  it('calls onRenamed with the updated project on success', async () => {
    const renamed = { ...sampleProject, name: 'Renamed Bot' }
    vi.mocked(api.patch).mockResolvedValue({ data: renamed })
    const onRenamed = vi.fn()
    const user = userEvent.setup()
    render(<RenameProjectModal project={sampleProject} onClose={vi.fn()} onRenamed={onRenamed} />)

    await user.clear(screen.getByLabelText(/project name/i))
    await user.type(screen.getByLabelText(/project name/i), 'Renamed Bot')
    await user.click(screen.getByRole('button', { name: /^save$/i }))

    await waitFor(() => {
      expect(onRenamed).toHaveBeenCalledWith(renamed)
    })
  })

  it('shows a duplicate-name error on 409', async () => {
    vi.mocked(api.patch).mockRejectedValue({ response: { status: 409 } })
    const user = userEvent.setup()
    render(<RenameProjectModal project={sampleProject} onClose={vi.fn()} onRenamed={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /^save$/i }))

    await waitFor(() => {
      expect(screen.getByText(/a project with that name already exists/i)).toBeInTheDocument()
    })
  })

  it('shows a generic error on non-409 failures', async () => {
    vi.mocked(api.patch).mockRejectedValue({ response: { status: 500 } })
    const user = userEvent.setup()
    render(<RenameProjectModal project={sampleProject} onClose={vi.fn()} onRenamed={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /^save$/i }))

    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    })
  })
})
