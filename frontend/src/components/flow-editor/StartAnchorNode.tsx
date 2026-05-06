import { Handle, Position } from '@xyflow/react'

export default function StartAnchorNode() {
  return (
    <div className="flex flex-col items-center gap-1 select-none">
      <Handle type="target" position={Position.Left} />
      <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-white text-2xl shadow-md">
        ▶
      </div>
      <span className="text-sm font-medium text-gray-700">Start</span>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
