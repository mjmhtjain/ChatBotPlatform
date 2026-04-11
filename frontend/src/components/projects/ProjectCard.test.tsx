import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProjectCard from './ProjectCard'

const sampleProject = {
  id: 'proj-1',
  name: 'My Bot',
  owner_email: 'admin@example.com',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

describe('ProjectCard', () => {
  it('renders the project name', () => {
    render(<ProjectCard project={sampleProject} onRename={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('My Bot')).toBeInTheDocument()
  })

  it('calls onRename when the rename button is clicked', async () => {
    const onRename = vi.fn()
    const user = userEvent.setup()
    render(<ProjectCard project={sampleProject} onRename={onRename} onDelete={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /rename project/i }))

    expect(onRename).toHaveBeenCalledOnce()
  })

  it('calls onDelete when the delete button is clicked', async () => {
    const onDelete = vi.fn()
    const user = userEvent.setup()
    render(<ProjectCard project={sampleProject} onRename={vi.fn()} onDelete={onDelete} />)

    await user.click(screen.getByRole('button', { name: /delete project/i }))

    expect(onDelete).toHaveBeenCalledOnce()
  })
})
