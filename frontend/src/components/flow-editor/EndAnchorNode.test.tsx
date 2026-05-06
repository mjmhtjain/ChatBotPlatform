import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import EndAnchorNode from './EndAnchorNode'

vi.mock('@xyflow/react', () => ({
  Handle: () => null,
  Position: { Left: 'left', Right: 'right' },
}))

describe('EndAnchorNode', () => {
  it('renders text "End"', () => {
    render(<EndAnchorNode />)
    expect(screen.getByText('End')).toBeInTheDocument()
  })
})
