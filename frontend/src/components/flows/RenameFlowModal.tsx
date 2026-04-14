import { useState } from 'react'
import { updateFlow } from '../../lib/api'
import { FlowMeta } from '../../types/flow'

interface Props {
  projectId: string
  flow: FlowMeta
  onClose: () => void
  onRenamed: (flow: FlowMeta) => void
}

export default function RenameFlowModal({ projectId, flow, onClose, onRenamed }: Props) {
  const [name, setName] = useState(flow.name)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const updated = await updateFlow(projectId, flow.id, { name })
      onRenamed(updated)
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError('A flow with that name already exists.')
      } else {
        setError('Something went wrong.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Rename Flow</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="flow-rename" className="block text-sm font-medium text-gray-700 mb-1.5">
              Flow name
            </label>
            <input
              id="flow-rename"
              type="text"
              required
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
              {submitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
