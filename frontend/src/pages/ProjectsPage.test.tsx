import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import ProjectsPage from './ProjectsPage'

vi.mock('../lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

import api from '../lib/api'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

const sampleProject = {
  id: 'proj-1',
  name: 'My Bot',
  owner_email: 'admin@example.com',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

function renderPage() {
  return render(
    <MemoryRouter>
      <ProjectsPage />
    </MemoryRouter>
  )
}

afterEach(() => {
  vi.mocked(api.get).mockReset()
  vi.mocked(api.post).mockReset()
  vi.mocked(api.patch).mockReset()
  vi.mocked(api.delete).mockReset()
  mockNavigate.mockReset()
})

describe('ProjectsPage', () => {
  it('shows projects after loading', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [sampleProject] })
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('My Bot')).toBeInTheDocument()
    })
  })

  it('shows empty state when no projects', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] })
    renderPage()
    await waitFor(() => {
      expect(screen.getByText(/no projects yet/i)).toBeInTheDocument()
    })
  })

  it('redirects to /login on 401', async () => {
    vi.mocked(api.get).mockRejectedValue({ response: { status: 401 } })
    renderPage()
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })
  })

  it('creates a new project and appends it to the list', async () => {
    const newProject = { ...sampleProject, id: 'proj-2', name: 'New Bot' }
    vi.mocked(api.get).mockResolvedValue({ data: [sampleProject] })
    vi.mocked(api.post).mockResolvedValue({ data: newProject })
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => expect(screen.getByText('My Bot')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /new project/i }))
    await user.type(screen.getByLabelText(/project name/i), 'New Bot')
    await user.click(screen.getByRole('button', { name: /^create$/i }))

    await waitFor(() => {
      expect(screen.getByText('New Bot')).toBeInTheDocument()
    })
  })

  it('shows 409 error on duplicate project name in create modal', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] })
    vi.mocked(api.post).mockRejectedValue({ response: { status: 409 } })
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => expect(screen.getByRole('button', { name: /new project/i })).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /new project/i }))
    await user.type(screen.getByLabelText(/project name/i), 'Duplicate')
    await user.click(screen.getByRole('button', { name: /^create$/i }))

    await waitFor(() => {
      expect(screen.getByText(/a project with that name already exists/i)).toBeInTheDocument()
    })
  })
})
