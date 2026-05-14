import type { Node, Edge, ReactFlowJsonObject } from '@xyflow/react'

const STRUCTURAL_NODE_TYPES = new Set(['startAnchor', 'endAnchor', 'emptySlot', 'messageNode'])

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
      type: 'straight',
      animated: false,
    },
    {
      id: 'edge-empty-end',
      source: emptyId,
      target: endId,
      type: 'straight',
      animated: false,
    },
  ]

  return { nodes, edges }
}

export function isOldFormatFlow(nodes: Node[]): boolean {
  return !nodes.some(node => node.type === 'startAnchor')
}

export function shouldResetFlow(flowData: ReactFlowJsonObject | null | undefined): boolean {
  if (!flowData) return true
  return isOldFormatFlow(flowData.nodes ?? [])
}

export function sanitizeLoadedEdges(edges: Edge[]): Edge[] {
  return edges.map(edge => ({ ...edge, type: 'straight' }))
}

export function sanitizeLoadedNodes(nodes: Node[]): Node[] {
  return nodes.map(node => {
    if (STRUCTURAL_NODE_TYPES.has(node.type ?? '')) {
      return { ...node, draggable: false, deletable: false }
    }
    return { ...node }
  })
}

export function applyGrowthRule(
  nodes: Node[],
  edges: Edge[],
  slotId: string,
  nodeType: string,
  nodeData?: Record<string, unknown>
): { nodes: Node[]; edges: Edge[] } {
  const slotNode = nodes.find(n => n.id === slotId)
  if (!slotNode) {
    throw new Error(`applyGrowthRule: slotId "${slotId}" not found in nodes`)
  }

  const inEdge = edges.find(e => e.target === slotId)
  const outEdge = edges.find(e => e.source === slotId)

  const predecessorId = inEdge?.source
  const successorId = outEdge?.target

  const newEmptyBeforeId = `empty-${crypto.randomUUID()}`
  const newNodeId = `node-${crypto.randomUUID()}`
  const newEmptyAfterId = `empty-${crypto.randomUUID()}`

  const newEmptyBefore: Node = {
    id: newEmptyBeforeId,
    type: 'emptySlot',
    position: { x: 0, y: 0 },
    data: {},
    draggable: false,
    deletable: false,
  }

  const newNode: Node = {
    id: newNodeId,
    type: nodeType,
    position: { x: 0, y: 0 },
    data: nodeData ?? {},
    draggable: false,
    deletable: false,
  }

  const newEmptyAfter: Node = {
    id: newEmptyAfterId,
    type: 'emptySlot',
    position: { x: 0, y: 0 },
    data: {},
    draggable: false,
    deletable: false,
  }

  const newNodesList: Node[] = []
  for (const n of nodes) {
    if (n.id === slotId) {
      newNodesList.push(newEmptyBefore, newNode, newEmptyAfter)
    } else {
      newNodesList.push({ ...n })
    }
  }

  const repositionedNodes = newNodesList.map((n, i) => ({
    ...n,
    position: { x: i * 250, y: 0 },
  }))

  const remainingEdges = edges.filter(e => e.source !== slotId && e.target !== slotId)

  const newEdges: Edge[] = [
    ...remainingEdges,
  ]

  if (predecessorId) {
    newEdges.push({
      id: `edge-${predecessorId}-${newEmptyBeforeId}`,
      source: predecessorId,
      target: newEmptyBeforeId,
      type: 'straight',
      animated: false,
    })
  }

  newEdges.push({
    id: `edge-${newEmptyBeforeId}-${newNodeId}`,
    source: newEmptyBeforeId,
    target: newNodeId,
    type: 'straight',
    animated: false,
  })

  newEdges.push({
    id: `edge-${newNodeId}-${newEmptyAfterId}`,
    source: newNodeId,
    target: newEmptyAfterId,
    type: 'straight',
    animated: false,
  })

  if (successorId) {
    newEdges.push({
      id: `edge-${newEmptyAfterId}-${successorId}`,
      source: newEmptyAfterId,
      target: successorId,
      type: 'straight',
      animated: false,
    })
  }

  const nodeIndexMap = new Map(repositionedNodes.map((n, i) => [n.id, i]))
  newEdges.sort((a, b) => (nodeIndexMap.get(a.source) ?? 0) - (nodeIndexMap.get(b.source) ?? 0))

  return { nodes: repositionedNodes, edges: newEdges }
}

export function applyCollapseRule(
  nodes: Node[],
  edges: Edge[],
  nodeId: string
): { nodes: Node[]; edges: Edge[] } {
  const targetNode = nodes.find(n => n.id === nodeId)
  if (!targetNode) {
    return { nodes, edges }
  }

  const incomingEdge = edges.find(e => e.target === nodeId)
  const outgoingEdge = edges.find(e => e.source === nodeId)

  if (!incomingEdge || !outgoingEdge) {
    return { nodes, edges }
  }

  const leftEmptyId = incomingEdge.source
  const rightEmptyId = outgoingEdge.target

  const leftIncoming = edges.find(e => e.target === leftEmptyId)
  const rightOutgoing = edges.find(e => e.source === rightEmptyId)

  if (!leftIncoming || !rightOutgoing) {
    return { nodes, edges }
  }

  const predecessorId = leftIncoming.source
  const successorId = rightOutgoing.target

  const mergedEmpty: Node = {
    id: crypto.randomUUID(),
    type: 'emptySlot',
    position: { x: 0, y: 0 },
    data: {},
    draggable: false,
    deletable: false,
  }

  const removedIds = new Set([leftEmptyId, nodeId, rightEmptyId])
  const remainingNodes = nodes.filter(n => !removedIds.has(n.id))

  const predIndex = remainingNodes.findIndex(n => n.id === predecessorId)
  const newNodes = [
    ...remainingNodes.slice(0, predIndex + 1),
    mergedEmpty,
    ...remainingNodes.slice(predIndex + 1),
  ]

  const recalculated = newNodes.map((n, i) => ({
    ...n,
    position: { x: i * 250, y: 0 },
  }))

  const removedEdgeSourceTargets = new Set([leftEmptyId, nodeId, rightEmptyId])
  const remainingEdges = edges.filter(
    e => !removedEdgeSourceTargets.has(e.source) && !removedEdgeSourceTargets.has(e.target)
  )

  const newEdges: Edge[] = [
    ...remainingEdges,
    {
      id: crypto.randomUUID(),
      source: predecessorId,
      target: mergedEmpty.id,
      type: 'straight',
    },
    {
      id: crypto.randomUUID(),
      source: mergedEmpty.id,
      target: successorId,
      type: 'straight',
    },
  ]

  return { nodes: recalculated, edges: newEdges }
}
