import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import EmptySlotNode from './EmptySlotNode'

vi.mock('@xyflow/react', () => ({
  Handle: () => null,
  Position: { Left: 'left', Right: 'right' },
}))

describe('EmptySlotNode', () => {
  it('renders text matching /drop/i', () => {
    render(<EmptySlotNode />)
    expect(screen.getByText(/drop/i)).toBeInTheDocument()
  })
})
