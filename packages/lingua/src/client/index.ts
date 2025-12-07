/**
 * Client-side i18n module
 *
 * @example
 * // In a client component
 * 'use client';
 * import { useT } from '@sylphx/lingua/client';
 *
 * export function MyButton() {
 *   const t = useT();
 *   return <button>{t("Sign In")}</button>;
 * }
 *
 * // With interpolation
 * export function Greeting({ name }: { name: string }) {
 *   const t = useT();
 *   return <p>{t("Hello {name}", { name })}</p>;
 * }
 */

export { I18nProvider, useTranslation, useT, useLocale } from './provider';
