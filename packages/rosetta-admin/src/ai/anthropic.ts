/**
 * Anthropic Claude AI translator
 *
 * Uses @anthropic-ai/sdk for structured JSON output.
 *
 * @example
 * ```ts
 * import { createAnthropicTranslator } from '@sylphx/rosetta-admin/ai';
 *
 * const translator = createAnthropicTranslator({
 *   apiKey: process.env.ANTHROPIC_API_KEY!,
 *   model: process.env.ANTHROPIC_MODEL!, // User chooses model
 * });
 * ```
 */

import type { BatchTranslationItem, TranslateFunction } from '../core/types';

export interface AnthropicTranslatorConfig {
	/** Anthropic API key */
	apiKey: string;
	/** Model to use (e.g., 'claude-sonnet-4-20250514', 'claude-3-5-haiku-20241022') */
	model: string;
	/** Max items per batch (default: 30) */
	batchSize?: number;
	/** Custom system prompt (optional) */
	systemPrompt?: (locale: string, localeName: string) => string;
}

const DEFAULT_BATCH_SIZE = 30;

/**
 * Locale code to display name mapping (common languages)
 */
const LOCALE_NAMES: Record<string, string> = {
	en: 'English',
	'zh-TW': 'Traditional Chinese',
	'zh-CN': 'Simplified Chinese',
	zh: 'Chinese',
	ja: 'Japanese',
	ko: 'Korean',
	es: 'Spanish',
	fr: 'French',
	de: 'German',
	it: 'Italian',
	pt: 'Portuguese',
	'pt-BR': 'Brazilian Portuguese',
	ru: 'Russian',
	ar: 'Arabic',
	hi: 'Hindi',
	th: 'Thai',
	vi: 'Vietnamese',
	id: 'Indonesian',
	ms: 'Malay',
	nl: 'Dutch',
	pl: 'Polish',
	tr: 'Turkish',
	uk: 'Ukrainian',
	cs: 'Czech',
	el: 'Greek',
	he: 'Hebrew',
	sv: 'Swedish',
	da: 'Danish',
	fi: 'Finnish',
	no: 'Norwegian',
	hu: 'Hungarian',
	ro: 'Romanian',
};

function getLocaleName(code: string): string {
	return LOCALE_NAMES[code] || LOCALE_NAMES[code.split('-')[0]] || code;
}

function defaultSystemPrompt(locale: string, localeName: string): string {
	return `You are a professional translator. You translate UI strings to ${localeName} (${locale}).

RULES:
- Translate to natural, native-sounding ${localeName}
- Keep the same tone and formality level
- Preserve any placeholders like {name}, {{count}}, %s, %d exactly as-is
- For technical terms, use standard local terminology
- Use context (if provided) to disambiguate meaning`;
}

/**
 * JSON Schema for batch translation response
 */
const translationSchema = {
	name: 'batch_translation',
	description: 'Batch translation result',
	input_schema: {
		type: 'object',
		properties: {
			translations: {
				type: 'array',
				description: 'Array of translated strings',
				items: {
					type: 'object',
					properties: {
						sourceHash: {
							type: 'string',
							description: 'The original source hash',
						},
						translatedText: {
							type: 'string',
							description: 'The translated text',
						},
					},
					required: ['sourceHash', 'translatedText'],
				},
			},
		},
		required: ['translations'],
	},
} as const;

interface TranslationResponse {
	translations: Array<{ sourceHash: string; translatedText: string }>;
}

/**
 * Create an Anthropic Claude translator
 *
 * Requires `@anthropic-ai/sdk` as a peer dependency.
 */
export function createAnthropicTranslator(config: AnthropicTranslatorConfig): TranslateFunction {
	const { apiKey, model, batchSize = DEFAULT_BATCH_SIZE, systemPrompt = defaultSystemPrompt } = config;

	return async (items: BatchTranslationItem[], targetLocale: string) => {
		if (items.length === 0) {
			return [];
		}

		// Dynamic import to avoid requiring @anthropic-ai/sdk as a hard dependency
		const { default: Anthropic } = await import('@anthropic-ai/sdk');

		const anthropic = new Anthropic({ apiKey });
		const localeName = getLocaleName(targetLocale);
		const results: Array<{ sourceHash: string; translatedText: string }> = [];

		// Process in batches
		for (let i = 0; i < items.length; i += batchSize) {
			const batch = items.slice(i, i + batchSize);

			const itemsJson = batch.map((item) => ({
				sourceHash: item.sourceHash,
				sourceText: item.sourceText,
				...(item.context && { context: item.context }),
			}));

			const response = await anthropic.messages.create({
				model,
				max_tokens: 4096,
				system: systemPrompt(targetLocale, localeName),
				tools: [translationSchema],
				tool_choice: { type: 'tool', name: 'batch_translation' },
				messages: [
					{
						role: 'user',
						content: `Translate these UI strings to ${localeName}:\n\n${JSON.stringify(itemsJson, null, 2)}`,
					},
				],
			});

			// Extract tool use result
			const toolUse = response.content.find((c) => c.type === 'tool_use');
			if (!toolUse || toolUse.type !== 'tool_use') {
				throw new Error('No tool use in Anthropic response');
			}

			const parsed = toolUse.input as TranslationResponse;

			if (parsed.translations && Array.isArray(parsed.translations)) {
				results.push(...parsed.translations);
			}
		}

		return results;
	};
}
