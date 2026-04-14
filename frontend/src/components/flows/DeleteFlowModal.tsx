import { useState } from 'react'
import { deleteFlow } from '../../lib/api'
import { FlowMeta } from '../../types/flow'

interface Props {
  projectId: string
  flow: FlowMeta
  onClose: () => void
  onDeleted: (id: string) => void
}

export default function DeleteFlowModal({ projectId, flow, onClose, onDeleted }: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    setSubmitting(true)
    setError('')
    try {
      await deleteFlow(projectId, flow.id)
      onDeleted(flow.id)
    } catch {
      setError('Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Delete Flow</h2>
        <p className="text-sm text-gray-600 mb-6">
          Delete <span className="font-medium">"{flow.name}"</span>? This cannot be undone.
        </p>
        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-lg transition-colors">
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={submitting}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {submitting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
