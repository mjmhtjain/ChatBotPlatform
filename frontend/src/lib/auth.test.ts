import { describe, it, expect } from 'vitest'
import { getInitials } from './auth'

// Helper: build a minimal fake JWT with the given payload
function makeToken(payload: object): string {
  const encoded = btoa(JSON.stringify(payload))
  return `header.${encoded}.signature`
}

describe('getInitials', () => {
  it('returns two uppercase initials from a plain email local part', () => {
    const token = makeToken({ email: 'mjmhtjain@example.com' })
    expect(getInitials(token)).toBe('MJ')
  })

  it('returns one initial when the local part has one segment', () => {
    const token = makeToken({ email: 'alice@example.com' })
    expect(getInitials(token)).toBe('A')
  })

  it('returns two initials for a dotted local part', () => {
    const token = makeToken({ email: 'john.doe@example.com' })
    expect(getInitials(token)).toBe('JD')
  })

  it('returns ? for a malformed token', () => {
    expect(getInitials('not.a.jwt')).toBe('?')
  })

  it('returns ? when the email claim is missing', () => {
    const token = makeToken({ sub: 'user-123' })
    expect(getInitials(token)).toBe('?')
  })

  it('returns ? for an empty string', () => {
    expect(getInitials('')).toBe('?')
  })
})
