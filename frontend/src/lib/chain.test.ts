import { describe, it, expect } from 'vitest'
import { buildInitialChain, isOldFormatFlow, applyGrowthRule } from './chain'

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

describe('applyGrowthRule', () => {
  // Helper: get the single emptySlot from initial chain
  function getInitialSlotId(): string {
    const { nodes } = buildInitialChain()
    const slot = nodes.find(n => n.type === 'emptySlot')!
    return slot.id
  }

  it('test 1: returns 5 nodes total after growing initial [Empty]', () => {
    const { nodes, edges } = buildInitialChain()
    const slotId = getInitialSlotId()
    const result = applyGrowthRule(nodes, edges, slotId, 'messageNode')
    expect(result.nodes).toHaveLength(5)
  })

  it('test 2: the 5 nodes are in order: startAnchor, emptySlot, messageNode, emptySlot, endAnchor', () => {
    const { nodes, edges } = buildInitialChain()
    const slotId = getInitialSlotId()
    const result = applyGrowthRule(nodes, edges, slotId, 'messageNode')
    expect(result.nodes[0].type).toBe('startAnchor')
    expect(result.nodes[1].type).toBe('emptySlot')
    expect(result.nodes[2].type).toBe('messageNode')
    expect(result.nodes[3].type).toBe('emptySlot')
    expect(result.nodes[4].type).toBe('endAnchor')
  })

  it('test 3: the new messageNode has the correct nodeType in its type field', () => {
    const { nodes, edges } = buildInitialChain()
    const slotId = getInitialSlotId()
    const result = applyGrowthRule(nodes, edges, slotId, 'messageNode')
    const msgNode = result.nodes.find(n => n.type === 'messageNode')!
    expect(msgNode.type).toBe('messageNode')
  })

  it('test 4: returns 4 edges after growth', () => {
    const { nodes, edges } = buildInitialChain()
    const slotId = getInitialSlotId()
    const result = applyGrowthRule(nodes, edges, slotId, 'messageNode')
    expect(result.edges).toHaveLength(4)
  })

  it('test 5: edges correctly connect the chain in order', () => {
    const { nodes, edges } = buildInitialChain()
    const slotId = getInitialSlotId()
    const result = applyGrowthRule(nodes, edges, slotId, 'messageNode')
    const [start, emptyBefore, msgNode, emptyAfter, end] = result.nodes
    // Start -> EmptyBefore
    expect(result.edges[0].source).toBe(start.id)
    expect(result.edges[0].target).toBe(emptyBefore.id)
    // EmptyBefore -> MessageNode
    expect(result.edges[1].source).toBe(emptyBefore.id)
    expect(result.edges[1].target).toBe(msgNode.id)
    // MessageNode -> EmptyAfter
    expect(result.edges[2].source).toBe(msgNode.id)
    expect(result.edges[2].target).toBe(emptyAfter.id)
    // EmptyAfter -> End
    expect(result.edges[3].source).toBe(emptyAfter.id)
    expect(result.edges[3].target).toBe(end.id)
  })

  it('test 6: all returned nodes have draggable: false', () => {
    const { nodes, edges } = buildInitialChain()
    const slotId = getInitialSlotId()
    const result = applyGrowthRule(nodes, edges, slotId, 'messageNode')
    for (const node of result.nodes) {
      expect(node.draggable).toBe(false)
    }
  })

  it('test 7: all returned nodes have deletable: false', () => {
    const { nodes, edges } = buildInitialChain()
    const slotId = getInitialSlotId()
    const result = applyGrowthRule(nodes, edges, slotId, 'messageNode')
    for (const node of result.nodes) {
      expect(node.deletable).toBe(false)
    }
  })

  it('test 8: all node x-positions are strictly increasing spaced 250px apart', () => {
    const { nodes, edges } = buildInitialChain()
    const slotId = getInitialSlotId()
    const result = applyGrowthRule(nodes, edges, slotId, 'messageNode')
    for (let i = 0; i < result.nodes.length; i++) {
      expect(result.nodes[i].position.x).toBe(i * 250)
    }
  })

  it('test 9: calling applyGrowthRule on a second emptySlot produces 7 nodes total', () => {
    const { nodes, edges } = buildInitialChain()
    const slotId = getInitialSlotId()
    const step1 = applyGrowthRule(nodes, edges, slotId, 'messageNode')
    // Find the second emptySlot (index 3 in the 5-node chain)
    const secondSlot = step1.nodes[3]
    expect(secondSlot.type).toBe('emptySlot')
    const step2 = applyGrowthRule(step1.nodes, step1.edges, secondSlot.id, 'messageNode')
    expect(step2.nodes).toHaveLength(7)
  })

  it('test 10: applyGrowthRule throws when given an invalid slotId', () => {
    const { nodes, edges } = buildInitialChain()
    expect(() => applyGrowthRule(nodes, edges, 'nonexistent-id', 'messageNode')).toThrow()
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
