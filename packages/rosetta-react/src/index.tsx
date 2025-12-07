'use client';

import { hashText, interpolate } from '@sylphx/rosetta';
import type React from 'react';
import { type ReactNode, createContext, useContext } from 'react';

// ============================================
// Types
// ============================================

/**
 * Translation options with context for disambiguation
 */
export interface TranslateOptions {
	/** Context for disambiguation (e.g., "button", "menu") */
	context?: string;
	/** Interpolation params for variables like {name} */
	params?: Record<string, string | number>;
}

/**
 * Translation function type (matches server-side t() API)
 */
export type TranslateFunction = (
	text: string,
	paramsOrOptions?: Record<string, string | number> | TranslateOptions
) => string;

/**
 * Translation context value for React
 */
export interface TranslationContextValue {
	locale: string;
	t: TranslateFunction;
}

/**
 * Props for RosettaProvider
 */
export interface RosettaProviderProps {
	children: ReactNode;
	/** Current locale code */
	locale: string;
	/** Translations map (hash -> translated text) */
	translations: Record<string, string>;
}

// ============================================
// Context
// ============================================

const RosettaReactContext = createContext<TranslationContextValue>({
	locale: 'en',
	t: (text, paramsOrOptions) => {
		// Default fallback: just interpolate without translation
		const params =
			paramsOrOptions && 'params' in paramsOrOptions
				? (paramsOrOptions as TranslateOptions).params
				: (paramsOrOptions as Record<string, string | number> | undefined);
		return interpolate(text, params);
	},
});

// ============================================
// Provider
// ============================================

/**
 * RosettaProvider - wrap your app to enable client-side translations
 *
 * @example
 * // In layout.tsx (server component)
 * import { RosettaProvider } from '@sylphx/rosetta-react';
 * import { getTranslations, getLocale } from '@sylphx/rosetta/server';
 *
 * export default async function Layout({ children }) {
 *   return rosetta.init(async () => (
 *     <html>
 *       <body>
 *         <RosettaProvider
 *           locale={getLocale()}
 *           translations={getTranslations()}
 *         >
 *           {children}
 *         </RosettaProvider>
 *       </body>
 *     </html>
 *   ));
 * }
 */
export function RosettaProvider({
	locale,
	translations,
	children,
}: RosettaProviderProps): React.ReactElement {
	const t: TranslateFunction = (text, paramsOrOptions) => {
		// Determine if paramsOrOptions is TranslateOptions or direct interpolation params
		// TranslateOptions has 'context' or 'params' keys
		const isTranslateOptions =
			paramsOrOptions &&
			('context' in paramsOrOptions || 'params' in paramsOrOptions) &&
			// Heuristic: if it only has context/params keys, it's TranslateOptions
			Object.keys(paramsOrOptions).every((k) => k === 'context' || k === 'params');

		let context: string | undefined;
		let params: Record<string, string | number> | undefined;

		if (isTranslateOptions) {
			const opts = paramsOrOptions as TranslateOptions;
			context = opts.context;
			params = opts.params;
		} else {
			params = paramsOrOptions as Record<string, string | number> | undefined;
		}

		// Use same hash-based lookup as server (with context support)
		const hash = hashText(text, context);
		const translated = translations[hash] ?? text;
		return interpolate(translated, params);
	};

	return <RosettaReactContext.Provider value={{ locale, t }}>{children}</RosettaReactContext.Provider>;
}

// ============================================
// Hooks
// ============================================

/**
 * Get the full translation context
 */
export function useTranslation(): TranslationContextValue {
	return useContext(RosettaReactContext);
}

/**
 * Get just the translation function
 *
 * @example
 * const t = useT();
 * return <button>{t("Sign In")}</button>;
 * return <p>{t("Hello {name}", { name: user.name })}</p>;
 * // With context for disambiguation
 * return <button>{t("Submit", { context: "form" })}</button>;
 */
export function useT(): TranslateFunction {
	const { t } = useContext(RosettaReactContext);
	return t;
}

/**
 * Get current locale
 */
export function useLocale(): string {
	const { locale } = useContext(RosettaReactContext);
	return locale;
}
