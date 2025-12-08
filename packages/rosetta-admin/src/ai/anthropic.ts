/**
 * Anthropic Claude AI translator (direct API)
 *
 * @example
 * ```ts
 * import { createAnthropicTranslator } from '@sylphx/rosetta-admin/ai';
 *
 * const translator = createAnthropicTranslator({
 *   apiKey: process.env.ANTHROPIC_API_KEY!,
 *   model: 'claude-sonnet-4-20250514',
 * });
 *
 * export const adminRouter = createAdminRouter({
 *   storage,
 *   translator,
 * });
 * ```
 */

import type { BatchTranslationItem, TranslateFunction } from '../core/types';

export interface AnthropicTranslatorConfig {
	/** Anthropic API key */
	apiKey: string;
	/** Model to use (default: claude-sonnet-4-20250514) */
	model?: string;
	/** Max items per batch (default: 50) */
	batchSize?: number;
	/** Custom system prompt (optional) */
	systemPrompt?: (locale: string, localeName: string) => string;
}

interface AnthropicResponse {
	content: Array<{
		type: 'text';
		text: string;
	}>;
}

const DEFAULT_MODEL = 'claude-sonnet-4-20250514';
const DEFAULT_BATCH_SIZE = 50;

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
	sk: 'Slovak',
	bg: 'Bulgarian',
	hr: 'Croatian',
	sl: 'Slovenian',
	et: 'Estonian',
	lv: 'Latvian',
	lt: 'Lithuanian',
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
- Use context (if provided) to disambiguate meaning
- Return ONLY valid JSON`;
}

/**
 * Create an Anthropic Claude translator
 */
export function createAnthropicTranslator(config: AnthropicTranslatorConfig): TranslateFunction {
	const {
		apiKey,
		model = DEFAULT_MODEL,
		batchSize = DEFAULT_BATCH_SIZE,
		systemPrompt = defaultSystemPrompt,
	} = config;

	return async (items: BatchTranslationItem[], targetLocale: string) => {
		if (items.length === 0) {
			return [];
		}

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

			const response = await fetch('https://api.anthropic.com/v1/messages', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-api-key': apiKey,
					'anthropic-version': '2023-06-01',
				},
				body: JSON.stringify({
					model,
					max_tokens: 4096,
					system: systemPrompt(targetLocale, localeName),
					messages: [
						{
							role: 'user',
							content: `Translate these UI strings to ${localeName}:

${JSON.stringify(itemsJson, null, 2)}

Return a JSON object with "translations" array containing objects with "sourceHash" and "translatedText" for each item.`,
						},
					],
				}),
			});

			if (!response.ok) {
				const error = await response.text();
				throw new Error(`Anthropic API error: ${response.status} - ${error}`);
			}

			const data = (await response.json()) as AnthropicResponse;
			const content = data.content.find((c) => c.type === 'text')?.text;

			if (!content) {
				throw new Error('No response content from Anthropic');
			}

			// Extract JSON from response (might be wrapped in markdown code blocks)
			const jsonMatch = content.match(/\{[\s\S]*\}/);
			if (!jsonMatch) {
				throw new Error('Could not parse JSON from Anthropic response');
			}

			const parsed = JSON.parse(jsonMatch[0]) as { translations: Array<{ sourceHash: string; translatedText: string }> };

			if (parsed.translations && Array.isArray(parsed.translations)) {
				results.push(...parsed.translations);
			}
		}

		return results;
	};
}
