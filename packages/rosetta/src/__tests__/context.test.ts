/**
 * Tests for server/context.ts - Additional coverage tests
 *
 * Note: Most context functions are already tested in server.test.ts.
 * This file adds coverage for edge cases and less-tested paths.
 *
 * @module
 */

import { describe, expect, it } from 'bun:test';
import {
	buildLocaleChain,
	flushCollectedStrings,
	getDefaultLocale,
	getLocale,
	getLocaleChain,
	getRosettaContext,
	getTranslations,
	getTranslationsForClient,
	isInsideRosettaContext,
	isValidLocale,
	runWithRosetta,
	scheduleFlush,
	t,
} from '../server/context';

// ============================================
// getRosettaContext
// ============================================

describe('getRosettaContext', () => {
	it('returns undefined when outside context', () => {
		expect(getRosettaContext()).toBeUndefined();
	});

	it('returns context when inside runWithRosetta', () => {
		let context: ReturnType<typeof getRosettaContext>;
		runWithRosetta(
			{
				locale: 'zh-TW',
				defaultLocale: 'en',
				translations: new Map([['hash1', '翻譯']]),
			},
			() => {
				context = getRosettaContext();
			}
		);

		expect(context).toBeDefined();
		expect(context?.locale).toBe('zh-TW');
		expect(context?.defaultLocale).toBe('en');
		expect(context?.initialized).toBe(true);
	});
});

// ============================================
// isInsideRosettaContext
// ============================================

describe('isInsideRosettaContext', () => {
	it('returns false when outside context', () => {
		expect(isInsideRosettaContext()).toBe(false);
	});

	it('returns true when inside context', () => {
		let result = false;
		runWithRosetta(
			{
				locale: 'en',
				defaultLocale: 'en',
				translations: new Map(),
			},
			() => {
				result = isInsideRosettaContext();
			}
		);

		expect(result).toBe(true);
	});
});

// ============================================
// buildLocaleChain - Additional cases
// ============================================

describe('buildLocaleChain - additional cases', () => {
	it('handles locale with script tag', () => {
		const chain = buildLocaleChain('zh-Hant-TW', 'en');
		// Note: Current implementation only handles first dash
		expect(chain[0]).toBe('zh-Hant-TW');
		expect(chain).toContain('en');
	});

	it('handles when parent locale equals default', () => {
		const chain = buildLocaleChain('en-GB', 'en');
		expect(chain).toEqual(['en-GB', 'en']);
	});

	it('handles three-letter language codes', () => {
		const chain = buildLocaleChain('yue-HK', 'en');
		expect(chain[0]).toBe('yue-HK');
		expect(chain).toContain('yue');
		expect(chain).toContain('en');
	});
});

// ============================================
// isValidLocale - Additional cases
// ============================================

describe('isValidLocale - additional cases', () => {
	it('validates lowercase script codes', () => {
		expect(isValidLocale('zh-hans')).toBe(true);
		expect(isValidLocale('zh-hant')).toBe(true);
	});

	it('rejects three-letter codes (not in basic pattern)', () => {
		expect(isValidLocale('yue')).toBe(false);
	});

	it('rejects multiple segments', () => {
		expect(isValidLocale('zh-Hant-TW')).toBe(false);
	});

	it('rejects numeric codes in basic locale', () => {
		expect(isValidLocale('123')).toBe(false);
	});
});

// ============================================
// runWithRosetta - Additional cases
// ============================================

describe('runWithRosetta - additional cases', () => {
	it('returns value from callback', () => {
		const result = runWithRosetta(
			{
				locale: 'en',
				defaultLocale: 'en',
				translations: new Map(),
			},
			() => {
				return 'test result';
			}
		);

		expect(result).toBe('test result');
	});

	it('uses provided localeChain if given', () => {
		let capturedChain: string[] = [];
		runWithRosetta(
			{
				locale: 'zh-TW',
				defaultLocale: 'en',
				localeChain: ['zh-TW', 'zh-Hant', 'zh', 'en'],
				translations: new Map(),
			},
			() => {
				capturedChain = getLocaleChain();
			}
		);

		expect(capturedChain).toEqual(['zh-TW', 'zh-Hant', 'zh', 'en']);
	});

	it('builds localeChain if not provided', () => {
		let capturedChain: string[] = [];
		runWithRosetta(
			{
				locale: 'pt-BR',
				defaultLocale: 'en',
				translations: new Map(),
			},
			() => {
				capturedChain = getLocaleChain();
			}
		);

		expect(capturedChain).toEqual(['pt-BR', 'pt', 'en']);
	});

	it('passes storage to context', () => {
		const mockStorage = { test: true };
		let capturedStorage: unknown;

		runWithRosetta(
			{
				locale: 'en',
				defaultLocale: 'en',
				translations: new Map(),
				storage: mockStorage as never,
			},
			() => {
				capturedStorage = getRosettaContext()?.storage;
			}
		);

		expect(capturedStorage).toBe(mockStorage);
	});
});

// ============================================
// Legacy exports (deprecated, no-op)
// ============================================

describe('legacy exports', () => {
	it('flushCollectedStrings is a no-op', async () => {
		// Should not throw and return undefined
		const result = await flushCollectedStrings();
		expect(result).toBeUndefined();
	});

	it('scheduleFlush is a no-op', () => {
		// Should not throw
		expect(() => scheduleFlush()).not.toThrow();
	});
});

// ============================================
// Context accessors - Edge cases
// ============================================

describe('context accessors - edge cases', () => {
	it('getLocale returns default when outside context', () => {
		expect(getLocale()).toBe('en');
	});

	it('getDefaultLocale returns default when outside context', () => {
		expect(getDefaultLocale()).toBe('en');
	});

	it('getLocaleChain returns default chain when outside context', () => {
		expect(getLocaleChain()).toEqual(['en']);
	});

	it('getTranslations returns empty map when outside context', () => {
		expect(getTranslations()).toEqual(new Map());
	});

	it('getTranslationsForClient returns empty object when outside context', () => {
		expect(getTranslationsForClient()).toEqual({});
	});
});

// ============================================
// t() function - Additional cases
// ============================================

describe('t() function - additional cases', () => {
	it('handles context option', () => {
		// Using context in options form
		runWithRosetta(
			{
				locale: 'en',
				defaultLocale: 'en',
				translations: new Map(),
			},
			() => {
				const result = t('Submit', { context: 'form' });
				expect(result).toBe('Submit');
			}
		);
	});

	it('handles params in options form', () => {
		runWithRosetta(
			{
				locale: 'en',
				defaultLocale: 'en',
				translations: new Map(),
			},
			() => {
				const result = t('Hello {name}', { params: { name: 'World' } });
				expect(result).toBe('Hello World');
			}
		);
	});

	it('handles context and params together', () => {
		runWithRosetta(
			{
				locale: 'en',
				defaultLocale: 'en',
				translations: new Map(),
			},
			() => {
				const result = t('Hello {name}', { context: 'greeting', params: { name: 'World' } });
				expect(result).toBe('Hello World');
			}
		);
	});

	it('uses translation when available for non-default locale', () => {
		const translations = new Map([['35ddf285', '你好世界']]); // hash of "Hello World"

		runWithRosetta(
			{
				locale: 'zh-TW',
				defaultLocale: 'en',
				translations,
			},
			() => {
				const result = t('Hello World');
				expect(result).toBe('你好世界');
			}
		);
	});

	it('falls back to source when translation not found', () => {
		runWithRosetta(
			{
				locale: 'zh-TW',
				defaultLocale: 'en',
				translations: new Map(), // Empty translations
			},
			() => {
				const result = t('Hello World');
				expect(result).toBe('Hello World');
			}
		);
	});

	it('returns source for default locale even with translations', () => {
		const translations = new Map([['35ddf285', '你好世界']]);

		runWithRosetta(
			{
				locale: 'en', // Same as default
				defaultLocale: 'en',
				translations,
			},
			() => {
				const result = t('Hello World');
				expect(result).toBe('Hello World');
			}
		);
	});

	it('handles ICU plural in non-default locale', () => {
		const translations = new Map([
			['a1b2c3d4', '{count, plural, one {# 個項目} other {# 個項目}}'],
		]);

		runWithRosetta(
			{
				locale: 'zh-TW',
				defaultLocale: 'en',
				translations,
			},
			() => {
				// Note: This won't use the translated ICU because hash won't match
				// But it tests the ICU formatting path
				const result = t('{count, plural, one {# item} other {# items}}', { count: 5 });
				expect(result).toBe('5 items');
			}
		);
	});
});

// ============================================
// t() parseTranslateOptions edge cases
// ============================================

describe('t() parseTranslateOptions', () => {
	it('treats object with only context as TranslateOptions', () => {
		runWithRosetta(
			{
				locale: 'en',
				defaultLocale: 'en',
				translations: new Map(),
			},
			() => {
				const result = t('Test', { context: 'button' });
				expect(result).toBe('Test');
			}
		);
	});

	it('treats object with only params as TranslateOptions', () => {
		runWithRosetta(
			{
				locale: 'en',
				defaultLocale: 'en',
				translations: new Map(),
			},
			() => {
				const result = t('Hello {name}', { params: { name: 'Test' } });
				expect(result).toBe('Hello Test');
			}
		);
	});

	it('treats object with other keys as direct params', () => {
		runWithRosetta(
			{
				locale: 'en',
				defaultLocale: 'en',
				translations: new Map(),
			},
			() => {
				// { name: 'Test' } has keys that aren't 'context' or 'params'
				// so it's treated as direct params
				const result = t('Hello {name}', { name: 'Direct' });
				expect(result).toBe('Hello Direct');
			}
		);
	});

	it('handles empty options object', () => {
		runWithRosetta(
			{
				locale: 'en',
				defaultLocale: 'en',
				translations: new Map(),
			},
			() => {
				// Empty object has no keys, so every key passes the check (vacuous truth)
				// and it's treated as TranslateOptions
				const result = t('Hello', {});
				expect(result).toBe('Hello');
			}
		);
	});
});
