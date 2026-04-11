/**
 * Decodes a JWT (without verifying signature) and derives 1-2 uppercase
 * initials from an email address found in the payload.
 * Checks `email` claim first, then falls back to `sub` (which may contain an email).
 * Returns '?' if decoding fails or no usable email claim is found.
 *
 * Initials derivation rules:
 * - Multi-segment local parts (john.doe, john-doe): first letter of each segment, up to 2
 * - Single-segment, ≤5 chars (alice): first letter only
 * - Single-segment, >5 chars (mjmhtjain): first two letters
 */
export function getInitials(token: string): string {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const email: string | undefined = payload.email ?? payload.sub
    if (!email || !email.includes('@')) return '?'
    const local = email.split('@')[0]
    const parts = local.split(/[^a-zA-Z]+/).filter(Boolean)

    // If we have multiple parts, take the first letter of each (up to 2)
    if (parts.length > 1) {
      return parts
        .slice(0, 2)
        .map(p => p[0].toUpperCase())
        .join('')
    }

    // If we have one part:
    // - For short names (≤5 chars), take only the first letter
    // - For longer names/identifiers, take the first 2 letters
    if (parts.length === 1) {
      const part = parts[0]
      if (part.length <= 5) {
        return part[0].toUpperCase()
      }
      return part.slice(0, 2).toUpperCase()
    }

    return '?'
  } catch {
    return '?'
  }
}
