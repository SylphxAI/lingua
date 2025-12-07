import { describe, expect, test } from 'bun:test';
import {
	ALL_LOCALES,
	DEFAULT_LOCALE,
	getLocaleInfo,
	getLocaleNativeName,
	getLocaleEnglishName,
	localeNames,
} from '../locales';

describe('locales', () => {
	test('ALL_LOCALES contains expected locales', () => {
		expect(ALL_LOCALES.length).toBeGreaterThan(30);

		const codes = ALL_LOCALES.map((l) => l.code);
		expect(codes).toContain('en');
		expect(codes).toContain('zh-TW');
		expect(codes).toContain('zh-CN');
		expect(codes).toContain('ja');
		expect(codes).toContain('ko');
	});

	test('DEFAULT_LOCALE is en', () => {
		expect(DEFAULT_LOCALE).toBe('en');
	});

	test('getLocaleInfo returns correct info', () => {
		const en = getLocaleInfo('en');
		expect(en).toEqual({
			code: 'en',
			name: 'English',
			nativeName: 'English',
		});

		const zhTW = getLocaleInfo('zh-TW');
		expect(zhTW).toEqual({
			code: 'zh-TW',
			name: 'Traditional Chinese (Taiwan)',
			nativeName: '繁體中文 (台灣)',
		});
	});

	test('getLocaleInfo returns undefined for unknown locale', () => {
		expect(getLocaleInfo('xx-XX')).toBeUndefined();
	});

	test('getLocaleNativeName returns native name', () => {
		expect(getLocaleNativeName('en')).toBe('English');
		expect(getLocaleNativeName('zh-TW')).toBe('繁體中文 (台灣)');
		expect(getLocaleNativeName('ja')).toBe('日本語');
	});

	test('getLocaleNativeName returns code for unknown locale', () => {
		expect(getLocaleNativeName('xx-XX')).toBe('xx-XX');
	});

	test('getLocaleEnglishName returns English name', () => {
		expect(getLocaleEnglishName('en')).toBe('English');
		expect(getLocaleEnglishName('zh-TW')).toBe('Traditional Chinese (Taiwan)');
		expect(getLocaleEnglishName('ja')).toBe('Japanese');
	});

	test('localeNames map is correctly built', () => {
		expect(localeNames['en']).toBe('English');
		expect(localeNames['zh-TW']).toBe('繁體中文 (台灣)');
		expect(localeNames['ja']).toBe('日本語');
	});
});
