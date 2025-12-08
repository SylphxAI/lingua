/**
 * @sylphx/rosetta-admin - Headless translation admin for @sylphx/rosetta
 *
 * @example Quick Start with tRPC
 * ```tsx
 * // 1. Server: Create tRPC router
 * // server/trpc/routers/admin.ts
 * import { createAdminRouter } from '@sylphx/rosetta-admin/server/trpc';
 * import { storage } from '@/lib/rosetta';
 * import { createOpenRouterTranslator } from '@sylphx/rosetta-admin/ai';
 *
 * export const adminRouter = createAdminRouter({
 *   storage,
 *   translator: createOpenRouterTranslator({
 *     apiKey: process.env.OPENROUTER_API_KEY!,
 *   }),
 * });
 *
 * // 2. Client: Use hooks to build your UI
 * // app/admin/translations/page.tsx
 * 'use client';
 * import { TranslationAdminProvider, useTranslationAdmin, createTRPCClient } from '@sylphx/rosetta-admin/react';
 * import { api } from '@/trpc/react';
 *
 * const client = createTRPCClient(api.admin);
 *
 * function TranslationDashboard() {
 *   const {
 *     locales,
 *     stats,
 *     enterEditor,
 *     getLocaleProgress,
 *   } = useTranslationAdmin();
 *
 *   return (
 *     <div>
 *       {locales.map(locale => (
 *         <button key={locale} onClick={() => enterEditor(locale)}>
 *           {locale}: {getLocaleProgress(locale)}% translated
 *         </button>
 *       ))}
 *     </div>
 *   );
 * }
 *
 * export default function Page() {
 *   return (
 *     <TranslationAdminProvider client={client}>
 *       <TranslationDashboard />
 *     </TranslationAdminProvider>
 *   );
 * }
 * ```
 *
 * @example With REST API
 * ```tsx
 * // 1. Server: Create REST handlers
 * // app/api/admin/translations/route.ts
 * import { createRestHandlers } from '@sylphx/rosetta-admin/server';
 * import { storage } from '@/lib/rosetta';
 * import { createOpenRouterTranslator } from '@sylphx/rosetta-admin/ai';
 *
 * const handlers = createRestHandlers({
 *   storage,
 *   translator: createOpenRouterTranslator({
 *     apiKey: process.env.OPENROUTER_API_KEY!,
 *   }),
 * });
 *
 * export const { GET, PUT, PATCH } = handlers;
 *
 * // app/api/admin/translations/batch/route.ts
 * export const POST = handlers.batchTranslate;
 *
 * // 2. Client: Use REST client
 * import { createRestClient } from '@sylphx/rosetta-admin/react';
 *
 * const client = createRestClient({ baseUrl: '/api/admin/translations' });
 * ```
 */

// Re-export core types
export * from './core/types';

// Re-export store
export { createAdminStore, type AdminStore } from './core/store';
