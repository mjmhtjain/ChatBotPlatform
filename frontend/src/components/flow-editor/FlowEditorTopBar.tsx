import { useNavigate } from 'react-router-dom'

interface Props {
  projectId: string
  flowName: string
  isDirty: boolean
  saving: boolean
  onSave: () => void
}

export default function FlowEditorTopBar({
  projectId, flowName, isDirty, saving, onSave,
}: Props) {
  const navigate = useNavigate()

  function handleBack() {
    if (isDirty && !confirm('You have unsaved changes. Leave anyway?')) return
    navigate(`/projects/${projectId}`)
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shrink-0">
      {/* Back */}
      <button
        onClick={handleBack}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Projects
      </button>

      {/* Flow name */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-900">{flowName}</span>
        {isDirty && !saving && (
          <span className="text-xs text-amber-500">Unsaved changes</span>
        )}
      </div>

      {/* Save */}
      <button
        onClick={onSave}
        disabled={saving || !isDirty}
        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors"
      >
        {saving ? 'Saving...' : 'Save'}
      </button>
    </div>
  )
}
