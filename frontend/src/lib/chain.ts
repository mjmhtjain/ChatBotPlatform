import type { Node, Edge } from '@xyflow/react'

export function buildInitialChain(): { nodes: Node[]; edges: Edge[] } {
  const startId = 'chain-start'
  const emptyId = 'chain-empty'
  const endId = 'chain-end'

  const nodes: Node[] = [
    {
      id: startId,
      type: 'startAnchor',
      position: { x: 0, y: 100 },
      data: {},
      draggable: false,
      deletable: false,
    },
    {
      id: emptyId,
      type: 'emptySlot',
      position: { x: 250, y: 100 },
      data: {},
      draggable: false,
      deletable: false,
    },
    {
      id: endId,
      type: 'endAnchor',
      position: { x: 500, y: 100 },
      data: {},
      draggable: false,
      deletable: false,
    },
  ]

  const edges: Edge[] = [
    {
      id: 'edge-start-empty',
      source: startId,
      target: emptyId,
      type: 'smoothstep',
      animated: false,
    },
    {
      id: 'edge-empty-end',
      source: emptyId,
      target: endId,
      type: 'smoothstep',
      animated: false,
    },
  ]

  return { nodes, edges }
}

export function isOldFormatFlow(nodes: Node[]): boolean {
  return !nodes.some(node => node.type === 'startAnchor')
}

export function applyCollapseRule(
  nodes: Node[],
  edges: Edge[],
  nodeId: string
): { nodes: Node[]; edges: Edge[] } {
  // Find the node to remove
  const targetNode = nodes.find(n => n.id === nodeId)
  if (!targetNode) {
    return { nodes, edges }
  }

  // Find the flanking empty slots via edges
  const incomingEdge = edges.find(e => e.target === nodeId)
  const outgoingEdge = edges.find(e => e.source === nodeId)

  if (!incomingEdge || !outgoingEdge) {
    return { nodes, edges }
  }

  const leftEmptyId = incomingEdge.source
  const rightEmptyId = outgoingEdge.target

  // Find the predecessor and successor of the two empty slots
  const leftIncoming = edges.find(e => e.target === leftEmptyId)
  const rightOutgoing = edges.find(e => e.source === rightEmptyId)

  if (!leftIncoming || !rightOutgoing) {
    return { nodes, edges }
  }

  const predecessorId = leftIncoming.source
  const successorId = rightOutgoing.target

  // Create merged empty slot
  const mergedEmpty: Node = {
    id: crypto.randomUUID(),
    type: 'emptySlot',
    position: { x: 0, y: 0 },
    data: {},
    draggable: false,
    deletable: false,
  }

  // Build new nodes list: remove leftEmpty, target, rightEmpty; insert mergedEmpty in place
  const removedIds = new Set([leftEmptyId, nodeId, rightEmptyId])
  const remainingNodes = nodes.filter(n => !removedIds.has(n.id))

  // Find the index of predecessor in remainingNodes and insert mergedEmpty after it
  const predIndex = remainingNodes.findIndex(n => n.id === predecessorId)
  const newNodes = [
    ...remainingNodes.slice(0, predIndex + 1),
    mergedEmpty,
    ...remainingNodes.slice(predIndex + 1),
  ]

  // Recalculate x-positions
  const recalculated = newNodes.map((n, i) => ({
    ...n,
    position: { x: i * 250, y: 0 },
  }))

  // Build new edges: remove all edges touching removed nodes + add new edges
  const removedEdgeSourceTargets = new Set([leftEmptyId, nodeId, rightEmptyId])
  const remainingEdges = edges.filter(
    e => !removedEdgeSourceTargets.has(e.source) && !removedEdgeSourceTargets.has(e.target)
  )

  // Add edges: predecessor -> mergedEmpty -> successor
  const newEdges: Edge[] = [
    ...remainingEdges,
    {
      id: crypto.randomUUID(),
      source: predecessorId,
      target: mergedEmpty.id,
      type: 'smoothstep',
    },
    {
      id: crypto.randomUUID(),
      source: mergedEmpty.id,
      target: successorId,
      type: 'smoothstep',
    },
  ]

  return { nodes: recalculated, edges: newEdges }
}
