/**
 * Tests for schema.ts - Drizzle schema helpers
 *
 * @module
 */

import { describe, expect, it } from 'bun:test';
import {
	createRosettaSchema,
	createRosettaSchemaMySQL,
	createRosettaSchemaSQLite,
	mysqlRosettaSchema,
	pgRosettaSchema,
	sqliteRosettaSchema,
} from '../schema';

// ============================================
// PostgreSQL Schema
// ============================================

describe('PostgreSQL Schema', () => {
	it('exports default pgRosettaSchema', () => {
		expect(pgRosettaSchema).toBeDefined();
		expect(pgRosettaSchema.rosettaSources).toBeDefined();
		expect(pgRosettaSchema.rosettaTranslations).toBeDefined();
	});

	it('createRosettaSchema() returns default schema without options', () => {
		const schema = createRosettaSchema();
		expect(schema).toBe(pgRosettaSchema);
	});

	it('createRosettaSchema() returns default schema with default table names', () => {
		const schema = createRosettaSchema({
			sourcesTable: 'rosetta_sources',
			translationsTable: 'rosetta_translations',
		});
		expect(schema).toBe(pgRosettaSchema);
	});

	it('createRosettaSchema() creates custom schema with custom source table name', () => {
		const schema = createRosettaSchema({
			sourcesTable: 'i18n_sources',
		});
		// Should return new schema, not the static one
		expect(schema).not.toBe(pgRosettaSchema);
		expect(schema.rosettaSources).toBeDefined();
		expect(schema.rosettaTranslations).toBeDefined();
	});

	it('createRosettaSchema() creates custom schema with custom translation table name', () => {
		const schema = createRosettaSchema({
			translationsTable: 'i18n_translations',
		});
		expect(schema).not.toBe(pgRosettaSchema);
		expect(schema.rosettaSources).toBeDefined();
		expect(schema.rosettaTranslations).toBeDefined();
	});

	it('createRosettaSchema() creates custom schema with both custom table names', () => {
		const schema = createRosettaSchema({
			sourcesTable: 'custom_sources',
			translationsTable: 'custom_translations',
		});
		expect(schema).not.toBe(pgRosettaSchema);
		expect(schema.rosettaSources).toBeDefined();
		expect(schema.rosettaTranslations).toBeDefined();
	});
});

// ============================================
// SQLite Schema
// ============================================

describe('SQLite Schema', () => {
	it('exports default sqliteRosettaSchema', () => {
		expect(sqliteRosettaSchema).toBeDefined();
		expect(sqliteRosettaSchema.rosettaSources).toBeDefined();
		expect(sqliteRosettaSchema.rosettaTranslations).toBeDefined();
	});

	it('createRosettaSchemaSQLite() returns default schema without options', () => {
		const schema = createRosettaSchemaSQLite();
		expect(schema).toBe(sqliteRosettaSchema);
	});

	it('createRosettaSchemaSQLite() returns default schema with default table names', () => {
		const schema = createRosettaSchemaSQLite({
			sourcesTable: 'rosetta_sources',
			translationsTable: 'rosetta_translations',
		});
		expect(schema).toBe(sqliteRosettaSchema);
	});

	it('createRosettaSchemaSQLite() creates custom schema with custom source table name', () => {
		const schema = createRosettaSchemaSQLite({
			sourcesTable: 'i18n_sources',
		});
		expect(schema).not.toBe(sqliteRosettaSchema);
		expect(schema.rosettaSources).toBeDefined();
		expect(schema.rosettaTranslations).toBeDefined();
	});

	it('createRosettaSchemaSQLite() creates custom schema with custom translation table name', () => {
		const schema = createRosettaSchemaSQLite({
			translationsTable: 'i18n_translations',
		});
		expect(schema).not.toBe(sqliteRosettaSchema);
		expect(schema.rosettaSources).toBeDefined();
		expect(schema.rosettaTranslations).toBeDefined();
	});

	it('createRosettaSchemaSQLite() creates custom schema with both custom table names', () => {
		const schema = createRosettaSchemaSQLite({
			sourcesTable: 'custom_sources',
			translationsTable: 'custom_translations',
		});
		expect(schema).not.toBe(sqliteRosettaSchema);
		expect(schema.rosettaSources).toBeDefined();
		expect(schema.rosettaTranslations).toBeDefined();
	});
});

// ============================================
// MySQL Schema
// ============================================

describe('MySQL Schema', () => {
	it('exports default mysqlRosettaSchema', () => {
		expect(mysqlRosettaSchema).toBeDefined();
		expect(mysqlRosettaSchema.rosettaSources).toBeDefined();
		expect(mysqlRosettaSchema.rosettaTranslations).toBeDefined();
	});

	it('createRosettaSchemaMySQL() returns default schema without options', () => {
		const schema = createRosettaSchemaMySQL();
		expect(schema).toBe(mysqlRosettaSchema);
	});

	it('createRosettaSchemaMySQL() returns default schema with default table names', () => {
		const schema = createRosettaSchemaMySQL({
			sourcesTable: 'rosetta_sources',
			translationsTable: 'rosetta_translations',
		});
		expect(schema).toBe(mysqlRosettaSchema);
	});

	it('createRosettaSchemaMySQL() creates custom schema with custom source table name', () => {
		const schema = createRosettaSchemaMySQL({
			sourcesTable: 'i18n_sources',
		});
		expect(schema).not.toBe(mysqlRosettaSchema);
		expect(schema.rosettaSources).toBeDefined();
		expect(schema.rosettaTranslations).toBeDefined();
	});

	it('createRosettaSchemaMySQL() creates custom schema with custom translation table name', () => {
		const schema = createRosettaSchemaMySQL({
			translationsTable: 'i18n_translations',
		});
		expect(schema).not.toBe(mysqlRosettaSchema);
		expect(schema.rosettaSources).toBeDefined();
		expect(schema.rosettaTranslations).toBeDefined();
	});

	it('createRosettaSchemaMySQL() creates custom schema with both custom table names', () => {
		const schema = createRosettaSchemaMySQL({
			sourcesTable: 'custom_sources',
			translationsTable: 'custom_translations',
		});
		expect(schema).not.toBe(mysqlRosettaSchema);
		expect(schema.rosettaSources).toBeDefined();
		expect(schema.rosettaTranslations).toBeDefined();
	});
});
