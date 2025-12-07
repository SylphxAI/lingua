/**
 * @sylphx/lingua - Lightweight i18n with LLM-powered translation
 *
 * Main entry point exports browser-safe utilities only.
 * For server-side features, import from '@sylphx/lingua/server'
 * For React components, import from '@sylphx/lingua/client'
 * For adapters, import from '@sylphx/lingua/adapters'
 */

// Hash function (browser-safe)
export { hashText } from './hash'

// Interpolation (browser-safe)
export { interpolate } from './interpolate'

// Locale utilities (browser-safe)
export {
	ALL_LOCALES,
	DEFAULT_ENABLED_LOCALES,
	DEFAULT_LOCALE,
	getLocaleEnglishName,
	getLocaleInfo,
	getLocaleNativeName,
	type LocaleCode,
	localeNames,
} from './locales'

// Type exports
export type {
	// Context types
	I18nContext,
	I18nProviderProps,
	LocaleInfo,
	// Core types
	SourceString,
	SourceWithStatus,
	// Adapter interfaces
	StorageAdapter,
	TranslateAdapter,
	TranslateOptions,
	Translation,
	// Client types
	TranslationContextValue,
	TranslationStats,
	TranslationStatus,
} from './types'
