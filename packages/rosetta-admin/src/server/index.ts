/**
 * Server module - business logic and API handlers
 *
 * @example Setup with TypeScript manifest (recommended)
 * ```ts
 * // 1. Add to package.json scripts:
 * //    "build": "rosetta extract -o src/rosetta/manifest.ts && next build"
 * //
 * // 2. Use in your API handler:
 *
 * import { createRestHandlers } from '@sylphx/rosetta-admin/server';
 * import { manifest } from '@/rosetta/manifest';
 * import { storage } from '@/lib/rosetta';
 *
 * const handlers = createRestHandlers({
 *   storage,
 *   getManifestSources: async () => manifest,
 * });
 *
 * export const { GET, PUT, PATCH } = handlers;
 * ```
 */

export { createAdminService, type AdminService, type AdminServiceConfig } from './service';
export { createRestHandlers, type RestHandlers, type RestHandlersConfig } from './rest';
