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

  // Find predecessor and successor via edges
  const inEdge = edges.find(e => e.target === slotId)
  const outEdge = edges.find(e => e.source === slotId)

  const predecessorId = inEdge?.source
  const successorId = outEdge?.target

  // Generate new IDs
  const newEmptyBeforeId = `empty-${crypto.randomUUID()}`
  const newNodeId = `node-${crypto.randomUUID()}`
  const newEmptyAfterId = `empty-${crypto.randomUUID()}`

  const newEmptyBefore: Node = {
    id: newEmptyBeforeId,
    type: 'emptySlot',
    position: { x: 0, y: 0 }, // recalculated below
    data: {},
    draggable: false,
    deletable: false,
  }

  const newNode: Node = {
    id: newNodeId,
    type: nodeType,
    position: { x: 0, y: 0 }, // recalculated below
    data: nodeData ?? {},
    draggable: false,
    deletable: false,
  }

  const newEmptyAfter: Node = {
    id: newEmptyAfterId,
    type: 'emptySlot',
    position: { x: 0, y: 0 }, // recalculated below
    data: {},
    draggable: false,
    deletable: false,
  }

  // Replace the slot in the node list with the three new nodes
  const newNodesList: Node[] = []
  for (const n of nodes) {
    if (n.id === slotId) {
      newNodesList.push(newEmptyBefore, newNode, newEmptyAfter)
    } else {
      newNodesList.push({ ...n })
    }
  }

  // Recalculate all x positions: index * 250, y = 0
  const repositionedNodes = newNodesList.map((n, i) => ({
    ...n,
    position: { x: i * 250, y: 0 },
  }))

  // Remove the old edges connected to slotId, add new ones
  const remainingEdges = edges.filter(e => e.source !== slotId && e.target !== slotId)

  const newEdges: Edge[] = [
    ...remainingEdges,
  ]

  if (predecessorId) {
    newEdges.push({
      id: `edge-${predecessorId}-${newEmptyBeforeId}`,
      source: predecessorId,
      target: newEmptyBeforeId,
      type: 'smoothstep',
      animated: false,
    })
  }

  newEdges.push({
    id: `edge-${newEmptyBeforeId}-${newNodeId}`,
    source: newEmptyBeforeId,
    target: newNodeId,
    type: 'smoothstep',
    animated: false,
  })

  newEdges.push({
    id: `edge-${newNodeId}-${newEmptyAfterId}`,
    source: newNodeId,
    target: newEmptyAfterId,
    type: 'smoothstep',
    animated: false,
  })

  if (successorId) {
    newEdges.push({
      id: `edge-${newEmptyAfterId}-${successorId}`,
      source: newEmptyAfterId,
      target: successorId,
      type: 'smoothstep',
      animated: false,
    })
  }

  // Sort edges to match the linear chain order based on repositionedNodes order
  const nodeIndexMap = new Map(repositionedNodes.map((n, i) => [n.id, i]))
  newEdges.sort((a, b) => (nodeIndexMap.get(a.source) ?? 0) - (nodeIndexMap.get(b.source) ?? 0))

  return { nodes: repositionedNodes, edges: newEdges }
}
