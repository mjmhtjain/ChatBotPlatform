import { describe, it, expect } from 'vitest'
import { getInitials, getEmail } from './auth'

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

  it('returns two letters from a long single-segment local part', () => {
    const token = makeToken({ email: 'nathan@example.com' })
    expect(getInitials(token)).toBe('NA')
  })

  it('derives initials from sub claim when email claim is absent', () => {
    const token = makeToken({ sub: 'user@example.com' })
    expect(getInitials(token)).toBe('U')
  })
})

describe('getEmail', () => {
  it('returns the email claim when present', () => {
    const token = makeToken({ email: 'john.doe@example.com' })
    expect(getEmail(token)).toBe('john.doe@example.com')
  })

  it('falls back to sub claim when email is absent', () => {
    const token = makeToken({ sub: 'user@example.com' })
    expect(getEmail(token)).toBe('user@example.com')
  })

  it('returns null when sub is not an email', () => {
    const token = makeToken({ sub: 'user-123' })
    expect(getEmail(token)).toBeNull()
  })

  it('returns null for a malformed token', () => {
    expect(getEmail('not.a.jwt')).toBeNull()
  })

  it('returns null for an empty string', () => {
    expect(getEmail('')).toBeNull()
  })
})
