import { useState } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import type { MessageNodeData } from '../../types/flow'

export default function MessageNode({ data, selected }: NodeProps) {
  const [hovered, setHovered] = useState(false)
  const nodeData = data as MessageNodeData & { onDelete?: () => void }

  return (
    <div
      className={`relative bg-white border-2 rounded-xl px-4 py-3 w-52 shadow-sm transition-colors ${
        selected ? 'border-indigo-500' : 'border-gray-200'
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Handle type="target" position={Position.Top} className="!bg-indigo-400" />

      {hovered && nodeData.onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); nodeData.onDelete!() }}
          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
          aria-label="Delete node"
        >
          ✕
        </button>
      )}

      <div className="flex items-center gap-2 mb-2">
        <svg className="w-3.5 h-3.5 text-indigo-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M21 16c0 1.1-.9 2-2 2H5a2 2 0 012-2h14a2 2 0 012 2v8z" />
        </svg>
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Message</span>
      </div>

      <p className="text-sm text-gray-700 leading-snug break-words min-h-[1.25rem]">
        {nodeData.message || <span className="text-gray-300 italic">No message set</span>}
      </p>

      <Handle type="source" position={Position.Bottom} className="!bg-indigo-400" />
    </div>
  )
}
