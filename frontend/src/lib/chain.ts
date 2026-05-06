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
