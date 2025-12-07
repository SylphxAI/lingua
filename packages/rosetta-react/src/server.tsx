import type { ReactNode } from 'react';
import type { Rosetta } from '@sylphx/rosetta/server';
import { runWithRosetta, flushCollectedStrings } from '@sylphx/rosetta/server';
import { RosettaClientProvider } from './client';

// ============================================
// Types
// ============================================

export interface RosettaProviderProps {
	/** Rosetta instance */
	rosetta: Rosetta;
	/** Current locale (e.g., from URL params) */
	locale: string;
	/** Children to render */
	children: ReactNode;
}

// ============================================
// Server Provider
// ============================================

/**
 * RosettaProvider - Server component that sets up translation context
 *
 * This is an async server component that:
 * 1. Loads translations for the specified locale
 * 2. Sets up AsyncLocalStorage context for server components
 * 3. Provides React context for client components via RosettaClientProvider
 *
 * @example
 * // app/[locale]/layout.tsx
 * import { RosettaProvider } from '@sylphx/rosetta-react/server';
 * import { rosetta } from '@/lib/i18n';
 *
 * export default async function Layout({ children, params }) {
 *   return (
 *     <RosettaProvider rosetta={rosetta} locale={params.locale}>
 *       <html lang={params.locale}>
 *         <body>{children}</body>
 *       </html>
 *     </RosettaProvider>
 *   );
 * }
 *
 * // Then in any server component:
 * import { t } from '@sylphx/rosetta/server';
 * function MyComponent() {
 *   return <h1>{t("Hello World")}</h1>;
 * }
 *
 * // And in any client component:
 * 'use client';
 * import { useT } from '@sylphx/rosetta-react';
 * function MyButton() {
 *   const t = useT();
 *   return <button>{t("Click me")}</button>;
 * }
 */
export async function RosettaProvider({
	rosetta,
	locale,
	children,
}: RosettaProviderProps): Promise<React.ReactElement> {
	// Load translations for this locale
	const translations = await rosetta.loadTranslations(locale);
	const defaultLocale = rosetta.getDefaultLocale();

	// Run within AsyncLocalStorage context for server components
	// and provide React context for client components
	return runWithRosetta(
		{
			locale,
			defaultLocale,
			translations,
			storage: rosetta.getStorage(),
		},
		() => {
			// Schedule flush at end of request (non-blocking)
			// Using Promise.resolve().then() to defer without blocking render
			Promise.resolve().then(() => flushCollectedStrings());

			return (
				<RosettaClientProvider
					locale={locale}
					defaultLocale={defaultLocale}
					translations={Object.fromEntries(translations)}
				>
					{children}
				</RosettaClientProvider>
			);
		}
	);
}
