---
"@sylphx/rosetta-drizzle": minor
"@sylphx/rosetta": minor
"@sylphx/rosetta-next": minor
---

refactor: Improve type safety, add validation, and comprehensive testing

**@sylphx/rosetta:**
- New `@sylphx/rosetta/icu` entry point for shared ICU MessageFormat implementation
- New validation module with input size limits (10KB max text, 1000 batch size)
- Exports: `validateText`, `validateLocale`, `assertValidText`, etc.
- Consistent security limits across server/client (depth=5, length=50KB, iterations=100)
- Server uses 50-entry LRU cache, client uses 10-entry cache
- OpenRouter adapter now has configurable timeout (default 30s)

**@sylphx/rosetta-drizzle:**
- Generic type parameters for tables (`DrizzleStorageAdapter<S, T>`)
- Runtime validation for required columns at construction time
- New type exports: `DrizzleQueryBuilder`, `SourcesTable`, `TranslationsTable`
- Fix: `registerSources` now correctly increments occurrences for existing sources
- 34 comprehensive tests with bun:sqlite in-memory database

**@sylphx/rosetta-next:**
- `MANIFEST_DIR` now reads env at runtime (testability improvement)
- 36 comprehensive tests for loader extraction and sync functionality
- Tests cover: t() extraction, manifest ops, sync to storage, lock handling
