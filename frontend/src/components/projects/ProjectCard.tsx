import { useNavigate } from 'react-router-dom'
import { Project } from '../../pages/ProjectsPage'

interface Props {
  project: Project
  onRename: () => void
  onDelete: () => void
}

export default function ProjectCard({ project, onRename, onDelete }: Props) {
  const navigate = useNavigate()

  return (
    <div
      onClick={() => navigate(`/projects/${project.id}`)}
      data-testid="project-card"
      className="group relative bg-white border border-gray-200 rounded-xl p-4 aspect-square flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* Actions — visible on hover */}
      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={e => { e.stopPropagation(); onRename() }}
          aria-label="Rename project"
          className="p-1 rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.415.586H9v-2.414a2 2 0 01.586-1.414z" />
          </svg>
        </button>
        <button
          onClick={e => { e.stopPropagation(); onDelete() }}
          aria-label="Delete project"
          className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4h6v3M3 7h18" />
          </svg>
        </button>
      </div>

      <p className="text-sm font-medium text-gray-800 break-words">{project.name}</p>
    </div>
  )
}
