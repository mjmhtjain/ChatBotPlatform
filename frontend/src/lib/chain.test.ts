import { describe, it, expect } from 'vitest'
import { buildInitialChain, isOldFormatFlow } from './chain'

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
