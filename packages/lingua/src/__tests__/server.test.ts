import { describe, expect, test, beforeEach, mock } from 'bun:test';
import { I18n } from '../server/i18n';
import {
	t,
	getLocale,
	flushCollectedStrings,
	runWithI18n,
	getTranslationsForClient,
} from '../server/context';
import type { StorageAdapter } from '../types';

// Mock storage adapter
function createMockStorage(): StorageAdapter {
	const sources = new Map<string, { text: string; hash: string; context?: string }>();
	const translations = new Map<string, Map<string, string>>();

	return {
		async getTranslations(locale: string) {
			return translations.get(locale) ?? new Map();
		},

		async registerSources(items) {
			for (const item of items) {
				sources.set(item.hash, item);
			}
		},

		async saveTranslation(locale, hash, text) {
			if (!translations.has(locale)) {
				translations.set(locale, new Map());
			}
			translations.get(locale)!.set(hash, text);
		},

		async getSources() {
			return Array.from(sources.values()).map((s) => ({
				text: s.text,
				hash: s.hash,
				context: s.context,
			}));
		},

		async getUntranslated(locale) {
			const localeTranslations = translations.get(locale) ?? new Map();
			return Array.from(sources.values())
				.filter((s) => !localeTranslations.has(s.hash))
				.map((s) => ({
					text: s.text,
					hash: s.hash,
					context: s.context,
				}));
		},
	};
}

describe('I18n class', () => {
	let storage: StorageAdapter;
	let i18n: I18n;

	beforeEach(() => {
		storage = createMockStorage();
		i18n = new I18n({
			storage,
			defaultLocale: 'en',
			enabledLocales: ['en', 'zh-TW'],
		});
	});

	test('init() sets up context correctly', async () => {
		let capturedLocale: string | undefined;

		await i18n.init(() => {
			capturedLocale = getLocale();
		});

		expect(capturedLocale).toBe('en');
	});

	test('init() uses locale detector', async () => {
		i18n.setLocaleDetector(() => 'zh-TW');

		let capturedLocale: string | undefined;
		await i18n.init(() => {
			capturedLocale = getLocale();
		});

		expect(capturedLocale).toBe('zh-TW');
	});

	test('getEnabledLocales() returns correct locales', () => {
		expect(i18n.getEnabledLocales()).toEqual(['en', 'zh-TW']);
	});

	test('getDefaultLocale() returns correct locale', () => {
		expect(i18n.getDefaultLocale()).toBe('en');
	});
});

describe('t() function', () => {
	test('returns source text when no context', () => {
		const result = t('Hello World');
		expect(result).toBe('Hello World');
	});

	test('interpolates parameters', () => {
		const result = t('Hello {name}', { name: 'World' });
		expect(result).toBe('Hello World');
	});

	test('returns source text for default locale', async () => {
		const storage = createMockStorage();
		const i18n = new I18n({ storage, defaultLocale: 'en' });

		let result: string | undefined;
		await i18n.init(() => {
			result = t('Hello World');
		});

		expect(result).toBe('Hello World');
	});

	test('returns translated text for non-default locale', async () => {
		const storage = createMockStorage();
		await storage.saveTranslation('zh-TW', '35ddf285', '你好世界'); // hash of "Hello World"

		const i18n = new I18n({
			storage,
			defaultLocale: 'en',
			enabledLocales: ['en', 'zh-TW'],
			localeDetector: () => 'zh-TW',
		});

		let result: string | undefined;
		await i18n.init(() => {
			result = t('Hello World');
		});

		expect(result).toBe('你好世界');
	});
});

describe('runWithI18n', () => {
	test('provides context to nested function', () => {
		const translations = new Map([['abc123', '翻譯']]);

		let capturedLocale: string | undefined;
		runWithI18n(
			{
				locale: 'zh-TW',
				defaultLocale: 'en',
				translations,
				translationsForClient: {},
			},
			() => {
				capturedLocale = getLocale();
			}
		);

		expect(capturedLocale).toBe('zh-TW');
	});
});

describe('getTranslationsForClient', () => {
	test('returns empty object when no context', () => {
		expect(getTranslationsForClient()).toEqual({});
	});

	test('returns translations from context', () => {
		const translationsForClient = { 'Hello World': '你好世界' };

		let result: Record<string, string> | undefined;
		runWithI18n(
			{
				locale: 'zh-TW',
				defaultLocale: 'en',
				translations: new Map(),
				translationsForClient,
			},
			() => {
				result = getTranslationsForClient();
			}
		);

		expect(result).toEqual(translationsForClient);
	});
});
