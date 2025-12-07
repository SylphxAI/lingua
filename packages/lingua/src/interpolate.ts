/**
 * Replace {key} placeholders with values
 *
 * @param text - Text with placeholders
 * @param params - Key-value pairs to interpolate
 * @returns Text with placeholders replaced
 *
 * @example
 * interpolate("Hello {name}", { name: "World" }) // "Hello World"
 * interpolate("You have {count} items", { count: 5 }) // "You have 5 items"
 */
export function interpolate(text: string, params?: Record<string, string | number>): string {
	if (!params) return text

	let result = text
	for (const [key, value] of Object.entries(params)) {
		result = result.replaceAll(`{${key}}`, String(value))
	}
	return result
}
