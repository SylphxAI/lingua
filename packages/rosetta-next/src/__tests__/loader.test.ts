/**
 * Rosetta Loader Tests
 *
 * Tests the t() call extraction and manifest writing functionality.
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import rosettaLoader, {
	clearManifest,
	flushManifest,
	getManifestPath,
	readManifest,
	resetLoaderState,
} from '../loader';

// ============================================
// Test Helpers
// ============================================

function getTestManifestDir(): string {
	return path.join(process.cwd(), '.rosetta-test');
}

function cleanupTestDir(): void {
	const testDir = getTestManifestDir();
	if (fs.existsSync(testDir)) {
		fs.rmSync(testDir, { recursive: true });
	}
}

// ============================================
// Test Setup
// ============================================

beforeEach(() => {
	// Set custom manifest dir for tests FIRST
	process.env.ROSETTA_MANIFEST_DIR = '.rosetta-test';

	// Reset in-memory state
	resetLoaderState();

	// Ensure clean filesystem state
	cleanupTestDir();
});

afterEach(() => {
	// Reset in-memory state
	resetLoaderState();

	// Clean filesystem
	cleanupTestDir();

	// Reset env
	delete process.env.ROSETTA_MANIFEST_DIR;
});

// ============================================
// Extract Strings Tests
// ============================================

describe('rosettaLoader', () => {
	describe('extractStrings', () => {
		test('extracts simple t() calls', () => {
			const source = `
				const message = t('Hello World');
				const greeting = t("Welcome");
			`;

			rosettaLoader(source);
			flushManifest();

			const manifest = readManifest();
			expect(manifest.length).toBe(2);
			expect(manifest.some((e) => e.text === 'Hello World')).toBe(true);
			expect(manifest.some((e) => e.text === 'Welcome')).toBe(true);
		});

		test('extracts t() calls with template literals', () => {
			const source = `const msg = t(\`Static text\`);`;

			rosettaLoader(source);
			flushManifest();

			const manifest = readManifest();
			expect(manifest.length).toBe(1);
			expect(manifest[0]!.text).toBe('Static text');
		});

		test('skips template expressions (dynamic strings)', () => {
			const source = `
				const dynamic = t(\`Hello \${name}\`);
				const static_text = t('Static');
			`;

			rosettaLoader(source);
			flushManifest();

			const manifest = readManifest();
			expect(manifest.length).toBe(1);
			expect(manifest[0]!.text).toBe('Static');
		});

		test('extracts t() calls with context', () => {
			const source = `
				const btn1 = t('Submit', { context: 'form' });
				const btn2 = t('Submit', { context: 'modal' });
			`;

			rosettaLoader(source);
			flushManifest();

			const manifest = readManifest();
			expect(manifest.length).toBe(2);
			// Different contexts should produce different hashes
			const hashes = manifest.map((e) => e.hash);
			expect(new Set(hashes).size).toBe(2);
		});

		test('deduplicates same text without context', () => {
			const source = `
				t('Hello');
				t('Hello');
				t('Hello');
			`;

			rosettaLoader(source);
			flushManifest();

			const manifest = readManifest();
			expect(manifest.length).toBe(1);
		});

		test('handles whitespace variations', () => {
			const source = `
				t( 'With spaces' );
				t('No spaces');
				t(
					'Multiline'
				);
			`;

			rosettaLoader(source);
			flushManifest();

			const manifest = readManifest();
			expect(manifest.length).toBe(3);
		});

		test('skips empty strings', () => {
			const source = `
				t('');
				t('  ');
				t('Valid');
			`;

			rosettaLoader(source);
			flushManifest();

			const manifest = readManifest();
			expect(manifest.length).toBe(1);
			expect(manifest[0]!.text).toBe('Valid');
		});

		test('handles real-world React component', () => {
			const source = `
				export function Button() {
					const t = useT();
					return (
						<button onClick={() => alert(t('Clicked!'))}>
							{t('Click me')}
						</button>
					);
				}
			`;

			rosettaLoader(source);
			flushManifest();

			const manifest = readManifest();
			expect(manifest.length).toBe(2);
			expect(manifest.some((e) => e.text === 'Clicked!')).toBe(true);
			expect(manifest.some((e) => e.text === 'Click me')).toBe(true);
		});
	});

	describe('manifest operations', () => {
		test('creates manifest directory if not exists', () => {
			rosettaLoader(`t('Test')`);
			flushManifest();

			expect(fs.existsSync(getTestManifestDir())).toBe(true);
			expect(fs.existsSync(getManifestPath())).toBe(true);
		});

		test('clearManifest removes manifest file', () => {
			rosettaLoader(`t('Test')`);
			flushManifest();

			expect(fs.existsSync(getManifestPath())).toBe(true);

			clearManifest();

			expect(fs.existsSync(getManifestPath())).toBe(false);
		});

		test('readManifest returns empty array when no manifest', () => {
			const manifest = readManifest();
			expect(manifest).toEqual([]);
		});

		test('readManifest returns valid entries', () => {
			rosettaLoader(`t('Entry 1')`);
			rosettaLoader(`t('Entry 2')`);
			flushManifest();

			const manifest = readManifest();
			expect(manifest.length).toBe(2);
		});

		test('merges with existing manifest on write', () => {
			// First batch
			rosettaLoader(`t('First')`);
			flushManifest();

			// Second batch (should merge, not overwrite)
			rosettaLoader(`t('Second')`);
			flushManifest();

			const manifest = readManifest();
			expect(manifest.length).toBe(2);
			expect(manifest.some((e) => e.text === 'First')).toBe(true);
			expect(manifest.some((e) => e.text === 'Second')).toBe(true);
		});
	});

	describe('edge cases', () => {
		test('handles Unicode text', () => {
			const source = `
				t('你好世界');
				t('مرحبا بالعالم');
				t('🎉 Emoji');
			`;

			rosettaLoader(source);
			flushManifest();

			const manifest = readManifest();
			expect(manifest.length).toBe(3);
			expect(manifest.some((e) => e.text === '你好世界')).toBe(true);
		});

		test('extracts double-quoted strings', () => {
			const source = `
				const msg1 = t("Double quoted");
				const msg2 = t("Another double quoted");
			`;

			rosettaLoader(source);
			flushManifest();

			const manifest = readManifest();
			expect(manifest.length).toBe(2);
			expect(manifest.some((e) => e.text === 'Double quoted')).toBe(true);
			expect(manifest.some((e) => e.text === 'Another double quoted')).toBe(true);
		});

		test('returns source unchanged', () => {
			const source = `const x = t('Test');`;
			const result = rosettaLoader(source);
			expect(result).toBe(source);
		});

		test('handles files without t() calls efficiently', () => {
			const source = `
				const x = 1;
				const y = 2;
				console.log(x + y);
			`;

			rosettaLoader(source);
			flushManifest();

			const manifest = readManifest();
			expect(manifest.length).toBe(0);
		});

		test('handles params object without context', () => {
			const source = `
				t('Hello {name}', { name: 'World' });
				t('Count: {count}', { count: 5 });
			`;

			rosettaLoader(source);
			flushManifest();

			// Should extract the strings but not confuse params with context
			const manifest = readManifest();
			expect(manifest.some((e) => e.text === 'Hello {name}')).toBe(true);
		});
	});
});

// ============================================
// Security Tests
// ============================================

describe('loader security', () => {
	test('rejects path traversal in manifest dir - does not create manifest', () => {
		process.env.ROSETTA_MANIFEST_DIR = '../outside';

		rosettaLoader(`t('Test')`);
		flushManifest(); // Error is caught and logged, but manifest should not be created

		// Verify no manifest was created in the dangerous location
		const dangerousPath = path.join(process.cwd(), '..', 'outside', 'manifest.json');
		expect(fs.existsSync(dangerousPath)).toBe(false);
	});

	test('rejects absolute paths in manifest dir - does not create manifest', () => {
		process.env.ROSETTA_MANIFEST_DIR = '/tmp/rosetta-test-security';

		rosettaLoader(`t('Test')`);
		flushManifest(); // Error is caught and logged, but manifest should not be created

		// Verify no manifest was created in the dangerous location
		expect(fs.existsSync('/tmp/rosetta-test-security/manifest.json')).toBe(false);
	});
});
