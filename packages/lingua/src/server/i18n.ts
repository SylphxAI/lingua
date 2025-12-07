import { hashText } from '../hash';
import { DEFAULT_ENABLED_LOCALES, DEFAULT_LOCALE } from '../locales';
import type { SourceString, StorageAdapter, TranslateAdapter } from '../types';
import { runWithI18n } from './context';

/**
 * Locale detector function type
 */
export type LocaleDetector = () => Promise<string> | string;

/**
 * I18n server configuration
 */
export interface I18nConfig {
	/** Storage adapter for translations */
	storage: StorageAdapter;
	/** Optional translation adapter for auto-translation */
	translator?: TranslateAdapter;
	/** Default locale (source language) */
	defaultLocale?: string;
	/** List of enabled locales */
	enabledLocales?: string[];
	/** Cache TTL in milliseconds (default: 60000) */
	cacheTTL?: number;
	/** Function to detect current locale */
	localeDetector?: LocaleDetector;
}

interface LoadedTranslations {
	/** hash -> translated text (for server lookup) */
	byHash: Map<string, string>;
	/** source -> translated text (for client) */
	bySource: Record<string, string>;
}

/**
 * Server-side I18n manager
 *
 * @example
 * const i18n = new I18n({
 *   storage: new DrizzleStorageAdapter(db),
 *   translator: new OpenRouterAdapter({ apiKey }),
 *   defaultLocale: 'en',
 *   enabledLocales: ['en', 'zh-TW', 'zh-CN'],
 *   localeDetector: () => cookies().get('locale')?.value ?? 'en',
 * });
 *
 * // In layout.tsx
 * export default async function Layout({ children }) {
 *   return i18n.init(async () => (
 *     <html><body>{children}</body></html>
 *   ));
 * }
 */
export class I18n {
	private storage: StorageAdapter;
	private translator?: TranslateAdapter;
	private defaultLocale: string;
	private enabledLocales: string[];
	private cacheTTL: number;
	private localeDetector?: LocaleDetector;

	// In-memory cache
	private translationCache = new Map<string, LoadedTranslations>();
	private lastCacheTime = 0;

	constructor(config: I18nConfig) {
		this.storage = config.storage;
		this.translator = config.translator;
		this.defaultLocale = config.defaultLocale ?? DEFAULT_LOCALE;
		this.enabledLocales = config.enabledLocales ?? DEFAULT_ENABLED_LOCALES;
		this.cacheTTL = config.cacheTTL ?? 60 * 1000; // 1 minute
		this.localeDetector = config.localeDetector;
	}

	/**
	 * Set locale detector function
	 */
	setLocaleDetector(detector: LocaleDetector): void {
		this.localeDetector = detector;
	}

	/**
	 * Detect current locale
	 */
	async detectLocale(): Promise<string> {
		if (this.localeDetector) {
			const locale = await this.localeDetector();
			if (this.enabledLocales.includes(locale)) {
				return locale;
			}
		}
		return this.defaultLocale;
	}

	/**
	 * Get enabled locales
	 */
	getEnabledLocales(): string[] {
		return this.enabledLocales;
	}

	/**
	 * Get default locale
	 */
	getDefaultLocale(): string {
		return this.defaultLocale;
	}

	/**
	 * Load translations for a locale (with caching)
	 */
	async loadTranslations(locale: string): Promise<LoadedTranslations> {
		// Default locale doesn't need translations
		if (locale === this.defaultLocale) {
			return { byHash: new Map(), bySource: {} };
		}

		// Check cache
		const now = Date.now();
		const cached = this.translationCache.get(locale);
		if (cached && now - this.lastCacheTime < this.cacheTTL) {
			return cached;
		}

		// Load from storage
		const translationMap = await this.storage.getTranslations(locale);

		// We need source text for client-side lookup
		// The storage adapter returns hash -> translated
		// We also need source -> translated for client
		const byHash = translationMap;
		const bySource: Record<string, string> = {};

		// Get all sources to build bySource map
		const sources = await this.storage.getSources();
		for (const source of sources) {
			const translated = translationMap.get(source.hash);
			if (translated) {
				bySource[source.text] = translated;
			}
		}

		const result: LoadedTranslations = { byHash, bySource };

		// Update cache
		this.translationCache.set(locale, result);
		this.lastCacheTime = now;

		return result;
	}

	/**
	 * Initialize i18n context for the current request
	 *
	 * @example
	 * export default async function Layout({ children }) {
	 *   return i18n.init(async () => (
	 *     <html><body>{children}</body></html>
	 *   ));
	 * }
	 */
	async init<T>(fn: () => T | Promise<T>): Promise<T> {
		const locale = await this.detectLocale();
		const loaded = await this.loadTranslations(locale);

		return runWithI18n(
			{
				locale,
				defaultLocale: this.defaultLocale,
				translations: loaded.byHash,
				translationsForClient: loaded.bySource,
				storage: this.storage,
			},
			() => fn()
		);
	}

	/**
	 * Get i18n data for client hydration
	 */
	async getClientData(): Promise<{
		locale: string;
		defaultLocale: string;
		enabledLocales: string[];
		translations: Record<string, string>;
	}> {
		const locale = await this.detectLocale();
		const loaded = await this.loadTranslations(locale);

		return {
			locale,
			defaultLocale: this.defaultLocale,
			enabledLocales: this.enabledLocales,
			translations: loaded.bySource,
		};
	}

	/**
	 * Invalidate translation cache
	 */
	invalidateCache(): void {
		this.translationCache.clear();
		this.lastCacheTime = 0;
	}

	// ============================================
	// Translation Management
	// ============================================

	/**
	 * Get all source strings
	 */
	async getSources(): Promise<SourceString[]> {
		return this.storage.getSources();
	}

	/**
	 * Get untranslated strings for a locale
	 */
	async getUntranslated(locale: string): Promise<SourceString[]> {
		return this.storage.getUntranslated(locale);
	}

	/**
	 * Get translation statistics
	 */
	async getStats(): Promise<{
		totalStrings: number;
		locales: Record<string, { translated: number; total: number }>;
	}> {
		const sources = await this.storage.getSources();
		const totalStrings = sources.length;
		const locales: Record<string, { translated: number; total: number }> = {};

		for (const locale of this.enabledLocales) {
			if (locale === this.defaultLocale) continue;

			const translations = await this.storage.getTranslations(locale);
			locales[locale] = {
				translated: translations.size,
				total: totalStrings,
			};
		}

		return { totalStrings, locales };
	}

	/**
	 * Generate translation using translator adapter
	 */
	async generateTranslation(
		text: string,
		targetLocale: string,
		context?: string
	): Promise<string | null> {
		if (!this.translator) {
			throw new Error('No translator adapter configured');
		}

		if (targetLocale === this.defaultLocale) {
			return text;
		}

		try {
			return await this.translator.translate(text, {
				from: this.defaultLocale,
				to: targetLocale,
				context,
			});
		} catch (error) {
			console.error('[lingua] Translation failed:', error);
			return null;
		}
	}

	/**
	 * Generate and save translation
	 */
	async generateAndSave(
		text: string,
		targetLocale: string,
		context?: string
	): Promise<string | null> {
		const translation = await this.generateTranslation(text, targetLocale, context);

		if (translation) {
			const hash = hashText(text, context);
			await this.storage.saveTranslation(targetLocale, hash, translation, {
				sourceText: text,
				context,
				autoGenerated: true,
			});
			this.invalidateCache();
		}

		return translation;
	}

	/**
	 * Generate translations for all untranslated strings
	 */
	async generateAllUntranslated(
		targetLocale: string,
		onProgress?: (current: number, total: number) => void
	): Promise<{ success: number; failed: number }> {
		const untranslated = await this.getUntranslated(targetLocale);
		let success = 0;
		let failed = 0;

		for (let i = 0; i < untranslated.length; i++) {
			const source = untranslated[i]!;
			const translation = await this.generateAndSave(
				source.text,
				targetLocale,
				source.context ?? undefined
			);

			if (translation) {
				success++;
			} else {
				failed++;
			}

			onProgress?.(i + 1, untranslated.length);
		}

		return { success, failed };
	}

	/**
	 * Save a manual translation
	 */
	async saveTranslation(
		locale: string,
		text: string,
		translation: string,
		context?: string
	): Promise<void> {
		const hash = hashText(text, context);
		await this.storage.saveTranslation(locale, hash, translation, {
			sourceText: text,
			context,
			autoGenerated: false,
		});
		this.invalidateCache();
	}
}
