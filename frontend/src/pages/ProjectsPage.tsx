import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import ProjectCard from '../components/projects/ProjectCard'
import NewProjectModal from '../components/projects/NewProjectModal'
import RenameProjectModal from '../components/projects/RenameProjectModal'
import DeleteConfirmModal from '../components/projects/DeleteConfirmModal'

export interface Project {
  id: string
  name: string
  owner_email: string
  created_at: string
  updated_at: string
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [renaming, setRenaming] = useState<Project | null>(null)
  const [deleting, setDeleting] = useState<Project | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    api.get<Project[]>('/api/projects')
      .then(res => setProjects(res.data))
      .catch(err => {
        if (err.response?.status === 401) navigate('/login')
      })
      .finally(() => setLoading(false))
  }, [navigate])

  function handleCreated(project: Project) {
    setProjects(prev => [...prev, project])
    setShowNew(false)
  }

  function handleRenamed(project: Project) {
    setProjects(prev => prev.map(p => p.id === project.id ? project : p))
    setRenaming(null)
  }

  function handleDeleted(id: string) {
    setProjects(prev => prev.filter(p => p.id !== id))
    setDeleting(null)
  }

  if (loading) {
    return (
      <div className="flex-1 bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading projects...</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 flex-1">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Projects</h1>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <span className="text-lg leading-none">+</span>
            New Project
          </button>
        </div>

        {/* Grid */}
        {projects.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-sm">No projects yet. Create your first one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {projects.map(p => (
              <ProjectCard
                key={p.id}
                project={p}
                onRename={() => setRenaming(p)}
                onDelete={() => setDeleting(p)}
              />
            ))}
          </div>
        )}
      </div>

      {showNew && (
        <NewProjectModal
          onClose={() => setShowNew(false)}
          onCreated={handleCreated}
        />
      )}
      {renaming && (
        <RenameProjectModal
          project={renaming}
          onClose={() => setRenaming(null)}
          onRenamed={handleRenamed}
        />
      )}
      {deleting && (
        <DeleteConfirmModal
          project={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  )
}
