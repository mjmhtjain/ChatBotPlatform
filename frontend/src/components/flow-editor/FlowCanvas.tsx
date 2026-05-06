import { useCallback } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type NodeMouseHandler,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import MessageNode from './MessageNode'
import StartAnchorNode from './StartAnchorNode'
import EndAnchorNode from './EndAnchorNode'
import EmptySlotNode from './EmptySlotNode'
import type { MessageNodeData } from '../../types/flow'

const nodeTypes = {
  messageNode: MessageNode,
  startAnchor: StartAnchorNode,
  endAnchor: EndAnchorNode,
  emptySlot: EmptySlotNode,
}

interface Props {
  nodes: Node[]
  edges: Edge[]
  onNodesChange: OnNodesChange
  onEdgesChange: OnEdgesChange
  onDirty: () => void
  onNodeSelect: (node: Node | null) => void
}

export default function FlowCanvas({
  nodes, edges, onNodesChange, onEdgesChange, onDirty, onNodeSelect,
}: Props) {
  const rfInstance = useReactFlow()

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const nodeType = e.dataTransfer.getData('application/reactflow-nodetype')
    if (!nodeType) return

    const position = rfInstance.screenToFlowPosition({ x: e.clientX, y: e.clientY })
    const newNode: Node = {
      id: crypto.randomUUID(),
      type: nodeType,
      position,
      data: nodeType === 'messageNode' ? { message: '' } satisfies MessageNodeData : {},
    }

    onNodesChange([{ type: 'add', item: newNode }])
    onDirty()
  }, [rfInstance, onNodesChange, onDirty])

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleNodeClick: NodeMouseHandler = useCallback((_e, node) => {
    onNodeSelect(node)
  }, [onNodeSelect])

  const handlePaneClick = useCallback(() => {
    onNodeSelect(null)
  }, [onNodeSelect])

  const handleNodesChange: OnNodesChange = useCallback((changes) => {
    onNodesChange(changes)
    const isPositionChange = changes.some(c => c.type === 'position' && c.dragging)
    if (isPositionChange) onDirty()
  }, [onNodesChange, onDirty])

  const handleEdgesChange: OnEdgesChange = useCallback((changes) => {
    onEdgesChange(changes)
    onDirty()
  }, [onEdgesChange, onDirty])

  return (
    <div className="flex-1 h-full" onDrop={onDrop} onDragOver={onDragOver}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        deleteKeyCode={null}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  )
}
