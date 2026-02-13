/**
 * Validates post content before submission
 */
export function validatePostContent(
  text: string,
  hasMedia: boolean
): { valid: boolean; error?: string } {
  // Text must be at least 1 character
  if (text.trim().length === 0 && !hasMedia) {
    return { valid: false, error: 'Post must contain text or media' }
  }

  // Max 500 characters
  if (text.length > 500) {
    return { valid: false, error: 'Post content must be 500 characters or less' }
  }

  return { valid: true }
}
