/**
 * Server-side Rosetta module
 *
 * @example
 * import { Rosetta, t, flushCollectedStrings } from '@sylphx/rosetta/server';
 *
 * const rosetta = new Rosetta({
 *   storage: myStorageAdapter,
 *   localeDetector: () => cookies().get('locale')?.value ?? 'en',
 * });
 *
 * // In layout.tsx
 * export default async function Layout({ children }) {
 *   return rosetta.init(async () => {
 *     const result = <html><body>{children}</body></html>;
 *     await flushCollectedStrings(); // Flush at end of request
 *     return result;
 *   });
 * }
 *
 * // In any server component
 * import { t } from '@sylphx/rosetta/server';
 * export function MyComponent() {
 *   return <h1>{t("Hello World")}</h1>;
 * }
 */

export {
	flushCollectedStrings,
	getDefaultLocale,
	getRosettaContext,
	getLocale,
	getTranslations,
	getTranslationsForClient,
	rosettaStorage,
	runWithRosetta,
	t,
} from './context';
export type { RosettaConfig, LocaleDetector } from './i18n';
export { Rosetta } from './i18n';
