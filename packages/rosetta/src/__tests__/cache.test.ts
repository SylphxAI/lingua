/**
 * Tests for cache.ts - Cache adapters
 *
 * @module
 */

import { describe, expect, it } from 'bun:test';
import {
	ExternalCache,
	InMemoryCache,
	type RedisLikeClient,
	RequestScopedCache,
	createNextCacheLoader,
} from '../cache';

// ============================================
// InMemoryCache
// ============================================

describe('InMemoryCache', () => {
	it('creates with default options', () => {
		const cache = new InMemoryCache();
		expect(cache).toBeDefined();
	});

	it('creates with custom options', () => {
		const cache = new InMemoryCache({ ttlMs: 1000, maxEntries: 10 });
		expect(cache).toBeDefined();
	});

	it('returns null for missing entries', async () => {
		const cache = new InMemoryCache();
		expect(await cache.get('en')).toBeNull();
	});

	it('stores and retrieves translations', async () => {
		const cache = new InMemoryCache();
		const translations = new Map([
			['h1', 'Hello'],
			['h2', 'World'],
		]);
		await cache.set('en', translations);

		const result = await cache.get('en');
		expect(result).toEqual(translations);
	});

	it('implements has() correctly', async () => {
		const cache = new InMemoryCache();
		expect(await cache.has('en')).toBe(false);

		await cache.set('en', new Map([['h1', 'Hello']]));
		expect(await cache.has('en')).toBe(true);
	});

	it('invalidates specific locale', async () => {
		const cache = new InMemoryCache();
		await cache.set('en', new Map([['h1', 'Hello']]));
		await cache.set('zh', new Map([['h1', '你好']]));

		await cache.invalidate('en');

		expect(await cache.has('en')).toBe(false);
		expect(await cache.has('zh')).toBe(true);
	});

	it('invalidates all locales', async () => {
		const cache = new InMemoryCache();
		await cache.set('en', new Map([['h1', 'Hello']]));
		await cache.set('zh', new Map([['h1', '你好']]));

		await cache.invalidate();

		expect(await cache.has('en')).toBe(false);
		expect(await cache.has('zh')).toBe(false);
	});

	it('evicts oldest entry at capacity', async () => {
		const cache = new InMemoryCache({ maxEntries: 2 });

		await cache.set('en', new Map([['h1', 'English']]));
		await cache.set('zh', new Map([['h1', 'Chinese']]));
		await cache.set('ja', new Map([['h1', 'Japanese']]));

		// 'en' should be evicted
		expect(await cache.has('en')).toBe(false);
		expect(await cache.has('zh')).toBe(true);
		expect(await cache.has('ja')).toBe(true);
	});

	it('implements LRU - get moves entry to end', async () => {
		const cache = new InMemoryCache({ maxEntries: 2 });

		await cache.set('en', new Map([['h1', 'English']]));
		await cache.set('zh', new Map([['h1', 'Chinese']]));

		// Access 'en' to make it recently used
		await cache.get('en');

		// Add 'ja' - should evict 'zh' (oldest), not 'en'
		await cache.set('ja', new Map([['h1', 'Japanese']]));

		expect(await cache.has('en')).toBe(true);
		expect(await cache.has('zh')).toBe(false);
		expect(await cache.has('ja')).toBe(true);
	});

	it('does not evict when updating existing entry', async () => {
		const cache = new InMemoryCache({ maxEntries: 2 });

		await cache.set('en', new Map([['h1', 'Hello']]));
		await cache.set('zh', new Map([['h1', '你好']]));

		// Update existing entry
		await cache.set('en', new Map([['h1', 'Updated']]));

		expect(await cache.has('en')).toBe(true);
		expect(await cache.has('zh')).toBe(true);
	});

	it('expires entries after TTL', async () => {
		const cache = new InMemoryCache({ ttlMs: 1 });

		await cache.set('en', new Map([['h1', 'Hello']]));

		// Wait for TTL to expire
		await new Promise((r) => setTimeout(r, 5));

		expect(await cache.get('en')).toBeNull();
	});

	it('has() returns false for expired entries', async () => {
		const cache = new InMemoryCache({ ttlMs: 1 });

		await cache.set('en', new Map([['h1', 'Hello']]));

		// Wait for TTL to expire
		await new Promise((r) => setTimeout(r, 5));

		expect(await cache.has('en')).toBe(false);
	});
});

// ============================================
// ExternalCache
// ============================================

describe('ExternalCache', () => {
	function createMockRedis(): RedisLikeClient & {
		_data: Map<string, string>;
	} {
		const data = new Map<string, string>();
		return {
			_data: data,
			async get(key: string) {
				return data.get(key) ?? null;
			},
			async set(key: string, value: string) {
				data.set(key, value);
			},
			async del(key: string | string[]) {
				if (Array.isArray(key)) {
					for (const k of key) data.delete(k);
				} else {
					data.delete(key);
				}
			},
			async keys(pattern: string) {
				const prefix = pattern.replace('*', '');
				return Array.from(data.keys()).filter((k) => k.startsWith(prefix));
			},
		};
	}

	it('creates with default options', () => {
		const redis = createMockRedis();
		const cache = new ExternalCache(redis);
		expect(cache).toBeDefined();
	});

	it('creates with custom options', () => {
		const redis = createMockRedis();
		const cache = new ExternalCache(redis, {
			prefix: 'custom:',
			ttlSeconds: 120,
		});
		expect(cache).toBeDefined();
	});

	it('returns null for missing entries', async () => {
		const redis = createMockRedis();
		const cache = new ExternalCache(redis);
		expect(await cache.get('en')).toBeNull();
	});

	it('stores and retrieves translations', async () => {
		const redis = createMockRedis();
		const cache = new ExternalCache(redis);

		const translations = new Map([
			['h1', 'Hello'],
			['h2', 'World'],
		]);
		await cache.set('en', translations);

		const result = await cache.get('en');
		expect(result?.get('h1')).toBe('Hello');
		expect(result?.get('h2')).toBe('World');
	});

	it('uses custom prefix', async () => {
		const redis = createMockRedis();
		const cache = new ExternalCache(redis, { prefix: 'myapp:' });

		await cache.set('en', new Map([['h1', 'Hello']]));

		expect(redis._data.has('myapp:en')).toBe(true);
	});

	it('implements has() correctly', async () => {
		const redis = createMockRedis();
		const cache = new ExternalCache(redis);

		expect(await cache.has('en')).toBe(false);

		await cache.set('en', new Map([['h1', 'Hello']]));
		expect(await cache.has('en')).toBe(true);
	});

	it('invalidates specific locale', async () => {
		const redis = createMockRedis();
		const cache = new ExternalCache(redis);

		await cache.set('en', new Map([['h1', 'Hello']]));
		await cache.set('zh', new Map([['h1', '你好']]));

		await cache.invalidate('en');

		expect(await cache.has('en')).toBe(false);
		expect(await cache.has('zh')).toBe(true);
	});

	it('invalidates all locales using keys()', async () => {
		const redis = createMockRedis();
		const cache = new ExternalCache(redis);

		await cache.set('en', new Map([['h1', 'Hello']]));
		await cache.set('zh', new Map([['h1', '你好']]));

		await cache.invalidate();

		expect(await cache.has('en')).toBe(false);
		expect(await cache.has('zh')).toBe(false);
	});

	it('handles invalidate when keys() not available', async () => {
		const redis = createMockRedis();
		(redis as Partial<typeof redis>).keys = undefined;
		const cache = new ExternalCache(redis);

		await cache.set('en', new Map([['h1', 'Hello']]));

		// Should not throw
		await cache.invalidate();

		// Key still exists because keys() wasn't available
		expect(await cache.has('en')).toBe(true);
	});

	it('handles get() errors gracefully', async () => {
		const redis: RedisLikeClient = {
			async get() {
				throw new Error('Redis error');
			},
			async set() {},
			async del() {},
		};
		const cache = new ExternalCache(redis);

		// Should return null instead of throwing
		expect(await cache.get('en')).toBeNull();
	});

	it('handles set() errors gracefully', async () => {
		const redis: RedisLikeClient = {
			async get() {
				return null;
			},
			async set() {
				throw new Error('Redis error');
			},
			async del() {},
		};
		const cache = new ExternalCache(redis);

		// Should not throw
		await cache.set('en', new Map([['h1', 'Hello']]));
	});

	it('handles invalidate() errors gracefully', async () => {
		const redis: RedisLikeClient = {
			async get() {
				return null;
			},
			async set() {},
			async del() {
				throw new Error('Redis error');
			},
		};
		const cache = new ExternalCache(redis);

		// Should not throw
		await cache.invalidate('en');
	});

	it('handles has() errors gracefully', async () => {
		const redis: RedisLikeClient = {
			async get() {
				throw new Error('Redis error');
			},
			async set() {},
			async del() {},
		};
		const cache = new ExternalCache(redis);

		// Should return false instead of throwing
		expect(await cache.has('en')).toBe(false);
	});

	it('handles malformed JSON in get()', async () => {
		const redis: RedisLikeClient = {
			async get() {
				return 'not valid json';
			},
			async set() {},
			async del() {},
		};
		const cache = new ExternalCache(redis);

		// Should return null for parse error
		expect(await cache.get('en')).toBeNull();
	});
});

// ============================================
// RequestScopedCache
// ============================================

describe('RequestScopedCache', () => {
	it('creates successfully', () => {
		const cache = new RequestScopedCache();
		expect(cache).toBeDefined();
	});

	it('returns result from loader on first call', async () => {
		const cache = new RequestScopedCache();
		const translations = new Map([['h1', 'Hello']]);

		const result = await cache.getOrLoad('en', async () => translations);
		expect(result).toBe(translations);
	});

	it('returns cached result on subsequent calls', async () => {
		const cache = new RequestScopedCache();
		let loadCount = 0;

		const loader = async () => {
			loadCount++;
			return new Map([['h1', `Load ${loadCount}`]]);
		};

		const result1 = await cache.getOrLoad('en', loader);
		const result2 = await cache.getOrLoad('en', loader);

		// Should only load once
		expect(loadCount).toBe(1);
		expect(result1).toBe(result2);
	});

	it('deduplicates concurrent requests', async () => {
		const cache = new RequestScopedCache();
		let loadCount = 0;

		const loader = async () => {
			loadCount++;
			await new Promise((r) => setTimeout(r, 10));
			return new Map([['h1', 'Result']]);
		};

		// Start both requests concurrently
		const [result1, result2] = await Promise.all([
			cache.getOrLoad('en', loader),
			cache.getOrLoad('en', loader),
		]);

		// Should only load once
		expect(loadCount).toBe(1);
		expect(result1).toBe(result2);
	});

	it('separates results by locale', async () => {
		const cache = new RequestScopedCache();

		const enTranslations = new Map([['h1', 'Hello']]);
		const zhTranslations = new Map([['h1', '你好']]);

		const en = await cache.getOrLoad('en', async () => enTranslations);
		const zh = await cache.getOrLoad('zh', async () => zhTranslations);

		expect(en.get('h1')).toBe('Hello');
		expect(zh.get('h1')).toBe('你好');
	});

	it('clear() removes all cached data', async () => {
		const cache = new RequestScopedCache();

		await cache.getOrLoad('en', async () => new Map([['h1', 'Hello']]));

		let loadCount = 0;
		cache.clear();

		await cache.getOrLoad('en', async () => {
			loadCount++;
			return new Map([['h1', 'World']]);
		});

		// Should load again after clear
		expect(loadCount).toBe(1);
	});
});

// ============================================
// createNextCacheLoader
// ============================================

describe('createNextCacheLoader', () => {
	it('creates a loader function', () => {
		const storage = {
			getTranslations: async (locale: string) => new Map([['h1', `${locale} translation`]]),
		};

		const loader = createNextCacheLoader(storage);
		expect(typeof loader).toBe('function');
	});

	it('loader calls storage.getTranslations', async () => {
		let calledLocale = '';
		const storage = {
			getTranslations: async (locale: string) => {
				calledLocale = locale;
				return new Map([['h1', 'Hello']]);
			},
		};

		const loader = createNextCacheLoader(storage);
		const result = await loader('en');

		expect(calledLocale).toBe('en');
		expect(result.get('h1')).toBe('Hello');
	});

	it('accepts options (for documentation, not used internally)', () => {
		const storage = {
			getTranslations: async () => new Map(),
		};

		const loader = createNextCacheLoader(storage, { revalidate: 60, tags: ['translations'] });
		expect(typeof loader).toBe('function');
	});
});
