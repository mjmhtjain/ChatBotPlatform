import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MessageNodeImpl from './MessageNode'

const MessageNode = MessageNodeImpl as unknown as (props: {
  id?: string
  data: { message: string; onDelete?: () => void }
  selected?: boolean
  type?: string
}) => JSX.Element

vi.mock('@xyflow/react', () => ({
  Handle: () => null,
  Position: { Left: 'left', Right: 'right', Top: 'top', Bottom: 'bottom' },
}))

describe('MessageNode', () => {
  const baseProps = {
    id: 'test-node',
    selected: false,
    type: 'messageNode' as const,
  }

  it('renders a ✕ button when data.onDelete is provided and node is hovered', async () => {
    const onDeleteMock = vi.fn()
    const { container } = render(
      <MessageNode
        {...baseProps}
        data={{ message: 'Hello', onDelete: onDeleteMock }}
      />
    )
    const nodeDiv = container.firstChild as HTMLElement
    // Simulate hover
    fireEvent.mouseEnter(nodeDiv)
    expect(screen.getByLabelText('Delete node')).toBeInTheDocument()
  })

  it('clicking the ✕ button calls data.onDelete', () => {
    const onDeleteMock = vi.fn()
    const { container } = render(
      <MessageNode
        {...baseProps}
        data={{ message: 'Hello', onDelete: onDeleteMock }}
      />
    )
    const nodeDiv = container.firstChild as HTMLElement
    fireEvent.mouseEnter(nodeDiv)
    const deleteBtn = screen.getByLabelText('Delete node')
    fireEvent.click(deleteBtn)
    expect(onDeleteMock).toHaveBeenCalledTimes(1)
  })
})
