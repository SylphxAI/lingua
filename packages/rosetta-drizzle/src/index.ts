/**
 * @sylphx/rosetta-drizzle - Drizzle ORM storage adapter for @sylphx/rosetta
 *
 * @example
 * ```ts
 * // 1. Create schema in your Drizzle schema file
 * import { pgTable, text, timestamp, integer, boolean, unique, serial } from 'drizzle-orm/pg-core';
 * import { createRosettaSchema } from '@sylphx/rosetta-drizzle/schema';
 *
 * export const { rosettaSources, rosettaTranslations } = createRosettaSchema({
 *   pgTable, text, timestamp, integer, boolean, unique, serial
 * });
 *
 * // 2. Use the adapter in your i18n setup
 * import { DrizzleStorageAdapter } from '@sylphx/rosetta-drizzle';
 * import { I18n } from '@sylphx/rosetta/server';
 *
 * const storage = new DrizzleStorageAdapter({
 *   db,
 *   sources: rosettaSources,
 *   translations: rosettaTranslations,
 * });
 *
 * export const i18n = new I18n({
 *   storage,
 *   defaultLocale: 'en',
 *   enabledLocales: ['en', 'zh-TW', 'ja'],
 * });
 * ```
 */

export {
	DrizzleStorageAdapter,
	type DrizzleStorageAdapterConfig,
	type DrizzleDatabase,
} from './adapter';
