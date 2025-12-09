/**
 * Manifest reader utilities for rosetta-admin
 *
 * @deprecated Use TypeScript manifest files instead for better compatibility.
 *
 * RECOMMENDED APPROACH:
 * 1. Generate TypeScript manifest: `rosetta extract -o src/rosetta/manifest.ts`
 * 2. Import directly in your handlers:
 *
 * ```ts
 * import { manifest } from '@/rosetta/manifest';
 *
 * const handlers = createRestHandlers({
 *   storage,
 *   getManifestSources: async () => manifest,
 * });
 * ```
 *
 * This approach:
 * - Works in ALL environments (Edge, Serverless, Node.js)
 * - Zero runtime I/O (no fs.readFile, no fetch)
 * - Type-safe with full IDE support
 * - Tree-shakeable and optimizable by bundlers
 */

export interface ManifestSource {
	hash: string;
	text: string;
	context?: string;
}

export interface ManifestReaderConfig {
	/**
	 * Base URL for fetch fallback (e.g., 'https://example.com')
	 * If not provided, will try to detect from VERCEL_URL or NEXT_PUBLIC_APP_URL
	 */
	baseUrl?: string;

	/**
	 * Custom file paths to try (for fs.readFile)
	 * Defaults to common Next.js paths
	 */
	filePaths?: string[];

	/**
	 * Manifest URL path (appended to baseUrl for fetch)
	 * Default: '/rosetta/manifest.json'
	 */
	manifestPath?: string;
}

/**
 * Create a manifest reader function that works in all environments
 *
 * @deprecated Use TypeScript manifest files with direct imports instead.
 * See module documentation for recommended approach.
 *
 * @example
 * ```ts
 * // DEPRECATED - use TypeScript manifest instead:
 * // rosetta extract -o src/rosetta/manifest.ts
 * // import { manifest } from '@/rosetta/manifest';
 *
 * import { createManifestReader } from '@sylphx/rosetta-admin/server';
 *
 * const getManifestSources = createManifestReader({
 *   baseUrl: process.env.NEXT_PUBLIC_APP_URL,
 * });
 *
 * createRestHandlers({
 *   storage,
 *   getManifestSources,
 * });
 * ```
 */
export function createManifestReader(
	config: ManifestReaderConfig = {}
): () => Promise<ManifestSource[]> {
	const {
		baseUrl,
		filePaths,
		manifestPath = '/rosetta/manifest.json',
	} = config;

	return async function getManifestSources(): Promise<ManifestSource[]> {
		// Strategy 1: Try fs.readFile (works in Node.js runtime)
		try {
			const { readFile } = await import('fs/promises');
			const { join } = await import('path');

			// Default paths for Next.js projects
			const paths = filePaths ?? [
				join(process.cwd(), 'public', 'rosetta', 'manifest.json'),
				'/var/task/public/rosetta/manifest.json', // Vercel serverless
			];

			for (const manifestFilePath of paths) {
				try {
					const content = await readFile(manifestFilePath, 'utf-8');
					const sources = JSON.parse(content) as ManifestSource[];
					return sources;
				} catch {
					// Try next path
				}
			}
		} catch {
			// fs not available (Edge runtime), fall through to fetch
		}

		// Strategy 2: Fallback to fetch from public URL
		try {
			const resolvedBaseUrl =
				baseUrl ||
				(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
				process.env.NEXT_PUBLIC_APP_URL ||
				'http://localhost:3000';

			const url = `${resolvedBaseUrl}${manifestPath}`;
			const res = await fetch(url, {
				cache: 'no-store', // Always get fresh manifest
			});

			if (res.ok) {
				const sources = (await res.json()) as ManifestSource[];
				return sources;
			}
		} catch {
			// Fetch failed
		}

		console.warn('[rosetta-admin] Failed to load manifest from any source');
		return [];
	};
}
