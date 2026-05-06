import { Handle, Position } from '@xyflow/react'

export default function EmptySlotNode() {
  return (
    <div
      className="flex items-center justify-center select-none"
      style={{ width: 200, height: 60, border: '2px dashed #9ca3af', borderRadius: 8, background: '#f9fafb' }}
    >
      <Handle type="target" position={Position.Left} />
      <span className="text-gray-500 text-sm font-medium">+ Drop node here</span>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
