import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type Edge,
} from '@xyflow/react'
import { getFlow, updateFlow } from '../lib/api'
import { buildInitialChain, shouldResetFlow, sanitizeLoadedNodes } from '../lib/chain'
import FlowEditorTopBar from '../components/flow-editor/FlowEditorTopBar'
import NodePalette from '../components/flow-editor/NodePalette'
import FlowCanvas from '../components/flow-editor/FlowCanvas'
import NodeConfigPanel from '../components/flow-editor/NodeConfigPanel'

function FlowEditorInner({ projectId, flowId }: { projectId: string; flowId: string }) {
  const navigate = useNavigate()
  const rfInstance = useReactFlow()

  const [flowName, setFlowName] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const { nodes: initNodes, edges: initEdges } = buildInitialChain()
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initEdges)

  useEffect(() => {
    getFlow(projectId, flowId)
      .then(flow => {
        setFlowName(flow.name)
        if (!shouldResetFlow(flow.data)) {
          setNodes(sanitizeLoadedNodes(flow.data!.nodes ?? []))
          setEdges(flow.data!.edges ?? [])
        } else {
          const { nodes, edges } = buildInitialChain()
          setNodes(nodes)
          setEdges(edges)
        }
      })
      .catch(err => {
        if (err.response?.status === 401) navigate('/login')
        else navigate(`/projects/${projectId}`)
      })
  }, [projectId, flowId, navigate, setNodes, setEdges])

  const handleSave = useCallback(async () => {
    if (!rfInstance) return
    setSaving(true)
    try {
      const data = rfInstance.toObject()
      await updateFlow(projectId, flowId, { name: flowName, data })
      setIsDirty(false)
    } catch {
      alert('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }, [rfInstance, projectId, flowId, flowName])

  function updateNodeData(nodeId: string, data: Record<string, unknown>) {
    setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n))
    setSelectedNode(prev => prev?.id === nodeId ? { ...prev, data: { ...prev.data, ...data } } : prev)
    setIsDirty(true)
  }

  return (
    <div className="flex flex-col h-screen">
      <FlowEditorTopBar
        projectId={projectId}
        flowName={flowName}
        isDirty={isDirty}
        saving={saving}
        onSave={handleSave}
      />
      <div className="flex flex-1 overflow-hidden">
        <NodePalette />
        <FlowCanvas
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onDirty={() => setIsDirty(true)}
          onNodeSelect={setSelectedNode}
        />
        <NodeConfigPanel node={selectedNode} onUpdateData={updateNodeData} />
      </div>
    </div>
  )
}

export default function FlowEditorPage() {
  const { projectId, flowId } = useParams<{ projectId: string; flowId: string }>()
  const navigate = useNavigate()

  if (!projectId || !flowId) {
    navigate('/projects')
    return null
  }

  return (
    <ReactFlowProvider>
      <FlowEditorInner projectId={projectId} flowId={flowId} />
    </ReactFlowProvider>
  )
}
