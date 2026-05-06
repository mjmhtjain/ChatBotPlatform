import { useCallback } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
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
  onSlotDrop: (slotId: string, nodeType: string) => void
}

export default function FlowCanvas({
  nodes, edges, onNodesChange, onEdgesChange, onDirty, onNodeSelect, onSlotDrop,
}: Props) {
  // Reject drops on the blank canvas — only EmptySlotNode handles drops
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    // intentionally do nothing — drops are handled by EmptySlotNode
  }, [])

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

  // Inject onSlotDrop callback into emptySlot node data
  const nodesWithSlotDrop = nodes.map(n =>
    n.type === 'emptySlot'
      ? { ...n, data: { ...n.data, onSlotDrop } }
      : n
  )

  return (
    <div className="flex-1 h-full" onDrop={onDrop} onDragOver={onDragOver}>
      <ReactFlow
        nodes={nodesWithSlotDrop}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  )
}
