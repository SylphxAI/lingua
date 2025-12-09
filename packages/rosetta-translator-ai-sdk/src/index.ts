/**
 * AI SDK translator for @sylphx/rosetta-admin
 *
 * Uses Vercel AI SDK's generateObject for structured translation output.
 * Works with any AI SDK provider (OpenRouter, Anthropic, OpenAI, Google, etc.)
 *
 * @example
 * ```ts
 * import { createAiSdkTranslator } from '@sylphx/rosetta-translator-ai-sdk';
 * import { createOpenRouter } from '@openrouter/ai-sdk-provider';
 *
 * const openrouter = createOpenRouter({
 *   apiKey: process.env.OPENROUTER_API_KEY!,
 * });
 *
 * const translator = createAiSdkTranslator({
 *   model: openrouter(process.env.LLM_MODEL!),
 * });
 * ```
 */

import { generateObject } from 'ai';
import { z } from 'zod';

// Types (inline to avoid dependency on rosetta-admin)
export interface BatchTranslationItem {
	sourceHash: string;
	sourceText: string;
	context?: string | null;
}

export type TranslateFunction = (
	items: BatchTranslationItem[],
	targetLocale: string
) => Promise<Array<{ sourceHash: string; translatedText: string }>>;

type LanguageModel = Parameters<typeof generateObject>[0]['model'];

export interface AiSdkTranslatorConfig {
	/** AI SDK model instance */
	model: LanguageModel;
	/** Max items per batch (default: 30) */
	batchSize?: number;
	/** Custom system prompt (optional) */
	systemPrompt?: (locale: string, localeName: string) => string;
}

const DEFAULT_BATCH_SIZE = 30;

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
};

function getLocaleName(code: string): string {
	const baseCode = code.split('-')[0];
	return LOCALE_NAMES[code] || (baseCode ? LOCALE_NAMES[baseCode] : undefined) || code;
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
 * Create an AI SDK-based translator
 */
export function createAiSdkTranslator(config: AiSdkTranslatorConfig): TranslateFunction {
	const { model, batchSize = DEFAULT_BATCH_SIZE, systemPrompt = defaultSystemPrompt } = config;

	const BatchTranslationSchema = z.object({
		translations: z.array(
			z.object({
				sourceHash: z.string().describe('The original source hash'),
				translatedText: z.string().describe('The translated text'),
			})
		),
	});

	return async (items: BatchTranslationItem[], targetLocale: string) => {
		if (items.length === 0) {
			return [];
		}

		const localeName = getLocaleName(targetLocale);
		const results: Array<{ sourceHash: string; translatedText: string }> = [];

		for (let i = 0; i < items.length; i += batchSize) {
			const batch = items.slice(i, i + batchSize);

			const itemsJson = batch.map((item) => ({
				sourceHash: item.sourceHash,
				sourceText: item.sourceText,
				...(item.context && { context: item.context }),
			}));

			const result = await generateObject({
				model,
				schema: BatchTranslationSchema,
				mode: 'json',
				system: systemPrompt(targetLocale, localeName),
				prompt: `Translate these UI strings to ${localeName}:\n\n${JSON.stringify(itemsJson, null, 2)}`,
				temperature: 0.3,
			});

			if (result.object.translations && Array.isArray(result.object.translations)) {
				results.push(...result.object.translations);
			}
		}

		return results;
	};
}
