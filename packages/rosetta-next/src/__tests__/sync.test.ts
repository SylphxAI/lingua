/**
 * Rosetta Sync Tests
 *
 * Tests manifest validation and sync to storage functionality.
 */

import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import { syncRosetta, withRosetta } from '../sync';
import type { StorageAdapter } from '@sylphx/rosetta';

// ============================================
// Test Setup
// ============================================

const TEST_MANIFEST_DIR = path.join(process.cwd(), '.rosetta-test');
const TEST_MANIFEST_PATH = path.join(TEST_MANIFEST_DIR, 'manifest.json');
const TEST_LOCK_PATH = path.join(TEST_MANIFEST_DIR, 'sync.lock');

function createTestManifest(entries: Array<{ text: string; hash: string }>) {
	if (!fs.existsSync(TEST_MANIFEST_DIR)) {
		fs.mkdirSync(TEST_MANIFEST_DIR, { recursive: true });
	}
	fs.writeFileSync(TEST_MANIFEST_PATH, JSON.stringify(entries, null, 2));
}

function createMockStorage(): StorageAdapter & { calls: { registerSources: unknown[][] } } {
	const calls: { registerSources: unknown[][] } = { registerSources: [] };
	return {
		calls,
		getTranslations: async () => new Map(),
		getTranslationsByHashes: async () => new Map(),
		registerSources: async (items) => {
			calls.registerSources.push([items]);
		},
		saveTranslation: async () => {},
		getSources: async () => [],
		getUntranslated: async () => [],
		getAvailableLocales: async () => [],
	};
}

beforeEach(() => {
	process.env.ROSETTA_MANIFEST_DIR = '.rosetta-test';

	// Clean slate
	if (fs.existsSync(TEST_MANIFEST_DIR)) {
		fs.rmSync(TEST_MANIFEST_DIR, { recursive: true });
	}
});

afterEach(() => {
	// Cleanup
	if (fs.existsSync(TEST_MANIFEST_DIR)) {
		fs.rmSync(TEST_MANIFEST_DIR, { recursive: true });
	}
	delete process.env.ROSETTA_MANIFEST_DIR;
});

// ============================================
// Sync Tests
// ============================================

describe('syncRosetta', () => {
	test('syncs manifest entries to storage', async () => {
		const storage = createMockStorage();
		createTestManifest([
			{ text: 'Hello', hash: 'abc123' },
			{ text: 'World', hash: 'def456' },
		]);

		const result = await syncRosetta(storage);

		expect(result.synced).toBe(2);
		expect(result.skipped).toBe(false);
		expect(storage.calls.registerSources.length).toBe(1);
		expect(storage.calls.registerSources[0]![0]).toHaveLength(2);
	});

	test('returns 0 synced when manifest is empty', async () => {
		const storage = createMockStorage();
		createTestManifest([]);

		const result = await syncRosetta(storage);

		expect(result.synced).toBe(0);
		expect(storage.calls.registerSources.length).toBe(0);
	});

	test('returns 0 synced when no manifest exists', async () => {
		const storage = createMockStorage();

		const result = await syncRosetta(storage);

		expect(result.synced).toBe(0);
		expect(result.skipped).toBe(false);
	});

	test('clears manifest after sync in development', async () => {
		const storage = createMockStorage();
		createTestManifest([{ text: 'Test', hash: 'abc' }]);
		const originalEnv = process.env.NODE_ENV;
		process.env.NODE_ENV = 'development';

		await syncRosetta(storage, { clearAfterSync: true });

		expect(fs.existsSync(TEST_MANIFEST_PATH)).toBe(false);
		process.env.NODE_ENV = originalEnv;
	});

	test('preserves manifest after sync when clearAfterSync is false', async () => {
		const storage = createMockStorage();
		createTestManifest([{ text: 'Test', hash: 'abc' }]);

		await syncRosetta(storage, { clearAfterSync: false });

		expect(fs.existsSync(TEST_MANIFEST_PATH)).toBe(true);
	});

	// Note: Lock tests are complex due to timing. These are simplified to test the core behavior.
	// Full distributed lock testing would require integration tests with multiple processes.

	test('acquires lock when stale lock exists', async () => {
		const storage = createMockStorage();
		createTestManifest([{ text: 'Test', hash: 'abc' }]);

		// Create a stale lock (31 seconds old - exceeds 30s timeout)
		if (!fs.existsSync(TEST_MANIFEST_DIR)) {
			fs.mkdirSync(TEST_MANIFEST_DIR, { recursive: true });
		}
		fs.writeFileSync(
			TEST_LOCK_PATH,
			JSON.stringify({
				pid: 99999,
				hostname: 'other-host',
				timestamp: Date.now() - 31000,
			})
		);

		const result = await syncRosetta(storage);

		expect(result.lockAcquired).toBe(true);
		expect(result.synced).toBe(1);
	});

	test('force sync works even with stale lock', async () => {
		const storage = createMockStorage();
		createTestManifest([{ text: 'Test', hash: 'abc' }]);

		// Create a stale lock
		if (!fs.existsSync(TEST_MANIFEST_DIR)) {
			fs.mkdirSync(TEST_MANIFEST_DIR, { recursive: true });
		}
		fs.writeFileSync(
			TEST_LOCK_PATH,
			JSON.stringify({
				pid: 99999,
				hostname: 'other-host',
				timestamp: Date.now() - 31000,
			})
		);

		const result = await syncRosetta(storage, { forceLock: true });

		// Should succeed (stale lock gets cleaned up)
		expect(result.synced).toBe(1);
	});
});

// ============================================
// Manifest Validation Tests
// ============================================

describe('manifest validation', () => {
	test('skips invalid entries', async () => {
		const storage = createMockStorage();
		createTestManifest([
			{ text: 'Valid', hash: 'abc' },
			{ text: '', hash: 'def' }, // Invalid: empty text
			{ text: 'Also Valid', hash: 'ghi' },
		] as any);

		const result = await syncRosetta(storage);

		// Should only sync valid entries
		expect(result.synced).toBe(2);
	});

	test('handles duplicate hashes', async () => {
		const storage = createMockStorage();
		createTestManifest([
			{ text: 'First', hash: 'same' },
			{ text: 'First', hash: 'same' }, // Duplicate (same text)
			{ text: 'Second', hash: 'different' },
		]);

		const result = await syncRosetta(storage);

		// Should deduplicate
		expect(result.synced).toBe(2);
	});

	test('handles malformed JSON gracefully', async () => {
		const storage = createMockStorage();
		if (!fs.existsSync(TEST_MANIFEST_DIR)) {
			fs.mkdirSync(TEST_MANIFEST_DIR, { recursive: true });
		}
		fs.writeFileSync(TEST_MANIFEST_PATH, 'not valid json {{{');

		const result = await syncRosetta(storage);

		expect(result.synced).toBe(0);
		expect(result.skipped).toBe(false);
	});

	test('handles manifest that is not an array', async () => {
		const storage = createMockStorage();
		if (!fs.existsSync(TEST_MANIFEST_DIR)) {
			fs.mkdirSync(TEST_MANIFEST_DIR, { recursive: true });
		}
		fs.writeFileSync(TEST_MANIFEST_PATH, JSON.stringify({ key: 'value' }));

		const result = await syncRosetta(storage);

		expect(result.synced).toBe(0);
	});
});

// ============================================
// withRosetta Tests
// ============================================

describe('withRosetta', () => {
	test('adds turbopack rules', () => {
		const config = withRosetta({});

		expect(config.turbopack).toBeDefined();
		expect(config.turbopack.rules['*.tsx']).toBeDefined();
		expect(config.turbopack.rules['*.ts']).toBeDefined();
	});

	test('preserves existing config', () => {
		const config = withRosetta({
			reactStrictMode: true,
			experimental: { foo: true },
		});

		expect(config.reactStrictMode).toBe(true);
		expect(config.experimental.foo).toBe(true);
	});

	test('preserves existing turbopack rules', () => {
		const config = withRosetta({
			turbopack: {
				rules: {
					'*.svg': { loaders: ['svg-loader'] },
				},
			},
		});

		expect(config.turbopack.rules['*.svg']).toBeDefined();
		expect(config.turbopack.rules['*.tsx']).toBeDefined();
	});

	test('adds webpack loader', () => {
		const config = withRosetta({});
		const mockConfig = { module: { rules: [] as unknown[] } };

		config.webpack(mockConfig, {});

		expect(mockConfig.module.rules.length).toBe(1);
		expect((mockConfig.module.rules[0] as any).test.toString()).toContain('tsx');
	});

	test('calls existing webpack config', () => {
		let existingWebpackCalled = false;
		const config = withRosetta({
			webpack: (cfg: unknown) => {
				existingWebpackCalled = true;
				return cfg;
			},
		});

		const mockConfig = { module: { rules: [] as unknown[] } };
		config.webpack(mockConfig, {});

		expect(existingWebpackCalled).toBe(true);
	});
});
