import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import FlowListView from '../components/flows/FlowListView'

type Tab = 'flow' | 'endpoint'

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('flow')

  if (!projectId) {
    navigate('/projects')
    return null
  }

  return (
    <div className="bg-gray-50 flex-1">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 mb-8">
          {(['flow', 'endpoint'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium capitalize rounded-t transition-colors ${
                activeTab === tab
                  ? 'text-indigo-600 border-b-2 border-indigo-600 -mb-px'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'flow' && <FlowListView projectId={projectId} />}
        {activeTab === 'endpoint' && (
          <div className="text-center py-20">
            <p className="text-gray-400 text-sm">Endpoint configuration — coming soon.</p>
          </div>
        )}
      </div>
    </div>
  )
}
