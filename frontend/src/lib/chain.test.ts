import { describe, it, expect } from 'vitest'
import type { ReactFlowJsonObject } from '@xyflow/react'
import { buildInitialChain, isOldFormatFlow, shouldResetFlow, sanitizeLoadedNodes } from './chain'

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

describe('shouldResetFlow', () => {
  it('returns true for null', () => {
    expect(shouldResetFlow(null)).toBe(true)
  })

  it('returns true for undefined', () => {
    expect(shouldResetFlow(undefined)).toBe(true)
  })

  it('returns true when nodes array is empty', () => {
    const data: ReactFlowJsonObject = { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } }
    expect(shouldResetFlow(data)).toBe(true)
  })

  it('returns true when nodes have no startAnchor type', () => {
    const data: ReactFlowJsonObject = {
      nodes: [{ id: '1', type: 'messageNode', position: { x: 0, y: 0 }, data: {} }],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
    }
    expect(shouldResetFlow(data)).toBe(true)
  })

  it('returns false when nodes include a startAnchor node', () => {
    const data: ReactFlowJsonObject = {
      nodes: [{ id: '1', type: 'startAnchor', position: { x: 0, y: 0 }, data: {} }],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
    }
    expect(shouldResetFlow(data)).toBe(false)
  })
})

describe('sanitizeLoadedNodes', () => {
  it('sets draggable:false and deletable:false on a startAnchor node missing those flags', () => {
    const nodes = [{ id: '1', type: 'startAnchor', position: { x: 0, y: 0 }, data: {} }]
    const result = sanitizeLoadedNodes(nodes)
    expect(result[0].draggable).toBe(false)
    expect(result[0].deletable).toBe(false)
  })

  it('sets draggable:false and deletable:false on an endAnchor node missing those flags', () => {
    const nodes = [{ id: '2', type: 'endAnchor', position: { x: 0, y: 0 }, data: {} }]
    const result = sanitizeLoadedNodes(nodes)
    expect(result[0].draggable).toBe(false)
    expect(result[0].deletable).toBe(false)
  })

  it('sets draggable:false and deletable:false on an emptySlot node missing those flags', () => {
    const nodes = [{ id: '3', type: 'emptySlot', position: { x: 0, y: 0 }, data: {} }]
    const result = sanitizeLoadedNodes(nodes)
    expect(result[0].draggable).toBe(false)
    expect(result[0].deletable).toBe(false)
  })

  it('sets draggable:false and deletable:false on a messageNode for chain integrity', () => {
    const nodes = [{ id: '4', type: 'messageNode', position: { x: 0, y: 0 }, data: {} }]
    const result = sanitizeLoadedNodes(nodes)
    expect(result[0].draggable).toBe(false)
    expect(result[0].deletable).toBe(false)
  })

  it('does not mutate the original array', () => {
    const nodes = [{ id: '1', type: 'startAnchor', position: { x: 0, y: 0 }, data: {} }]
    const original = nodes[0]
    const result = sanitizeLoadedNodes(nodes)
    expect(result).not.toBe(nodes)
    expect(result[0]).not.toBe(original)
  })
})

describe('Round-trip contract', () => {
  it('nodes from buildInitialChain survive JSON round-trip with type and position intact', () => {
    const { nodes } = buildInitialChain()
    const serialized = JSON.parse(JSON.stringify(nodes))
    for (let i = 0; i < nodes.length; i++) {
      expect(serialized[i].type).toBe(nodes[i].type)
      expect(serialized[i].position).toEqual(nodes[i].position)
    }
  })

  it('edges from buildInitialChain survive JSON round-trip with source/target intact', () => {
    const { edges } = buildInitialChain()
    const serialized = JSON.parse(JSON.stringify(edges))
    for (let i = 0; i < edges.length; i++) {
      expect(serialized[i].source).toBe(edges[i].source)
      expect(serialized[i].target).toBe(edges[i].target)
    }
  })
})
