import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DeleteConfirmModal from './DeleteConfirmModal'

vi.mock('../../lib/api', () => ({
  default: { delete: vi.fn() },
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
  vi.mocked(api.delete).mockReset()
})

describe('DeleteConfirmModal', () => {
  it('displays the project name in the confirmation message', () => {
    render(<DeleteConfirmModal project={sampleProject} onClose={vi.fn()} onDeleted={vi.fn()} />)
    expect(screen.getByText(/my bot/i)).toBeInTheDocument()
    expect(screen.getByText(/this cannot be undone/i)).toBeInTheDocument()
  })

  it('calls onClose when Cancel is clicked', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<DeleteConfirmModal project={sampleProject} onClose={onClose} onDeleted={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /cancel/i }))

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('disables the Delete button and shows "Deleting…" while submitting', async () => {
    vi.mocked(api.delete).mockReturnValue(new Promise(() => {}))
    const user = userEvent.setup()
    render(<DeleteConfirmModal project={sampleProject} onClose={vi.fn()} onDeleted={vi.fn()} />)

    user.click(screen.getByRole('button', { name: /^delete$/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /deleting/i })).toBeDisabled()
    })
  })

  it('calls onDeleted with the project id on success', async () => {
    vi.mocked(api.delete).mockResolvedValue({})
    const onDeleted = vi.fn()
    const user = userEvent.setup()
    render(<DeleteConfirmModal project={sampleProject} onClose={vi.fn()} onDeleted={onDeleted} />)

    await user.click(screen.getByRole('button', { name: /^delete$/i }))

    await waitFor(() => {
      expect(onDeleted).toHaveBeenCalledWith('proj-1')
    })
  })

  it('shows a generic error when the delete request fails', async () => {
    vi.mocked(api.delete).mockRejectedValue(new Error('Network error'))
    const user = userEvent.setup()
    render(<DeleteConfirmModal project={sampleProject} onClose={vi.fn()} onDeleted={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /^delete$/i }))

    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    })
  })
})
