/**
 * Rosetta Sync & Next.js Plugin
 *
 * Usage:
 * ```ts
 * // next.config.ts
 * import { withRosetta } from '@sylphx/rosetta-next/sync';
 * import { storage } from './src/lib/rosetta';
 *
 * export default withRosetta(nextConfig, { storage });
 * ```
 */

import type { StorageAdapter } from '@sylphx/rosetta';
import fs from 'node:fs';
import path from 'node:path';

// Inline manifest functions to avoid bunup duplicate export bug
const MANIFEST_DIR = '.rosetta';
const MANIFEST_FILE = 'manifest.json';

function getManifestPath(): string {
	return path.join(process.cwd(), MANIFEST_DIR, MANIFEST_FILE);
}

function readManifest(): Array<{ text: string; hash: string }> {
	const manifestPath = getManifestPath();
	if (!fs.existsSync(manifestPath)) {
		return [];
	}
	try {
		return JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
	} catch {
		return [];
	}
}

function clearManifest(): void {
	const manifestPath = getManifestPath();
	if (fs.existsSync(manifestPath)) {
		fs.unlinkSync(manifestPath);
	}
}

export interface RosettaPluginOptions {
	/** Storage adapter to sync to */
	storage: StorageAdapter;
	/** Verbose logging (default: true in development) */
	verbose?: boolean;
}

// Use permissive types for NextConfig to avoid conflicts with Next.js types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NextConfig = Record<string, any>;

/**
 * Sync extracted strings from manifest to storage
 */
export async function syncRosetta(
	storage: StorageAdapter,
	options?: { verbose?: boolean }
): Promise<{ synced: number }> {
	const verbose = options?.verbose ?? false;
	const strings = readManifest();

	if (strings.length === 0) {
		if (verbose) {
			console.log('[rosetta] No new strings to sync');
		}
		return { synced: 0 };
	}

	if (verbose) {
		console.log(`[rosetta] Syncing ${strings.length} strings to storage...`);
	}

	// Register to storage
	await storage.registerSources(strings);

	// Clear manifest after successful sync
	clearManifest();

	if (verbose) {
		console.log(`[rosetta] ✓ Synced ${strings.length} strings`);
	}

	return { synced: strings.length };
}

// Store reference to storage for webpack plugin
let _storage: StorageAdapter | null = null;
let _verbose = false;

/**
 * Webpack plugin that syncs strings after build completes
 */
class RosettaSyncPlugin {
	apply(compiler: { hooks: { done: { tapPromise: (name: string, fn: () => Promise<void>) => void } } }) {
		compiler.hooks.done.tapPromise('RosettaSyncPlugin', async () => {
			if (_storage) {
				await syncRosetta(_storage, { verbose: _verbose });
			}
		});
	}
}

/**
 * Create a Next.js config with Rosetta integration
 *
 * Automatically:
 * 1. Adds Turbopack loader for string extraction
 * 2. Syncs extracted strings to storage after build
 *
 * @example
 * ```ts
 * // next.config.ts
 * import { withRosetta } from '@sylphx/rosetta-next/sync';
 * import { storage } from './src/lib/rosetta';
 *
 * export default withRosetta({
 *   // your next config
 * }, { storage });
 * ```
 */
export function withRosetta<T extends NextConfig>(
	nextConfig: T,
	options: RosettaPluginOptions
): T {
	const { storage, verbose = process.env.NODE_ENV !== 'production' } = options;

	// Store for plugin access
	_storage = storage;
	_verbose = verbose;

	// Get loader path - use require.resolve at runtime
	// Use computed string to prevent bundler from resolving at build time
	const loaderPackage = '@sylphx/rosetta-next' + '/loader';
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const loaderPath = require.resolve(loaderPackage);

	return {
		...nextConfig,
		// Add Turbopack rules for loader
		turbopack: {
			...nextConfig.turbopack,
			rules: {
				...nextConfig.turbopack?.rules,
				'*.tsx': {
					loaders: [loaderPath],
				},
				'*.ts': {
					loaders: [loaderPath],
				},
			},
		},
		// Add webpack plugin for sync (for webpack builds)
		webpack: (config: { plugins: unknown[] }, context: unknown) => {
			config.plugins.push(new RosettaSyncPlugin());

			if (nextConfig.webpack) {
				return nextConfig.webpack(config, context);
			}
			return config;
		},
	} as T;
}
