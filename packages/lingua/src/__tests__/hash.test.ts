import { describe, expect, test } from 'bun:test';
import { hashText } from '../hash';

describe('hashText', () => {
	test('returns consistent hash for same input', () => {
		const hash1 = hashText('Hello World');
		const hash2 = hashText('Hello World');
		expect(hash1).toBe(hash2);
	});

	test('returns different hash for different input', () => {
		const hash1 = hashText('Hello');
		const hash2 = hashText('World');
		expect(hash1).not.toBe(hash2);
	});

	test('trims whitespace', () => {
		const hash1 = hashText('Hello');
		const hash2 = hashText('  Hello  ');
		expect(hash1).toBe(hash2);
	});

	test('returns 8-character hex string', () => {
		const hash = hashText('Test');
		expect(hash).toMatch(/^[0-9a-f]{8}$/);
	});

	test('includes context in hash when provided', () => {
		const hash1 = hashText('Submit');
		const hash2 = hashText('Submit', 'form');
		const hash3 = hashText('Submit', 'dialog');

		expect(hash1).not.toBe(hash2);
		expect(hash2).not.toBe(hash3);
		expect(hash1).not.toBe(hash3);
	});

	test('handles unicode characters', () => {
		const hash1 = hashText('你好世界');
		const hash2 = hashText('こんにちは');

		expect(hash1).toMatch(/^[0-9a-f]{8}$/);
		expect(hash2).toMatch(/^[0-9a-f]{8}$/);
		expect(hash1).not.toBe(hash2);
	});

	test('handles empty string', () => {
		const hash = hashText('');
		expect(hash).toMatch(/^[0-9a-f]{8}$/);
	});
});
