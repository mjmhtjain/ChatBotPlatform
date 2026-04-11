/**
 * Decodes a JWT (without verifying signature) and derives 1-2 uppercase
 * initials from the email claim in the payload.
 * Returns '?' if decoding fails or the email claim is absent.
 */
export function getInitials(token: string): string {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const email: string = payload.email
    if (!email) return '?'
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
