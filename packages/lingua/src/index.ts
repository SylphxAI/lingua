/**
 * @sylphx/lingua - Lightweight i18n with LLM-powered translation
 *
 * Main entry point exports browser-safe utilities only.
 * For server-side features, import from '@sylphx/lingua/server'
 * For React components, import from '@sylphx/lingua/client'
 * For adapters, import from '@sylphx/lingua/adapters'
 */

// Hash function (browser-safe)
export { hashText } from './hash';

// Interpolation (browser-safe)
export { interpolate } from './interpolate';

// Locale utilities (browser-safe)
export {
	ALL_LOCALES,
	DEFAULT_LOCALE,
	DEFAULT_ENABLED_LOCALES,
	getLocaleInfo,
	getLocaleNativeName,
	getLocaleEnglishName,
	localeNames,
	type LocaleCode,
} from './locales';

// Type exports
export type {
	// Core types
	SourceString,
	Translation,
	TranslationStatus,
	SourceWithStatus,
	TranslationStats,
	LocaleInfo,
	TranslateOptions,
	// Adapter interfaces
	StorageAdapter,
	TranslateAdapter,
	// Context types
	I18nContext,
	// Client types
	TranslationContextValue,
	I18nProviderProps,
} from './types';
