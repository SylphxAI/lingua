/**
 * Server module - business logic and API handlers
 *
 * @example Recommended setup with TypeScript manifest
 * ```ts
 * // 1. Generate manifest: rosetta extract -o src/rosetta/manifest.ts
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
export {
	/** @deprecated Use TypeScript manifest with direct import instead */
	createManifestReader,
	type ManifestSource,
	type ManifestReaderConfig,
} from './manifest';
