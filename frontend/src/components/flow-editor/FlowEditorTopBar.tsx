import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface Props {
  projectId: string
  flowName: string
  isDirty: boolean
  saving: boolean
  onFlowNameChange: (name: string) => void
  onSave: () => void
}

export default function FlowEditorTopBar({
  projectId, flowName, isDirty, saving, onFlowNameChange, onSave,
}: Props) {
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(flowName)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setDraft(flowName)
  }, [flowName])

  function handleBack() {
    if (isDirty && !confirm('You have unsaved changes. Leave anyway?')) return
    navigate(`/projects/${projectId}`)
  }

  function commitName() {
    setEditing(false)
    if (draft.trim() && draft.trim() !== flowName) {
      onFlowNameChange(draft.trim())
    } else {
      setDraft(flowName)
    }
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
        {editing ? (
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commitName}
            onKeyDown={e => { if (e.key === 'Enter') commitName(); if (e.key === 'Escape') { setDraft(flowName); setEditing(false) } }}
            autoFocus
            className="text-sm font-medium text-gray-900 border-b border-indigo-500 outline-none px-1 bg-transparent"
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-sm font-medium text-gray-900 hover:text-indigo-600 transition-colors"
          >
            {flowName}
          </button>
        )}
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
