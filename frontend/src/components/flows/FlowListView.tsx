import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { listFlows } from '../../lib/api'
import { FlowMeta } from '../../types/flow'
import FlowCard from './FlowCard'
import NewFlowModal from './NewFlowModal'
import RenameFlowModal from './RenameFlowModal'
import DeleteFlowModal from './DeleteFlowModal'

interface Props {
  projectId: string
}

export default function FlowListView({ projectId }: Props) {
  const navigate = useNavigate()
  const [flows, setFlows] = useState<FlowMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [renaming, setRenaming] = useState<FlowMeta | null>(null)
  const [deleting, setDeleting] = useState<FlowMeta | null>(null)

  useEffect(() => {
    listFlows(projectId)
      .then(setFlows)
      .catch(err => {
        if (err.response?.status === 401) navigate('/login')
      })
      .finally(() => setLoading(false))
  }, [projectId, navigate])

  function handleCreated(flow: FlowMeta) {
    setFlows(prev => [flow, ...prev])
    setShowNew(false)
    navigate(`/projects/${projectId}/flows/${flow.id}`)
  }

  function handleRenamed(flow: FlowMeta) {
    setFlows(prev => prev.map(f => f.id === flow.id ? flow : f))
    setRenaming(null)
  }

  function handleDeleted(id: string) {
    setFlows(prev => prev.filter(f => f.id !== id))
    setDeleting(null)
  }

  if (loading) {
    return <p className="text-sm text-gray-400">Loading flows...</p>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Flows</h2>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <span className="text-lg leading-none">+</span>
          New Flow
        </button>
      </div>

      {flows.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-sm">No flows yet. Create your first one!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {flows.map(f => (
            <FlowCard
              key={f.id}
              flow={f}
              onOpen={() => navigate(`/projects/${projectId}/flows/${f.id}`)}
              onRename={() => setRenaming(f)}
              onDelete={() => setDeleting(f)}
            />
          ))}
        </div>
      )}

      {showNew && (
        <NewFlowModal
          projectId={projectId}
          onClose={() => setShowNew(false)}
          onCreated={handleCreated}
        />
      )}
      {renaming && (
        <RenameFlowModal
          projectId={projectId}
          flow={renaming}
          onClose={() => setRenaming(null)}
          onRenamed={handleRenamed}
        />
      )}
      {deleting && (
        <DeleteFlowModal
          projectId={projectId}
          flow={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  )
}
