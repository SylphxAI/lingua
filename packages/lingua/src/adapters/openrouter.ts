import { getLocaleNativeName } from '../locales'
import type { TranslateAdapter } from '../types'

export interface OpenRouterAdapterOptions {
	/** OpenRouter API key */
	apiKey: string
	/** Model to use (default: openai/gpt-4.1-mini) */
	model?: string
	/** Temperature for generation (default: 0.3) */
	temperature?: number
	/** Max tokens for response (default: 500) */
	maxTokens?: number
}

/**
 * OpenRouter translation adapter
 * Uses OpenRouter API to translate text using LLMs
 *
 * @example
 * const translator = new OpenRouterAdapter({
 *   apiKey: process.env.OPENROUTER_API_KEY!,
 *   model: 'openai/gpt-4.1-mini',
 * });
 */
export class OpenRouterAdapter implements TranslateAdapter {
	private apiKey: string
	private model: string
	private temperature: number
	private maxTokens: number

	constructor(options: OpenRouterAdapterOptions) {
		this.apiKey = options.apiKey
		this.model = options.model ?? 'openai/gpt-4.1-mini'
		this.temperature = options.temperature ?? 0.3
		this.maxTokens = options.maxTokens ?? 500
	}

	async translate(
		text: string,
		options: { from: string; to: string; context?: string },
	): Promise<string> {
		const fromLanguage = getLocaleNativeName(options.from)
		const toLanguage = getLocaleNativeName(options.to)

		const prompt = `Translate the following UI text from ${fromLanguage} to ${toLanguage}.

IMPORTANT RULES:
1. Keep the translation natural and appropriate for a software UI
2. Maintain the same tone and formality level
3. Keep any technical terms, brand names, or placeholders (like {name}) unchanged
4. Do not add or remove any meaning
5. Only return the translated text, nothing else

${options.context ? `Context: This text is used in ${options.context}` : ''}

Text to translate:
${text}

Translation:`

		const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${this.apiKey}`,
			},
			body: JSON.stringify({
				model: this.model,
				messages: [{ role: 'user', content: prompt }],
				max_tokens: this.maxTokens,
				temperature: this.temperature,
			}),
		})

		if (!response.ok) {
			const error = await response.text()
			throw new Error(`OpenRouter API error: ${error}`)
		}

		const data = (await response.json()) as {
			choices?: Array<{ message?: { content?: string } }>
		}
		const translation = data.choices?.[0]?.message?.content?.trim()

		if (!translation) {
			throw new Error('Empty translation response')
		}

		return translation
	}

	async translateBatch(
		texts: Array<{ text: string; context?: string }>,
		options: { from: string; to: string },
	): Promise<string[]> {
		// Translate sequentially for now
		// Could be optimized with parallel requests or batch API
		const results: string[] = []

		for (const item of texts) {
			const translation = await this.translate(item.text, {
				...options,
				context: item.context,
			})
			results.push(translation)
		}

		return results
	}
}
