import { describe, it, expect } from 'vitest'
import type { Node, Edge } from '@xyflow/react'
import { buildInitialChain, isOldFormatFlow, applyCollapseRule } from './chain'

describe('buildInitialChain', () => {
  it('returns exactly 3 nodes', () => {
    const { nodes } = buildInitialChain()
    expect(nodes).toHaveLength(3)
  })

  it('returns nodes of types startAnchor, emptySlot, endAnchor in order', () => {
    const { nodes } = buildInitialChain()
    expect(nodes[0].type).toBe('startAnchor')
    expect(nodes[1].type).toBe('emptySlot')
    expect(nodes[2].type).toBe('endAnchor')
  })

  it('each node has draggable: false and deletable: false', () => {
    const { nodes } = buildInitialChain()
    for (const node of nodes) {
      expect(node.draggable).toBe(false)
      expect(node.deletable).toBe(false)
    }
  })

  it('node x-positions are strictly increasing left-to-right', () => {
    const { nodes } = buildInitialChain()
    const [start, empty, end] = nodes
    expect(start.position.x).toBeLessThan(empty.position.x)
    expect(empty.position.x).toBeLessThan(end.position.x)
  })

  it('returns exactly 2 edges', () => {
    const { edges } = buildInitialChain()
    expect(edges).toHaveLength(2)
  })

  it('edges connect startAnchor->emptySlot and emptySlot->endAnchor', () => {
    const { nodes, edges } = buildInitialChain()
    const [start, empty, end] = nodes
    expect(edges[0].source).toBe(start.id)
    expect(edges[0].target).toBe(empty.id)
    expect(edges[1].source).toBe(empty.id)
    expect(edges[1].target).toBe(end.id)
  })

  it('edges have type smoothstep and animated false', () => {
    const { edges } = buildInitialChain()
    for (const edge of edges) {
      expect(edge.type).toBe('smoothstep')
      expect(edge.animated).toBe(false)
    }
  })
})

function singleNodeChain(): { nodes: Node[], edges: Edge[] } {
  const start: Node = { id: 'start', type: 'startAnchor', position: { x: 0, y: 0 }, data: {}, draggable: false, deletable: false }
  const emptyBefore: Node = { id: 'empty-before', type: 'emptySlot', position: { x: 250, y: 0 }, data: {}, draggable: false, deletable: false }
  const msg: Node = { id: 'msg-1', type: 'messageNode', position: { x: 500, y: 0 }, data: { message: 'Hello' }, draggable: false, deletable: false }
  const emptyAfter: Node = { id: 'empty-after', type: 'emptySlot', position: { x: 750, y: 0 }, data: {}, draggable: false, deletable: false }
  const end: Node = { id: 'end', type: 'endAnchor', position: { x: 1000, y: 0 }, data: {}, draggable: false, deletable: false }
  const edges: Edge[] = [
    { id: 'e1', source: 'start', target: 'empty-before', type: 'smoothstep' },
    { id: 'e2', source: 'empty-before', target: 'msg-1', type: 'smoothstep' },
    { id: 'e3', source: 'msg-1', target: 'empty-after', type: 'smoothstep' },
    { id: 'e4', source: 'empty-after', target: 'end', type: 'smoothstep' },
  ]
  return { nodes: [start, emptyBefore, msg, emptyAfter, end], edges }
}

function twoNodeChain(): { nodes: Node[], edges: Edge[] } {
  const start: Node = { id: 'start', type: 'startAnchor', position: { x: 0, y: 0 }, data: {}, draggable: false, deletable: false }
  const e1: Node = { id: 'empty-1', type: 'emptySlot', position: { x: 250, y: 0 }, data: {}, draggable: false, deletable: false }
  const msg1: Node = { id: 'msg-1', type: 'messageNode', position: { x: 500, y: 0 }, data: { message: 'Hello' }, draggable: false, deletable: false }
  const e2: Node = { id: 'empty-2', type: 'emptySlot', position: { x: 750, y: 0 }, data: {}, draggable: false, deletable: false }
  const msg2: Node = { id: 'msg-2', type: 'messageNode', position: { x: 1000, y: 0 }, data: { message: 'World' }, draggable: false, deletable: false }
  const e3: Node = { id: 'empty-3', type: 'emptySlot', position: { x: 1250, y: 0 }, data: {}, draggable: false, deletable: false }
  const end: Node = { id: 'end', type: 'endAnchor', position: { x: 1500, y: 0 }, data: {}, draggable: false, deletable: false }
  const edges: Edge[] = [
    { id: 'e1', source: 'start', target: 'empty-1', type: 'smoothstep' },
    { id: 'e2', source: 'empty-1', target: 'msg-1', type: 'smoothstep' },
    { id: 'e3', source: 'msg-1', target: 'empty-2', type: 'smoothstep' },
    { id: 'e4', source: 'empty-2', target: 'msg-2', type: 'smoothstep' },
    { id: 'e5', source: 'msg-2', target: 'empty-3', type: 'smoothstep' },
    { id: 'e6', source: 'empty-3', target: 'end', type: 'smoothstep' },
  ]
  return { nodes: [start, e1, msg1, e2, msg2, e3, end], edges }
}

describe('applyCollapseRule', () => {
  it('returns 3 nodes when collapsing the only message node', () => {
    const { nodes, edges } = singleNodeChain()
    const result = applyCollapseRule(nodes, edges, 'msg-1')
    expect(result.nodes).toHaveLength(3)
  })

  it('returned nodes are types startAnchor, emptySlot, endAnchor in that order', () => {
    const { nodes, edges } = singleNodeChain()
    const result = applyCollapseRule(nodes, edges, 'msg-1')
    expect(result.nodes[0].type).toBe('startAnchor')
    expect(result.nodes[1].type).toBe('emptySlot')
    expect(result.nodes[2].type).toBe('endAnchor')
  })

  it('returns 2 edges after collapsing the only message node', () => {
    const { nodes, edges } = singleNodeChain()
    const result = applyCollapseRule(nodes, edges, 'msg-1')
    expect(result.edges).toHaveLength(2)
  })

  it('edges connect startAnchor -> mergedEmpty -> endAnchor', () => {
    const { nodes, edges } = singleNodeChain()
    const result = applyCollapseRule(nodes, edges, 'msg-1')
    const [start, mergedEmpty, end] = result.nodes
    expect(result.edges[0].source).toBe(start.id)
    expect(result.edges[0].target).toBe(mergedEmpty.id)
    expect(result.edges[1].source).toBe(mergedEmpty.id)
    expect(result.edges[1].target).toBe(end.id)
  })

  it('merged emptySlot has draggable: false', () => {
    const { nodes, edges } = singleNodeChain()
    const result = applyCollapseRule(nodes, edges, 'msg-1')
    const mergedEmpty = result.nodes[1]
    expect(mergedEmpty.draggable).toBe(false)
  })

  it('merged emptySlot has deletable: false', () => {
    const { nodes, edges } = singleNodeChain()
    const result = applyCollapseRule(nodes, edges, 'msg-1')
    const mergedEmpty = result.nodes[1]
    expect(mergedEmpty.deletable).toBe(false)
  })

  it('all node x-positions are strictly increasing (250px apart)', () => {
    const { nodes, edges } = singleNodeChain()
    const result = applyCollapseRule(nodes, edges, 'msg-1')
    for (let i = 1; i < result.nodes.length; i++) {
      expect(result.nodes[i].position.x).toBe(result.nodes[i - 1].position.x + 250)
    }
  })

  it('returns unchanged chain when given a non-existent nodeId', () => {
    const { nodes, edges } = singleNodeChain()
    const result = applyCollapseRule(nodes, edges, 'does-not-exist')
    expect(result.nodes).toHaveLength(nodes.length)
    expect(result.edges).toHaveLength(edges.length)
  })

  it('two-node chain: collapsing Node1 yields 5 nodes', () => {
    const { nodes, edges } = twoNodeChain()
    const result = applyCollapseRule(nodes, edges, 'msg-1')
    expect(result.nodes).toHaveLength(5)
  })

  it('two-node chain: edges after collapse form a valid linear chain through remaining node', () => {
    const { nodes, edges } = twoNodeChain()
    const result = applyCollapseRule(nodes, edges, 'msg-1')
    // Expect: start -> emptyMerged -> msg-2 -> emptySlot -> end
    expect(result.edges).toHaveLength(4)
    const nodeIds = result.nodes.map(n => n.id)
    // verify each edge connects consecutive nodes
    for (const edge of result.edges) {
      expect(nodeIds).toContain(edge.source)
      expect(nodeIds).toContain(edge.target)
    }
    // verify linear chain: each node except last is source of exactly one edge targeting the next
    for (let i = 0; i < result.nodes.length - 1; i++) {
      const from = result.nodes[i].id
      const to = result.nodes[i + 1].id
      expect(result.edges.some(e => e.source === from && e.target === to)).toBe(true)
    }
  })
})

describe('isOldFormatFlow', () => {
  it('returns true for empty nodes array', () => {
    expect(isOldFormatFlow([])).toBe(true)
  })

  it('returns true when nodes contain no startAnchor type', () => {
    const nodes = [{ id: '1', type: 'messageNode', position: { x: 0, y: 0 }, data: {} }]
    expect(isOldFormatFlow(nodes)).toBe(true)
  })

  it('returns false when nodes contain a startAnchor node', () => {
    const nodes = [{ id: '1', type: 'startAnchor', position: { x: 0, y: 0 }, data: {} }]
    expect(isOldFormatFlow(nodes)).toBe(false)
  })
})
