/**
 * Rosetta Sync & Next.js Plugin
 *
 * Zero-config usage (recommended):
 * ```ts
 * // next.config.ts
 * import { withRosetta } from '@sylphx/rosetta-next/sync';
 * import { storage } from './src/lib/rosetta-storage';
 *
 * export default withRosetta(nextConfig, { storage });
 * ```
 *
 * That's it! Strings are extracted during build and synced to DB automatically.
 *
 * Manual sync (advanced):
 * ```ts
 * import { syncRosetta } from '@sylphx/rosetta-next/sync';
 * await syncRosetta(storage);
 * ```
 */

import fs from 'node:fs';
import path from 'node:path';
import type { StorageAdapter } from '@sylphx/rosetta';

// ============================================
// Configuration
// ============================================

const DEFAULT_MANIFEST_DIR = '.rosetta';
const MANIFEST_FILE = 'manifest.json';
const LOCK_FILE = 'sync.lock';
const LOCK_TIMEOUT_MS = 30000; // 30 seconds max lock duration
const LOCK_RETRY_MS = 100; // Retry every 100ms
const LOCK_MAX_RETRIES = 50; // Max 5 seconds waiting for lock

// ============================================
// Path Helpers
// ============================================

function getManifestDir(): string {
	// Read env at runtime (not module load time) for testability
	const dir = process.env.ROSETTA_MANIFEST_DIR ?? DEFAULT_MANIFEST_DIR;
	return path.join(process.cwd(), dir);
}

function getManifestPath(): string {
	return path.join(getManifestDir(), MANIFEST_FILE);
}

function getLockPath(): string {
	return path.join(getManifestDir(), LOCK_FILE);
}

// ============================================
// Manifest Schema Validation
// ============================================

interface ManifestEntry {
	text: string;
	hash: string;
}

interface ManifestValidationResult {
	valid: boolean;
	entries: ManifestEntry[];
	errors: string[];
	warnings: string[];
}

/**
 * Validate manifest entry structure
 */
function isValidEntry(entry: unknown): entry is ManifestEntry {
	return (
		typeof entry === 'object' &&
		entry !== null &&
		typeof (entry as ManifestEntry).text === 'string' &&
		typeof (entry as ManifestEntry).hash === 'string' &&
		(entry as ManifestEntry).text.length > 0 &&
		(entry as ManifestEntry).hash.length > 0
	);
}

/**
 * Validate manifest structure and entries
 */
function validateManifest(parsed: unknown): ManifestValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];
	const entries: ManifestEntry[] = [];

	if (!Array.isArray(parsed)) {
		errors.push('Manifest must be an array');
		return { valid: false, entries, errors, warnings };
	}

	const seenHashes = new Map<string, string>();

	for (let i = 0; i < parsed.length; i++) {
		const entry = parsed[i];

		if (!isValidEntry(entry)) {
			warnings.push(`Entry ${i}: Invalid structure, skipping`);
			continue;
		}

		// Check for duplicate hashes (collision detection)
		const existingText = seenHashes.get(entry.hash);
		if (existingText !== undefined) {
			if (existingText !== entry.text) {
				warnings.push(
					`Hash collision: "${entry.hash}" maps to both "${existingText}" and "${entry.text}"`
				);
			}
			// Skip duplicate
			continue;
		}

		seenHashes.set(entry.hash, entry.text);
		entries.push(entry);
	}

	return {
		valid: errors.length === 0,
		entries,
		errors,
		warnings,
	};
}

// ============================================
// Manifest Operations
// ============================================

function readManifest(): ManifestEntry[] {
	const manifestPath = getManifestPath();
	if (!fs.existsSync(manifestPath)) {
		return [];
	}
	try {
		const content = fs.readFileSync(manifestPath, 'utf-8');
		const parsed = JSON.parse(content);
		const validation = validateManifest(parsed);

		// Log warnings but continue
		if (validation.warnings.length > 0) {
			console.warn('[rosetta] Manifest warnings:');
			for (const warning of validation.warnings) {
				console.warn(`  - ${warning}`);
			}
		}

		// Log errors and return empty if invalid structure
		if (!validation.valid) {
			console.error('[rosetta] Manifest validation failed:');
			for (const error of validation.errors) {
				console.error(`  - ${error}`);
			}
			return [];
		}

		return validation.entries;
	} catch (error) {
		console.error('[rosetta] Failed to read manifest:', error);
		return [];
	}
}

/**
 * Clear manifest file
 * ONLY call this in development mode - production should preserve manifest
 */
function clearManifest(): void {
	const manifestPath = getManifestPath();
	if (fs.existsSync(manifestPath)) {
		fs.unlinkSync(manifestPath);
	}
}

// ============================================
// Distributed Lock (File-based)
// ============================================

interface LockInfo {
	pid: number;
	hostname: string;
	timestamp: number;
}

/**
 * Acquire a file-based lock for sync operations
 * Prevents multiple processes/pods from syncing simultaneously
 */
async function acquireLock(): Promise<boolean> {
	const lockPath = getLockPath();
	const manifestDir = getManifestDir();

	// Ensure directory exists
	if (!fs.existsSync(manifestDir)) {
		fs.mkdirSync(manifestDir, { recursive: true });
	}

	const lockInfo: LockInfo = {
		pid: process.pid,
		hostname: require('node:os').hostname(),
		timestamp: Date.now(),
	};

	for (let i = 0; i < LOCK_MAX_RETRIES; i++) {
		try {
			// Check if stale lock exists
			if (fs.existsSync(lockPath)) {
				try {
					const existingLock: LockInfo = JSON.parse(fs.readFileSync(lockPath, 'utf-8'));
					const lockAge = Date.now() - existingLock.timestamp;

					if (lockAge > LOCK_TIMEOUT_MS) {
						// Stale lock - remove it
						fs.unlinkSync(lockPath);
					} else {
						// Lock is held by another process
						await new Promise((resolve) => setTimeout(resolve, LOCK_RETRY_MS));
						continue;
					}
				} catch {
					// Corrupted lock file - remove it
					fs.unlinkSync(lockPath);
				}
			}

			// Try to create lock atomically (O_EXCL flag)
			const fd = fs.openSync(lockPath, fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_WRONLY);
			fs.writeSync(fd, JSON.stringify(lockInfo));
			fs.closeSync(fd);
			return true;
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
				// Another process created the lock - retry
				await new Promise((resolve) => setTimeout(resolve, LOCK_RETRY_MS));
				continue;
			}
			throw error;
		}
	}

	return false;
}

/**
 * Release the sync lock
 */
function releaseLock(): void {
	const lockPath = getLockPath();
	try {
		if (fs.existsSync(lockPath)) {
			fs.unlinkSync(lockPath);
		}
	} catch {
		// Ignore errors during lock release
	}
}

export interface RosettaPluginOptions {
	/**
	 * Storage adapter for auto-sync after build
	 * When provided, strings are automatically synced to DB after build completes
	 */
	storage?: StorageAdapter;
	/** Verbose logging (default: true in development) */
	verbose?: boolean;
}

// Use permissive types for NextConfig to avoid conflicts with Next.js types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NextConfig = Record<string, any>;

export interface SyncRosettaOptions {
	/** Enable verbose logging */
	verbose?: boolean;
	/**
	 * Clear manifest after sync
	 * @default false in production, true in development
	 */
	clearAfterSync?: boolean;
	/**
	 * Force sync even if lock cannot be acquired
	 * Use with caution - may cause duplicate syncs
	 * @default false
	 */
	forceLock?: boolean;
}

export interface SyncRosettaResult {
	/** Number of strings synced */
	synced: number;
	/** Whether lock was acquired */
	lockAcquired: boolean;
	/** Whether sync was skipped (e.g., lock not acquired) */
	skipped: boolean;
}

/**
 * Sync extracted strings from manifest to storage
 *
 * Run this AFTER build completes, not during build.
 * Typically in a postbuild script or during deployment.
 *
 * Features:
 * - Distributed lock prevents multiple processes from syncing simultaneously
 * - Production mode preserves manifest (safe for multi-pod deployments)
 * - Development mode clears manifest after sync
 *
 * @example
 * ```ts
 * // scripts/sync-rosetta.ts
 * import { syncRosetta } from '@sylphx/rosetta-next/sync';
 * import { storage } from '../src/lib/rosetta-storage';
 *
 * await syncRosetta(storage, { verbose: true });
 * ```
 */
export async function syncRosetta(
	storage: StorageAdapter,
	options?: SyncRosettaOptions
): Promise<SyncRosettaResult> {
	const verbose = options?.verbose ?? false;
	const isProduction = process.env.NODE_ENV === 'production';
	// Default: clear in dev, preserve in prod
	const clearAfterSync = options?.clearAfterSync ?? !isProduction;
	const forceLock = options?.forceLock ?? false;

	// Try to acquire lock
	const lockAcquired = await acquireLock();

	if (!lockAcquired && !forceLock) {
		if (verbose) {
			console.log('[rosetta] Another process is syncing - skipping');
		}
		return { synced: 0, lockAcquired: false, skipped: true };
	}

	if (!lockAcquired && forceLock) {
		console.warn('[rosetta] ⚠️ Forcing sync without lock - may cause duplicates');
	}

	try {
		const strings = readManifest();

		if (strings.length === 0) {
			if (verbose) {
				console.log('[rosetta] No new strings to sync');
			}
			return { synced: 0, lockAcquired, skipped: false };
		}

		if (verbose) {
			console.log(`[rosetta] Syncing ${strings.length} strings to storage...`);
		}

		// Register to storage
		await storage.registerSources(strings);

		// Clear manifest after successful sync (only in dev by default)
		if (clearAfterSync) {
			clearManifest();
			if (verbose) {
				console.log('[rosetta] Cleared manifest after sync');
			}
		} else if (verbose) {
			console.log('[rosetta] Preserving manifest (production mode)');
		}

		if (verbose) {
			console.log(`[rosetta] ✓ Synced ${strings.length} strings`);
		}

		return { synced: strings.length, lockAcquired, skipped: false };
	} finally {
		// Always release lock
		if (lockAcquired) {
			releaseLock();
		}
	}
}

// ============================================
// Auto-Sync State & Execution
// ============================================

const SYNC_TIMEOUT_MS = 30000; // 30 second timeout for sync operations

let syncCompleted = false;
let syncPromise: Promise<SyncRosettaResult> | null = null;

// Store storage adapter globally for instrumentation.ts access
let globalStorage: StorageAdapter | null = null;
let globalVerbose = false;

/**
 * Perform sync with deduplication and timeout
 * Multiple callers will share the same promise
 */
async function performAutoSync(
	storage: StorageAdapter,
	verbose: boolean
): Promise<SyncRosettaResult> {
	if (syncCompleted) {
		return { synced: 0, lockAcquired: false, skipped: true };
	}

	if (syncPromise) {
		return syncPromise;
	}

	syncPromise = (async () => {
		try {
			if (verbose) {
				console.log('[rosetta] Syncing strings to database...');
			}

			// Add timeout to prevent hanging forever
			const timeoutPromise = new Promise<never>((_, reject) =>
				setTimeout(() => reject(new Error('Sync timeout after 30s')), SYNC_TIMEOUT_MS)
			);

			const result = await Promise.race([
				syncRosetta(storage, {
					verbose,
					clearAfterSync: process.env.NODE_ENV !== 'production',
				}),
				timeoutPromise,
			]);

			syncCompleted = true;

			if (result.synced > 0) {
				console.log(`[rosetta] ✓ Synced ${result.synced} strings to database`);
			} else if (result.skipped) {
				console.log('[rosetta] ⏭️ Sync skipped (another process is syncing)');
			} else {
				console.log('[rosetta] ⏭️ No new strings to sync');
			}

			return result;
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			console.error(`[rosetta] ❌ Sync failed: ${message}`);
			return { synced: 0, lockAcquired: false, skipped: false };
		}
	})();

	return syncPromise;
}

/**
 * Create webpack plugin for reliable sync
 * Uses compiler.hooks.done which runs BEFORE process.exit()
 */
function createWebpackSyncPlugin(storage: StorageAdapter, verbose: boolean) {
	return {
		name: 'RosettaAutoSync',
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		apply(compiler: any) {
			// 'done' hook runs after compilation finishes, before process exits
			// This is reliable even when Next.js calls process.exit()
			compiler.hooks.done.tapPromise(
				'RosettaAutoSync',
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				async (stats: any) => {
					// Only sync on successful production server build
					if (!stats.hasErrors()) {
						await performAutoSync(storage, verbose);
					}
				}
			);
		},
	};
}

/**
 * Setup exit handler for Turbopack builds
 *
 * Strategy:
 * 1. Intercept process.exit() to run sync before actual exit
 * 2. Add timeout to prevent hanging forever
 * 3. Guard against multiple exit calls
 *
 * NOTE: For guaranteed sync, use instrumentation.ts
 */
function setupTurbopackFallback(storage: StorageAdapter, verbose: boolean): void {
	// Store globally for instrumentation.ts access
	globalStorage = storage;
	globalVerbose = verbose;

	const originalExit = process.exit;
	let exitScheduled = false;

	const doExit = (code?: number) => {
		if (exitScheduled) return;
		exitScheduled = true;
		originalExit(code);
	};

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	(process as any).exit = ((code?: number): never => {
		if (syncCompleted || exitScheduled) {
			return originalExit(code);
		}

		// Start sync with timeout guarantee
		performAutoSync(storage, verbose)
			.catch(() => {})
			.finally(() => doExit(code));

		// Hard timeout - exit anyway after SYNC_TIMEOUT_MS + 1s buffer
		setTimeout(() => {
			if (!exitScheduled) {
				console.log('[rosetta] ⚠️ Sync timeout, exiting anyway');
				doExit(code);
			}
		}, SYNC_TIMEOUT_MS + 1000);

		// Keep event loop alive by not calling originalExit yet
		return undefined as never;
	}) as typeof process.exit;

	// beforeExit as secondary fallback (works when event loop empties naturally)
	process.on('beforeExit', async () => {
		if (!syncCompleted && !exitScheduled) {
			await performAutoSync(storage, verbose);
		}
	});
}

/**
 * Register function for instrumentation.ts (Next.js server startup hook)
 *
 * This provides GUARANTEED sync for Turbopack builds.
 * Add to your project:
 *
 * @example
 * ```ts
 * // instrumentation.ts
 * export { register } from '@sylphx/rosetta-next/sync';
 * ```
 *
 * Or with custom logic:
 * ```ts
 * // instrumentation.ts
 * import { register as rosettaRegister } from '@sylphx/rosetta-next/sync';
 *
 * export async function register() {
 *   await rosettaRegister();
 *   // your other initialization...
 * }
 * ```
 */
export async function register(): Promise<void> {
	// Only run on server
	if (typeof window !== 'undefined') return;

	// Check if manifest exists and needs syncing
	const manifestPath = getManifestPath();
	if (!fs.existsSync(manifestPath)) return;

	// Use stored storage adapter from withRosetta
	if (!globalStorage) {
		console.log('[rosetta] ℹ️ No storage configured, skipping instrumentation sync');
		return;
	}

	if (syncCompleted) {
		console.log('[rosetta] ℹ️ Already synced during build');
		return;
	}

	console.log('[rosetta] 📦 Syncing strings at server startup...');
	await performAutoSync(globalStorage, globalVerbose);
}

/**
 * Create a Next.js config with Rosetta loader integration
 *
 * Zero-config: Pass storage option to auto-sync after build
 *
 * @example
 * ```ts
 * // next.config.ts
 * import { withRosetta } from '@sylphx/rosetta-next/sync';
 * import { storage } from './src/lib/rosetta-storage';
 *
 * export default withRosetta(nextConfig, { storage });
 * ```
 */
export function withRosetta<T extends NextConfig>(
	nextConfig: T,
	options?: RosettaPluginOptions
): T {
	const verbose = options?.verbose ?? process.env.NODE_ENV !== 'production';
	const storage = options?.storage;

	// Get loader path - use require.resolve at runtime
	// Use computed string to prevent bundler from resolving at build time
	const loaderPackage = '@sylphx/rosetta-next' + '/loader';
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const loaderPath = require.resolve(loaderPackage);

	if (verbose) {
		console.log('[rosetta] Adding loader for string extraction');
		if (storage) {
			console.log('[rosetta] Auto-sync enabled (will sync to DB after build)');
		}
	}

	// Setup Turbopack fallback if storage is provided
	// This intercepts process.exit() to run sync before exit
	if (storage) {
		setupTurbopackFallback(storage, verbose);
	}

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
		// Add webpack loader + sync plugin (for webpack builds)
		// enforce: 'pre' ensures our loader runs before other loaders (e.g., babel, swc)
		webpack: (
			config: { module: { rules: unknown[] }; plugins: unknown[] },
			context: { isServer: boolean; dev: boolean }
		) => {
			// Add loader for string extraction
			config.module.rules.push({
				test: /\.(ts|tsx)$/,
				enforce: 'pre',
				use: [loaderPath],
			});

			// Add sync plugin for production server builds
			// Uses compiler.hooks.done which is reliable (runs before process.exit)
			if (storage && context.isServer && !context.dev) {
				config.plugins = config.plugins ?? [];
				config.plugins.push(createWebpackSyncPlugin(storage, verbose));
			}

			if (nextConfig.webpack) {
				return nextConfig.webpack(config, context);
			}
			return config;
		},
	} as T;
}
