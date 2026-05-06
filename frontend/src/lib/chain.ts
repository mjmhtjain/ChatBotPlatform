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

export function shouldResetFlow(flowData: ReactFlowJsonObject | null | undefined): boolean {
  if (!flowData) return true
  return isOldFormatFlow(flowData.nodes ?? [])
}

export function sanitizeLoadedNodes(nodes: Node[]): Node[] {
  return nodes.map(node => {
    if (STRUCTURAL_NODE_TYPES.has(node.type ?? '')) {
      return { ...node, draggable: false, deletable: false }
    }
    return node
  })
}
