import { useState, useCallback } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'

interface EmptySlotData extends Record<string, unknown> {
  onSlotDrop?: (slotId: string, nodeType: string) => void
}

export default function EmptySlotNode({ id, data }: NodeProps) {
  const [highlighted, setHighlighted] = useState(false)

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    setHighlighted(true)
  }, [])

  const onDragLeave = useCallback(() => {
    setHighlighted(false)
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setHighlighted(false)
    const nodeType = e.dataTransfer.getData('application/reactflow-nodetype')
    if (!nodeType) return
    const slotData = data as EmptySlotData
    slotData.onSlotDrop?.(id, nodeType)
  }, [id, data])

  return (
    <div
      className="flex items-center justify-center select-none"
      style={{
        width: 200,
        height: 60,
        border: highlighted ? '2px dashed #3b82f6' : '2px dashed #9ca3af',
        borderRadius: 8,
        background: highlighted ? '#eff6ff' : '#f9fafb',
        transition: 'border-color 0.15s, background 0.15s',
      }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <Handle type="target" position={Position.Left} />
      <span className={highlighted ? 'text-blue-500 text-sm font-medium' : 'text-gray-500 text-sm font-medium'}>
        + Drop node here
      </span>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
