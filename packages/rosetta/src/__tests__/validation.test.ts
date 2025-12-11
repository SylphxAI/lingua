/**
 * Tests for validation.ts
 *
 * @module
 */

import { describe, expect, it } from 'bun:test';
import {
	MAX_BATCH_SIZE,
	MAX_CONTEXT_LENGTH,
	MAX_HASH_LENGTH,
	MAX_LOCALE_LENGTH,
	MAX_TEXT_LENGTH,
	assertValidBatchSize,
	assertValidContext,
	assertValidHash,
	assertValidLocale,
	assertValidText,
	validateBatchSize,
	validateContext,
	validateHash,
	validateLocale,
	validateText,
} from '../validation';

// ============================================
// validateText
// ============================================

describe('validateText', () => {
	it('returns valid for valid strings', () => {
		expect(validateText('hello')).toEqual({ valid: true });
		expect(validateText('')).toEqual({ valid: true });
		expect(validateText('Hello, World!')).toEqual({ valid: true });
	});

	it('returns invalid for non-strings', () => {
		expect(validateText(123)).toEqual({
			valid: false,
			error: 'text must be a string',
		});
		expect(validateText(null)).toEqual({
			valid: false,
			error: 'text must be a string',
		});
		expect(validateText(undefined)).toEqual({
			valid: false,
			error: 'text must be a string',
		});
		expect(validateText({})).toEqual({
			valid: false,
			error: 'text must be a string',
		});
		expect(validateText([])).toEqual({
			valid: false,
			error: 'text must be a string',
		});
	});

	it('returns invalid for strings exceeding max length', () => {
		const longText = 'a'.repeat(MAX_TEXT_LENGTH + 1);
		const result = validateText(longText);
		expect(result.valid).toBe(false);
		expect(result.error).toContain('exceeds maximum length');
		expect(result.error).toContain(String(MAX_TEXT_LENGTH));
	});

	it('accepts strings at exactly max length', () => {
		const maxText = 'a'.repeat(MAX_TEXT_LENGTH);
		expect(validateText(maxText)).toEqual({ valid: true });
	});

	it('uses custom field name in error message', () => {
		expect(validateText(123, 'sourceText')).toEqual({
			valid: false,
			error: 'sourceText must be a string',
		});
	});
});

// ============================================
// validateLocale
// ============================================

describe('validateLocale', () => {
	it('returns valid for valid BCP 47 locales', () => {
		expect(validateLocale('en')).toEqual({ valid: true });
		expect(validateLocale('en-US')).toEqual({ valid: true });
		expect(validateLocale('zh-TW')).toEqual({ valid: true });
		expect(validateLocale('zh-Hant-TW')).toEqual({ valid: true });
		expect(validateLocale('pt-BR')).toEqual({ valid: true });
		expect(validateLocale('ja')).toEqual({ valid: true });
		expect(validateLocale('de-DE')).toEqual({ valid: true });
	});

	it('returns valid for locale with numeric region code', () => {
		expect(validateLocale('es-419')).toEqual({ valid: true }); // UN M.49 code for Latin America
	});

	it('returns invalid for non-strings', () => {
		expect(validateLocale(123)).toEqual({
			valid: false,
			error: 'locale must be a string',
		});
		expect(validateLocale(null)).toEqual({
			valid: false,
			error: 'locale must be a string',
		});
		expect(validateLocale(undefined)).toEqual({
			valid: false,
			error: 'locale must be a string',
		});
	});

	it('returns invalid for empty string', () => {
		expect(validateLocale('')).toEqual({
			valid: false,
			error: 'locale cannot be empty',
		});
	});

	it('returns invalid for strings exceeding max length', () => {
		const longLocale = 'a'.repeat(MAX_LOCALE_LENGTH + 1);
		const result = validateLocale(longLocale);
		expect(result.valid).toBe(false);
		expect(result.error).toContain('exceeds maximum length');
	});

	it('returns invalid for invalid BCP 47 formats', () => {
		expect(validateLocale('x')).toEqual({
			valid: false,
			error: 'locale "x" is not a valid BCP 47 locale code',
		});
		expect(validateLocale('english')).toEqual({
			valid: false,
			error: 'locale "english" is not a valid BCP 47 locale code',
		});
		expect(validateLocale('en_US')).toEqual({
			valid: false,
			error: 'locale "en_US" is not a valid BCP 47 locale code',
		});
		// Note: regex is case-insensitive, so these are valid
		expect(validateLocale('EN')).toEqual({ valid: true });
		expect(validateLocale('EN-US')).toEqual({ valid: true });
	});

	it('returns invalid for malformed patterns', () => {
		expect(validateLocale('en-')).toEqual({
			valid: false,
			error: 'locale "en-" is not a valid BCP 47 locale code',
		});
		expect(validateLocale('-US')).toEqual({
			valid: false,
			error: 'locale "-US" is not a valid BCP 47 locale code',
		});
		expect(validateLocale('en--US')).toEqual({
			valid: false,
			error: 'locale "en--US" is not a valid BCP 47 locale code',
		});
		expect(validateLocale('123')).toEqual({
			valid: false,
			error: 'locale "123" is not a valid BCP 47 locale code',
		});
	});
});

// ============================================
// validateContext
// ============================================

describe('validateContext', () => {
	it('returns valid for undefined and null (optional field)', () => {
		expect(validateContext(undefined)).toEqual({ valid: true });
		expect(validateContext(null)).toEqual({ valid: true });
	});

	it('returns valid for valid strings', () => {
		expect(validateContext('button.submit')).toEqual({ valid: true });
		expect(validateContext('')).toEqual({ valid: true });
		expect(validateContext('header.navigation.menu')).toEqual({ valid: true });
	});

	it('returns invalid for non-strings (when provided)', () => {
		expect(validateContext(123)).toEqual({
			valid: false,
			error: 'context must be a string',
		});
		expect(validateContext({})).toEqual({
			valid: false,
			error: 'context must be a string',
		});
		expect(validateContext([])).toEqual({
			valid: false,
			error: 'context must be a string',
		});
	});

	it('returns invalid for strings exceeding max length', () => {
		const longContext = 'a'.repeat(MAX_CONTEXT_LENGTH + 1);
		const result = validateContext(longContext);
		expect(result.valid).toBe(false);
		expect(result.error).toContain('exceeds maximum length');
		expect(result.error).toContain(String(MAX_CONTEXT_LENGTH));
	});

	it('accepts strings at exactly max length', () => {
		const maxContext = 'a'.repeat(MAX_CONTEXT_LENGTH);
		expect(validateContext(maxContext)).toEqual({ valid: true });
	});
});

// ============================================
// validateHash
// ============================================

describe('validateHash', () => {
	it('returns valid for valid hex hashes', () => {
		expect(validateHash('a1b2c3d4')).toEqual({ valid: true });
		expect(validateHash('ABCD1234')).toEqual({ valid: true });
		expect(validateHash('test1234')).toEqual({ valid: true });
	});

	it('returns invalid for non-strings', () => {
		expect(validateHash(123)).toEqual({
			valid: false,
			error: 'hash must be a string',
		});
		expect(validateHash(null)).toEqual({
			valid: false,
			error: 'hash must be a string',
		});
		expect(validateHash(undefined)).toEqual({
			valid: false,
			error: 'hash must be a string',
		});
	});

	it('returns invalid for empty string', () => {
		expect(validateHash('')).toEqual({
			valid: false,
			error: 'hash cannot be empty',
		});
	});

	it('returns invalid for strings exceeding max length', () => {
		const longHash = 'a'.repeat(MAX_HASH_LENGTH + 1);
		const result = validateHash(longHash);
		expect(result.valid).toBe(false);
		expect(result.error).toContain('exceeds maximum length');
	});

	it('returns invalid for non-alphanumeric characters', () => {
		expect(validateHash('abc-123')).toEqual({
			valid: false,
			error: 'hash must be alphanumeric',
		});
		expect(validateHash('abc_123')).toEqual({
			valid: false,
			error: 'hash must be alphanumeric',
		});
		expect(validateHash('abc.123')).toEqual({
			valid: false,
			error: 'hash must be alphanumeric',
		});
		expect(validateHash('abc 123')).toEqual({
			valid: false,
			error: 'hash must be alphanumeric',
		});
	});
});

// ============================================
// validateBatchSize
// ============================================

describe('validateBatchSize', () => {
	it('returns valid for sizes within limit', () => {
		expect(validateBatchSize(0)).toEqual({ valid: true });
		expect(validateBatchSize(1)).toEqual({ valid: true });
		expect(validateBatchSize(100)).toEqual({ valid: true });
		expect(validateBatchSize(MAX_BATCH_SIZE)).toEqual({ valid: true });
	});

	it('returns invalid for sizes exceeding max', () => {
		const result = validateBatchSize(MAX_BATCH_SIZE + 1);
		expect(result.valid).toBe(false);
		expect(result.error).toContain('exceeds maximum');
		expect(result.error).toContain(String(MAX_BATCH_SIZE));
	});
});

// ============================================
// Assertion Helpers
// ============================================

describe('assertValidText', () => {
	it('does not throw for valid text', () => {
		expect(() => assertValidText('hello')).not.toThrow();
		expect(() => assertValidText('')).not.toThrow();
	});

	it('throws for invalid text', () => {
		expect(() => assertValidText(123)).toThrow('[rosetta] Invalid input: text must be a string');
		expect(() => assertValidText(null)).toThrow('[rosetta] Invalid input: text must be a string');
	});

	it('includes custom field name in error', () => {
		expect(() => assertValidText(123, 'sourceText')).toThrow(
			'[rosetta] Invalid input: sourceText must be a string'
		);
	});
});

describe('assertValidLocale', () => {
	it('does not throw for valid locales', () => {
		expect(() => assertValidLocale('en')).not.toThrow();
		expect(() => assertValidLocale('en-US')).not.toThrow();
	});

	it('throws for invalid locales', () => {
		expect(() => assertValidLocale('')).toThrow('[rosetta] Invalid locale: locale cannot be empty');
		expect(() => assertValidLocale(123)).toThrow(
			'[rosetta] Invalid locale: locale must be a string'
		);
		expect(() => assertValidLocale('invalid')).toThrow('[rosetta] Invalid locale:');
	});
});

describe('assertValidContext', () => {
	it('does not throw for valid context', () => {
		expect(() => assertValidContext('button.submit')).not.toThrow();
		expect(() => assertValidContext(undefined)).not.toThrow();
		expect(() => assertValidContext(null)).not.toThrow();
	});

	it('throws for invalid context', () => {
		expect(() => assertValidContext(123)).toThrow(
			'[rosetta] Invalid context: context must be a string'
		);
		const longContext = 'a'.repeat(MAX_CONTEXT_LENGTH + 1);
		expect(() => assertValidContext(longContext)).toThrow('[rosetta] Invalid context:');
	});
});

describe('assertValidHash', () => {
	it('does not throw for valid hashes', () => {
		expect(() => assertValidHash('a1b2c3d4')).not.toThrow();
		expect(() => assertValidHash('test1234')).not.toThrow();
	});

	it('throws for invalid hashes', () => {
		expect(() => assertValidHash('')).toThrow('[rosetta] Invalid hash: hash cannot be empty');
		expect(() => assertValidHash(123)).toThrow('[rosetta] Invalid hash: hash must be a string');
		expect(() => assertValidHash('abc-def')).toThrow(
			'[rosetta] Invalid hash: hash must be alphanumeric'
		);
	});
});

describe('assertValidBatchSize', () => {
	it('does not throw for valid sizes', () => {
		expect(() => assertValidBatchSize(0)).not.toThrow();
		expect(() => assertValidBatchSize(100)).not.toThrow();
		expect(() => assertValidBatchSize(MAX_BATCH_SIZE)).not.toThrow();
	});

	it('throws for invalid sizes', () => {
		expect(() => assertValidBatchSize(MAX_BATCH_SIZE + 1)).toThrow(
			'[rosetta] Invalid batch: batch size exceeds maximum'
		);
	});
});

// ============================================
// Constants
// ============================================

describe('validation constants', () => {
	it('has expected MAX_TEXT_LENGTH', () => {
		expect(MAX_TEXT_LENGTH).toBe(10 * 1024);
	});

	it('has expected MAX_LOCALE_LENGTH', () => {
		expect(MAX_LOCALE_LENGTH).toBe(35);
	});

	it('has expected MAX_CONTEXT_LENGTH', () => {
		expect(MAX_CONTEXT_LENGTH).toBe(100);
	});

	it('has expected MAX_HASH_LENGTH', () => {
		expect(MAX_HASH_LENGTH).toBe(16);
	});

	it('has expected MAX_BATCH_SIZE', () => {
		expect(MAX_BATCH_SIZE).toBe(1000);
	});
});
