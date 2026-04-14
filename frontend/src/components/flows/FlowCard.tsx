import { FlowMeta } from '../../types/flow'

interface Props {
  flow: FlowMeta
  onOpen: () => void
  onRename: () => void
  onDelete: () => void
}

export default function FlowCard({ flow, onOpen, onRename, onDelete }: Props) {
  const updated = new Date(flow.updated_at).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  })

  return (
    <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-5 py-4 hover:shadow-sm transition-shadow">
      <div
        onClick={onOpen}
        className="flex-1 cursor-pointer"
      >
        <p className="text-sm font-medium text-gray-900">{flow.name}</p>
        <p className="text-xs text-gray-400 mt-0.5">Updated {updated}</p>
      </div>
      <div className="flex gap-2 ml-4">
        <button
          onClick={onRename}
          aria-label="Rename flow"
          className="p-1.5 rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.415.586H9v-2.414a2 2 0 01.586-1.414z" />
          </svg>
        </button>
        <button
          onClick={onDelete}
          aria-label="Delete flow"
          className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4h6v3M3 7h18" />
          </svg>
        </button>
      </div>
    </div>
  )
}
