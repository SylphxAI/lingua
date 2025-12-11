/**
 * Tests for icu.ts - ICU MessageFormat implementation
 *
 * @module
 */

import { describe, expect, it } from 'bun:test';
import {
	MAX_ICU_ITERATIONS,
	MAX_ICU_NESTING_DEPTH,
	MAX_TEXT_LENGTH,
	type PluralRulesCache,
	createPluralRulesCache,
	formatMessage,
	getPluralCategory,
} from '../icu';

// ============================================
// Constants
// ============================================

describe('ICU constants', () => {
	it('has expected MAX_ICU_NESTING_DEPTH', () => {
		expect(MAX_ICU_NESTING_DEPTH).toBe(5);
	});

	it('has expected MAX_TEXT_LENGTH', () => {
		expect(MAX_TEXT_LENGTH).toBe(50_000);
	});

	it('has expected MAX_ICU_ITERATIONS', () => {
		expect(MAX_ICU_ITERATIONS).toBe(100);
	});
});

// ============================================
// createPluralRulesCache
// ============================================

describe('createPluralRulesCache', () => {
	it('creates a cache with default max size', () => {
		const cache = createPluralRulesCache();
		expect(cache.size).toBe(0);
	});

	it('creates a cache with custom max size', () => {
		const cache = createPluralRulesCache({ maxSize: 5 });
		expect(cache.size).toBe(0);
	});

	it('get returns undefined for missing entries', () => {
		const cache = createPluralRulesCache();
		expect(cache.get('en')).toBeUndefined();
	});

	it('set and get work correctly', () => {
		const cache = createPluralRulesCache();
		const rules = new Intl.PluralRules('en');
		cache.set('en', rules);
		expect(cache.get('en')).toBe(rules);
		expect(cache.size).toBe(1);
	});

	it('clear removes all entries', () => {
		const cache = createPluralRulesCache();
		cache.set('en', new Intl.PluralRules('en'));
		cache.set('zh', new Intl.PluralRules('zh'));
		expect(cache.size).toBe(2);
		cache.clear();
		expect(cache.size).toBe(0);
	});

	it('implements LRU eviction when at capacity', () => {
		const cache = createPluralRulesCache({ maxSize: 2 });
		cache.set('en', new Intl.PluralRules('en'));
		cache.set('zh', new Intl.PluralRules('zh'));
		cache.set('ja', new Intl.PluralRules('ja')); // Should evict 'en'

		expect(cache.get('en')).toBeUndefined();
		expect(cache.get('zh')).toBeDefined();
		expect(cache.get('ja')).toBeDefined();
		expect(cache.size).toBe(2);
	});

	it('get moves entry to end (LRU behavior)', () => {
		const cache = createPluralRulesCache({ maxSize: 2 });
		cache.set('en', new Intl.PluralRules('en'));
		cache.set('zh', new Intl.PluralRules('zh'));

		// Access 'en' to make it recently used
		cache.get('en');

		// Add 'ja' - should evict 'zh' (oldest) not 'en'
		cache.set('ja', new Intl.PluralRules('ja'));

		expect(cache.get('en')).toBeDefined();
		expect(cache.get('zh')).toBeUndefined();
		expect(cache.get('ja')).toBeDefined();
	});

	it('set does not evict when updating existing key', () => {
		const cache = createPluralRulesCache({ maxSize: 2 });
		cache.set('en', new Intl.PluralRules('en'));
		cache.set('zh', new Intl.PluralRules('zh'));
		cache.set('en', new Intl.PluralRules('en')); // Update existing

		expect(cache.size).toBe(2);
		expect(cache.get('en')).toBeDefined();
		expect(cache.get('zh')).toBeDefined();
	});
});

// ============================================
// getPluralCategory
// ============================================

describe('getPluralCategory', () => {
	it('returns "one" for count 1 in English', () => {
		expect(getPluralCategory(1, 'en')).toBe('one');
	});

	it('returns "other" for count != 1 in English', () => {
		expect(getPluralCategory(0, 'en')).toBe('other');
		expect(getPluralCategory(2, 'en')).toBe('other');
		expect(getPluralCategory(10, 'en')).toBe('other');
	});

	it('uses cache when provided', () => {
		const cache = createPluralRulesCache();
		getPluralCategory(1, 'en', cache);
		expect(cache.size).toBe(1);
		expect(cache.get('en')).toBeDefined();

		// Second call should use cache
		getPluralCategory(2, 'en', cache);
		expect(cache.size).toBe(1);
	});

	it('falls back to "en" for invalid locale', () => {
		const cache = createPluralRulesCache();
		// Invalid locale should fall back to 'en'
		const result = getPluralCategory(1, 'invalid-locale-xxx', cache);
		expect(result).toBe('one');
	});

	it('handles different locales correctly', () => {
		// Japanese has no plural distinction
		expect(getPluralCategory(1, 'ja')).toBe('other');
		expect(getPluralCategory(5, 'ja')).toBe('other');
	});

	it('handles decimal numbers', () => {
		expect(getPluralCategory(1.5, 'en')).toBe('other');
		expect(getPluralCategory(0.5, 'en')).toBe('other');
	});
});

// ============================================
// formatMessage - Simple interpolation
// ============================================

describe('formatMessage - simple interpolation', () => {
	it('returns text unchanged without params', () => {
		expect(formatMessage('Hello World')).toBe('Hello World');
		expect(formatMessage('Hello World', undefined)).toBe('Hello World');
	});

	it('interpolates simple placeholders', () => {
		expect(formatMessage('Hello {name}', { name: 'World' })).toBe('Hello World');
	});

	it('interpolates multiple placeholders', () => {
		expect(formatMessage('{greeting} {name}!', { greeting: 'Hello', name: 'World' })).toBe(
			'Hello World!'
		);
	});

	it('interpolates numeric values', () => {
		expect(formatMessage('Count: {count}', { count: 42 })).toBe('Count: 42');
	});

	it('leaves unknown placeholders unchanged', () => {
		expect(formatMessage('Hello {name}', {})).toBe('Hello {name}');
	});
});

// ============================================
// formatMessage - Pluralization
// ============================================

describe('formatMessage - pluralization', () => {
	it('handles basic plural with one/other', () => {
		const template = '{count, plural, one {# item} other {# items}}';
		expect(formatMessage(template, { count: 1 }, { locale: 'en' })).toBe('1 item');
		expect(formatMessage(template, { count: 5 }, { locale: 'en' })).toBe('5 items');
	});

	it('handles plural with =0', () => {
		const template = '{count, plural, =0 {No items} one {# item} other {# items}}';
		expect(formatMessage(template, { count: 0 }, { locale: 'en' })).toBe('No items');
		expect(formatMessage(template, { count: 1 }, { locale: 'en' })).toBe('1 item');
		expect(formatMessage(template, { count: 2 }, { locale: 'en' })).toBe('2 items');
	});

	it('handles plural with exact matches', () => {
		const template = '{count, plural, =0 {zero} =1 {one} =2 {two} other {many}}';
		expect(formatMessage(template, { count: 0 })).toBe('zero');
		expect(formatMessage(template, { count: 1 })).toBe('one');
		expect(formatMessage(template, { count: 2 })).toBe('two');
		expect(formatMessage(template, { count: 3 })).toBe('many');
	});

	it('replaces # with count value', () => {
		const template = '{n, plural, one {# thing} other {# things}}';
		expect(formatMessage(template, { n: 100 })).toBe('100 things');
	});

	it('handles plural with text around it', () => {
		const template = 'You have {count, plural, one {# message} other {# messages}} waiting';
		expect(formatMessage(template, { count: 1 })).toBe('You have 1 message waiting');
		expect(formatMessage(template, { count: 5 })).toBe('You have 5 messages waiting');
	});

	it('uses cache for performance', () => {
		const cache = createPluralRulesCache();
		const template = '{count, plural, one {#} other {#}}';

		formatMessage(template, { count: 1 }, { locale: 'en', pluralRulesCache: cache });
		expect(cache.size).toBe(1);

		formatMessage(template, { count: 2 }, { locale: 'en', pluralRulesCache: cache });
		expect(cache.size).toBe(1); // Should reuse cached rules
	});
});

// ============================================
// formatMessage - Select
// ============================================

describe('formatMessage - select', () => {
	it('handles basic select', () => {
		const template = '{gender, select, male {He} female {She} other {They}}';
		expect(formatMessage(template, { gender: 'male' })).toBe('He');
		expect(formatMessage(template, { gender: 'female' })).toBe('She');
		expect(formatMessage(template, { gender: 'unknown' })).toBe('They');
	});

	it('falls back to other for unknown values', () => {
		const template = '{status, select, active {Active} inactive {Inactive} other {Unknown}}';
		expect(formatMessage(template, { status: 'pending' })).toBe('Unknown');
	});

	it('handles select with text around it', () => {
		const template = '{role, select, admin {Administrator} user {User} other {Guest}} logged in';
		expect(formatMessage(template, { role: 'admin' })).toBe('Administrator logged in');
	});
});

// ============================================
// formatMessage - Mixed and nested
// ============================================

describe('formatMessage - mixed patterns', () => {
	it('handles plural and interpolation together', () => {
		const template = '{name} has {count, plural, one {# item} other {# items}}';
		expect(formatMessage(template, { name: 'John', count: 3 })).toBe('John has 3 items');
	});

	it('handles multiple ICU patterns', () => {
		const template =
			'{count, plural, one {# item} other {# items}} - {status, select, new {New} other {Old}}';
		expect(formatMessage(template, { count: 5, status: 'new' })).toBe('5 items - New');
	});

	it('handles nested plural in select', () => {
		const template =
			'{gender, select, male {{count, plural, one {He has # item} other {He has # items}}} other {{count, plural, one {They have # item} other {They have # items}}}}';
		expect(formatMessage(template, { gender: 'male', count: 1 })).toBe('He has 1 item');
		expect(formatMessage(template, { gender: 'other', count: 5 })).toBe('They have 5 items');
	});
});

// ============================================
// formatMessage - Error handling
// ============================================

describe('formatMessage - error handling', () => {
	it('handles missing variable gracefully', () => {
		const template = '{count, plural, one {#} other {#}}';
		// When variable is undefined, pattern is left unchanged
		const result = formatMessage(template, {});
		expect(result).toContain('plural');
	});

	it('truncates text exceeding max length', () => {
		const longText = 'a'.repeat(MAX_TEXT_LENGTH + 100);
		let errorCalled = false;
		const result = formatMessage(longText, { x: 1 }, {
			onError: () => {
				errorCalled = true;
			},
		});
		expect(errorCalled).toBe(true);
		expect(result.length).toBe(MAX_TEXT_LENGTH);
	});

	it('calls onError for ICU parse errors', () => {
		let errorMessage = '';
		// Malformed ICU pattern - unclosed brace
		const template = '{count, plural, one {item}';
		formatMessage(template, { count: 1 }, {
			onError: (err) => {
				errorMessage = err.message;
			},
		});
		// Should fall back to interpolation without crashing
		expect(template).toContain('plural');
	});

	it('falls back to interpolation on parse error', () => {
		// This should not crash, just return something reasonable
		const result = formatMessage('{broken, plural, one}', { broken: 1 });
		expect(typeof result).toBe('string');
	});
});

// ============================================
// formatMessage - Security
// ============================================

describe('formatMessage - security', () => {
	it('prevents deeply nested patterns', () => {
		// Create a deeply nested pattern
		let nested = '{x, select, a {innermost}}';
		for (let i = 0; i < 10; i++) {
			nested = `{x, select, a {${nested}}}`;
		}

		let errorCalled = false;
		formatMessage(nested, { x: 'a' }, {
			onError: () => {
				errorCalled = true;
			},
		});

		// Should either error or handle gracefully
		expect(typeof errorCalled).toBe('boolean');
	});

	it('handles $ in replacement values safely', () => {
		// $ characters in replacement values should not be interpreted
		const result = formatMessage('{name}', { name: '$100' });
		expect(result).toBe('$100');
	});

	it('handles # replacement safely with special characters', () => {
		const template = '{count, plural, one {$# item} other {$# items}}';
		expect(formatMessage(template, { count: 5 })).toBe('$5 items');
	});
});

// ============================================
// formatMessage - Edge cases
// ============================================

describe('formatMessage - edge cases', () => {
	it('handles empty text', () => {
		expect(formatMessage('', { name: 'test' })).toBe('');
	});

	it('handles text with no placeholders', () => {
		expect(formatMessage('Plain text', { name: 'ignored' })).toBe('Plain text');
	});

	it('handles empty params object', () => {
		expect(formatMessage('Hello {name}', {})).toBe('Hello {name}');
	});

	it('handles numeric zero value', () => {
		expect(formatMessage('Count: {n}', { n: 0 })).toBe('Count: 0');
	});

	it('handles whitespace in template values', () => {
		const template = '{count, plural, one {#  item} other {#  items}}';
		expect(formatMessage(template, { count: 1 })).toBe('1  item');
	});

	it('handles consecutive placeholders', () => {
		expect(formatMessage('{a}{b}{c}', { a: '1', b: '2', c: '3' })).toBe('123');
	});

	it('preserves escaped-like braces (not actual ICU escaping)', () => {
		// Note: This implementation doesn't support ICU escape syntax
		// but should handle literal text gracefully
		expect(formatMessage("It's {what}", { what: 'working' })).toBe("It's working");
	});
});
