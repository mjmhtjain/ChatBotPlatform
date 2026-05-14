import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import EmptySlotNode from './EmptySlotNode'

const Slot = EmptySlotNode as unknown as (props: { id?: string; data?: Record<string, unknown> }) => JSX.Element

vi.mock('@xyflow/react', () => ({
  Handle: () => null,
  Position: { Left: 'left', Right: 'right' },
}))

describe('EmptySlotNode', () => {
  it('shows "Drop node here" tooltip on hover', () => {
    const { container } = render(<Slot id="test" data={{}} />)
    fireEvent.mouseEnter(container.firstChild as HTMLElement)
    expect(screen.getByText(/drop/i)).toBeInTheDocument()
  })
})
