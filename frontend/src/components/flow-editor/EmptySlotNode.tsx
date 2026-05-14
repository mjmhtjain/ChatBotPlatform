import { useState, useCallback } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'

interface EmptySlotData extends Record<string, unknown> {
  onSlotDrop?: (slotId: string, nodeType: string) => void
}

export default function EmptySlotNode({ id, data }: NodeProps) {
  const [highlighted, setHighlighted] = useState(false)
  const [hovered, setHovered] = useState(false)

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
      className="relative flex items-center justify-center select-none"
      style={{ width: 64, height: 64 }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Handle type="target" position={Position.Left} style={{ background: 'transparent', border: 'none' }} />
      <div
        className="flex items-center justify-center rounded-full transition-colors"
        style={{
          width: 64,
          height: 64,
          border: highlighted ? '2px dashed #3b82f6' : '2px dashed #9ca3af',
          background: highlighted ? '#eff6ff' : '#f9fafb',
          color: highlighted ? '#3b82f6' : '#9ca3af',
          fontSize: 28,
          lineHeight: 1,
          fontWeight: 500,
        }}
      >
        +
      </div>
      <Handle type="source" position={Position.Right} style={{ background: 'transparent', border: 'none' }} />
      {hovered && (
        <div
          className="absolute z-10 px-2 py-1 text-xs text-white bg-gray-800 rounded whitespace-nowrap pointer-events-none"
          style={{ bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)' }}
        >
          Drop node here
        </div>
      )}
    </div>
  )
}
