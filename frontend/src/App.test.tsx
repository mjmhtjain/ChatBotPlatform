import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from './App'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>
  )
}

describe('App routing', () => {
  it('renders the login page at /login', () => {
    renderAt('/login')
    expect(screen.getByRole('heading', { name: /chatbot platform/i })).toBeInTheDocument()
  })

  it('redirects unknown paths to /login', () => {
    renderAt('/unknown-route')
    expect(screen.getByRole('heading', { name: /chatbot platform/i })).toBeInTheDocument()
  })

  it('renders the projects page at /projects', () => {
    renderAt('/projects')
    expect(screen.getByText(/projects/i)).toBeInTheDocument()
  })
})
