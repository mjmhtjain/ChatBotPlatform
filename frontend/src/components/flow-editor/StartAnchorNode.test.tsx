import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import StartAnchorNode from './StartAnchorNode'

vi.mock('@xyflow/react', () => ({
  Handle: () => null,
  Position: { Left: 'left', Right: 'right' },
}))

describe('StartAnchorNode', () => {
  it('renders text "Start"', () => {
    render(<StartAnchorNode />)
    expect(screen.getByText('Start')).toBeInTheDocument()
  })
})
