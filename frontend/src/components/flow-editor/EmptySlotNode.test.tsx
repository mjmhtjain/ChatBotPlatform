import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import EmptySlotNode from './EmptySlotNode'

const Slot = EmptySlotNode as unknown as (props: { id?: string; data?: Record<string, unknown> }) => JSX.Element

vi.mock('@xyflow/react', () => ({
  Handle: () => null,
  Position: { Left: 'left', Right: 'right' },
}))

describe('EmptySlotNode', () => {
  it('renders text matching /drop/i', () => {
    render(<Slot id="test" data={{}} />)
    expect(screen.getByText(/drop/i)).toBeInTheDocument()
  })
})
