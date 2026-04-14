import type { Node } from '@xyflow/react'
import type { MessageNodeData } from '../../types/flow'

interface Props {
  node: Node | null
  onUpdateData: (nodeId: string, data: Record<string, unknown>) => void
}

export default function NodeConfigPanel({ node, onUpdateData }: Props) {
  if (!node) return null

  if (node.type === 'messageNode') {
    const data = node.data as MessageNodeData
    return (
      <div className="w-64 shrink-0 bg-white border-l border-gray-200 p-4 overflow-y-auto">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Message Node</p>
        <div>
          <label htmlFor="node-message" className="block text-sm font-medium text-gray-700 mb-1.5">
            Message text
          </label>
          <textarea
            id="node-message"
            rows={5}
            value={data.message}
            onChange={e => onUpdateData(node.id, { message: e.target.value })}
            placeholder="Hello! How can I help you today?"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          />
        </div>
      </div>
    )
  }

  return null
}
