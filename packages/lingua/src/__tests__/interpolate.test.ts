import { describe, expect, test } from 'bun:test';
import { interpolate } from '../interpolate';

describe('interpolate', () => {
	test('returns original text when no params', () => {
		expect(interpolate('Hello World')).toBe('Hello World');
	});

	test('returns original text when params is undefined', () => {
		expect(interpolate('Hello World', undefined)).toBe('Hello World');
	});

	test('replaces single placeholder', () => {
		expect(interpolate('Hello {name}', { name: 'World' })).toBe('Hello World');
	});

	test('replaces multiple placeholders', () => {
		expect(interpolate('{greeting} {name}!', { greeting: 'Hello', name: 'World' })).toBe(
			'Hello World!'
		);
	});

	test('replaces same placeholder multiple times', () => {
		expect(interpolate('{name} and {name}', { name: 'John' })).toBe('John and John');
	});

	test('handles number values', () => {
		expect(interpolate('You have {count} items', { count: 5 })).toBe('You have 5 items');
	});

	test('leaves unmatched placeholders', () => {
		expect(interpolate('Hello {name}', {})).toBe('Hello {name}');
	});

	test('handles empty params object', () => {
		expect(interpolate('Hello {name}', {})).toBe('Hello {name}');
	});

	test('handles special regex characters in values', () => {
		expect(interpolate('Price: {price}', { price: '$100' })).toBe('Price: $100');
	});
});
