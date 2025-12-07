/**
 * DJB2 hash with 33 multiplier (DJB33X)
 * Fast, simple, good distribution for string keys
 */
function djb33x(str: string): number {
	let hash = 5381
	for (let i = 0; i < str.length; i++) {
		hash = (hash * 33) ^ str.charCodeAt(i)
	}
	return hash >>> 0 // Convert to unsigned 32-bit
}

/**
 * Generate a hash for source text
 * Optionally includes context for disambiguation
 *
 * @param text - The source text to hash
 * @param context - Optional context (e.g., "button", "menu")
 * @returns 8-character hex string
 *
 * @example
 * hashText("Submit") // "a1b2c3d4"
 * hashText("Submit", "form") // "e5f6g7h8" (different hash)
 */
export function hashText(text: string, context?: string): string {
	const input = context ? `${context}::${text.trim()}` : text.trim()
	return djb33x(input).toString(16).padStart(8, '0')
}
