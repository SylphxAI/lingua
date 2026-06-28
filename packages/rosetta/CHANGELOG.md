# Changelog

## 0.6.0

### Minor Changes

- 3e76f72: Architecture refactor: Move server code from core to rosetta-next

  **@sylphx/rosetta** (core):

  - Now exports only pure functions with zero Node.js dependencies
  - Removed `/server` entry point
  - All builds use browser target

  **@sylphx/rosetta-next**:

  - Added `@sylphx/rosetta-next/server` entry point with all server functionality:
    - `Rosetta` class and `createRosetta()` factory
    - `t()`, `getTranslations()`, `getLocale()` via AsyncLocalStorage
    - `RosettaProvider` server component
    - Cache adapters: `InMemoryCache`, `ExternalCache`, `RequestScopedCache`
    - Locale utilities: `getReadyLocales`, `buildLocaleCookie`, etc.

  **Migration:**

  ```typescript
  // Before
  import { t, Rosetta } from "@sylphx/rosetta/server";

  // After
  import { t, createRosetta } from "@sylphx/rosetta-next/server";
  ```

  See `docs/architecture/REFACTOR_PLAN.md` for full migration guide.

## 0.5.10 (2025-12-13)

### ♻️ Refactoring

- deep cleanup and critical bug fixes (#60) ([e8ef654](https://github.com/SylphxAI/rosetta/commit/e8ef654cd2b6528fc3663d5cce680fc408223118))

## 0.5.9 (2025-12-13)

### 🐛 Bug Fixes

- **rosetta-next:** separate server and client code bundles ([646cf27](https://github.com/SylphxAI/rosetta/commit/646cf27baf1e0e748514c0ebc34e87146832c0db))

## 0.5.8 (2025-12-12)

### ♻️ Refactoring

- move server code from rosetta core to rosetta-next ([84c45a2](https://github.com/SylphxAI/rosetta/commit/84c45a2194e056f98c86bb3b1c8a7120c4a42f93))

### 🔧 Chores

- fix lint errors and import organization ([2cbd713](https://github.com/SylphxAI/rosetta/commit/2cbd713f091bdeb9027155783db7f5ca1793dc94))

## 0.5.7 (2025-12-12)

### 🐛 Bug Fixes

- **rosetta:** use target node for server build to preserve AsyncLocalStorage ([14fd99a](https://github.com/SylphxAI/rosetta/commit/14fd99ae7246bd4586b89369558f2789c4ffa4e4))

### 💅 Styles

- format package.json files ([2ac26e7](https://github.com/SylphxAI/rosetta/commit/2ac26e7827ee02ad0874dc1c2f92ec26a3a40140))

## 0.5.6 (2025-12-12)

### 🐛 Bug Fixes

- add biome-ignore comments for noExplicitAny lint errors ([dcf99d8](https://github.com/SylphxAI/rosetta/commit/dcf99d83b7ae92ba709c32a5d7e2be1cfebde137))
- resolve TypeScript type errors and exclude test files from typecheck ([46f3222](https://github.com/SylphxAI/rosetta/commit/46f32221b9c22fa82b73c37dd63880aa85c754fe))
- resolve biome lint errors ([619969b](https://github.com/SylphxAI/rosetta/commit/619969b119a2827e54d327c5bc907f585c81b442))

### 💅 Styles

- format package.json files ([f26787d](https://github.com/SylphxAI/rosetta/commit/f26787d55f657f22eb764651104feb775f7a98db))

### ✅ Tests

- add comprehensive tests to improve coverage to >95% ([ac23a71](https://github.com/SylphxAI/rosetta/commit/ac23a71af4f68ad11b89e2b2b2e5ecdeea944b06))

## 0.5.5 (2025-12-11)

### 🐛 Bug Fixes

- **rosetta,rosetta-next:** use --target browser for Edge-compatible entries ([78a54fb](https://github.com/SylphxAI/rosetta/commit/78a54fb00a5146655a880626b97be93ad732b4a0))

## 0.5.4 (2025-12-11)

### 🐛 Bug Fixes

- use sed -i.bak for cross-platform compatibility ([64b839c](https://github.com/SylphxAI/rosetta/commit/64b839c8a810c473dd6e72f94e4c15c4c2ebdb6f))
- **rosetta,rosetta-next:** strip node:module from Edge-compatible bundles ([f3be5b0](https://github.com/SylphxAI/rosetta/commit/f3be5b00c58d1efbf38da902a2235723dbb3da56))

## 0.5.3 (2025-12-11)

### 🐛 Bug Fixes

- **rosetta:** disable code splitting to fix missing hashText/DEFAULT_LOCALE ([767c4fe](https://github.com/SylphxAI/rosetta/commit/767c4fef86e5d4ba97f7df03d86a2ae2f29b883b))

## 0.5.2 (2025-12-10)

### 🐛 Bug Fixes

- remove node:module deps for Edge runtime compatibility ([23c73bd](https://github.com/SylphxAI/rosetta/commit/23c73bd26c654ffc17c5d556431a3dc576e1b1b8))

## 0.5.1 (2025-12-10)

Add --watch mode for CLI extraction

### ✨ Features

- **cli:** add --watch mode for dev hot reload ([894ad62](https://github.com/SylphxAI/rosetta/commit/894ad62adb148db6ecdb5129af9388ac39ad53e0))

### 🐛 Bug Fixes

- sync package versions with npm ([e2637db](https://github.com/SylphxAI/rosetta/commit/e2637dbd931da825edcbf8d01f945851da1ffde7))

### ⏪ Reverts

- remove manual version bumps (CI handles releases) ([f3d9b06](https://github.com/SylphxAI/rosetta/commit/f3d9b06e1a45028fa83a311b7caed543ae41d67e))

## 0.4.0 (2025-12-09)

### ✨ Features

- 💥 manifest-based architecture - sources as static files ([430dc2b](https://github.com/SylphxAI/rosetta/commit/430dc2bb2b06812a217bae968957bb2a9ba1a563))

### 💥 Breaking Changes

- manifest-based architecture - sources as static files ([430dc2b](https://github.com/SylphxAI/rosetta/commit/430dc2bb2b06812a217bae968957bb2a9ba1a563))

## 0.3.0

### Minor Changes

- 5d4ac89: feat: add sourceHash for efficient staleness detection

  - Add `sourceHash` column to rosetta_translations table (8-char hex hash)
  - Replace inefficient `translatedFrom` (full source text) with hash-based comparison
  - Maintain backward compatibility: `translatedFrom` deprecated but still supported
  - Storage savings: ~100KB → 8 bytes per translation for long texts

  Migration required: Add `source_hash TEXT` column to your rosetta_translations table.

## 0.2.0

### Minor Changes

- 5b58cae: feat(rosetta): add CLI for compile-time string extraction

  - `rosetta extract` scans source files for t() calls
  - Extracts strings and generates JSON output
  - Supports --root, --output, --verbose, --include, --exclude options
  - Remove runtime string collection (use compile-time extraction instead)

- 8abda25: refactor: Improve type safety, add validation, and comprehensive testing

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

- 96e2d0f: feat: Add caching layer for serverless deployments

  New cache adapters to reduce database queries in serverless environments:

  - **InMemoryCache**: LRU cache with TTL for traditional Node.js servers
  - **ExternalCache**: Redis/Upstash adapter for serverless (Vercel, Lambda)
  - **RequestScopedCache**: Request-level deduplication

  Usage:

  ```ts
  // Serverless with Upstash Redis
  import { Redis } from "@upstash/redis";
  import { ExternalCache, Rosetta } from "@sylphx/rosetta/server";

  const redis = new Redis({ url, token });
  const cache = new ExternalCache(redis, { ttlSeconds: 60 });

  const rosetta = new Rosetta({
    storage,
    cache, // Optional cache adapter
    defaultLocale: "en",
  });
  ```

  Also adds `rosetta.invalidateCache(locale?)` to clear cached translations after updates.

### Patch Changes

- e9a4fe3: fix(rosetta): remove duplicate exports from bunup build output

  Added post-build script to fix bunup bundler bug that generates duplicate export statements.

- d7f08b6: Performance and security improvements:

  **Performance:**

  - Cache `Intl.PluralRules` instances per locale on server (2-5x faster plurals)
  - Single-pass regex interpolation: O(n) instead of O(m×n)

  **Security:**

  - Add ICU parsing depth limits to server (matching client)
  - Add iteration limits to prevent infinite loops
  - Fix `replaceHash` to use replacer function (avoids $ interpretation)
  - Add text length limits (50k chars max)

## 0.1.7 (2025-12-08)

### ✨ Features

- **rosetta:** add source override and staleness detection ([540c04d](https://github.com/SylphxAI/rosetta/commit/540c04daedebe3b730b35ccecd4cb43dc518450f))

## 0.1.6 (2025-12-08)

### 🐛 Bug Fixes

- **rosetta:** remove duplicate exports from bunup build output ([a189744](https://github.com/SylphxAI/rosetta/commit/a18974410b5196164668de646d6b3c0579730790))

## 0.1.5 (2025-12-08)

### ✨ Features

- **rosetta:** add CJS exports for Node.js compatibility ([aea0045](https://github.com/SylphxAI/rosetta/commit/aea0045d5b1bc2638e209101f6dedd97a360ef04))

## 0.1.4 (2025-12-08)

### ✨ Features

- **rosetta:** add timeout to OpenRouter adapter ([129f86d](https://github.com/SylphxAI/rosetta/commit/129f86d856e8f15f322e358106c975f57d86ed12))
- **rosetta:** add input validation with size limits ([b46f023](https://github.com/SylphxAI/rosetta/commit/b46f023cf9a68bf5eda0bee516619df5acd1e4c7))
- **rosetta:** add caching layer for serverless deployments ([96e2d0f](https://github.com/SylphxAI/rosetta/commit/96e2d0f3e1db1aeed407d69963456ec8a2bb8520))

### 🐛 Bug Fixes

- **rosetta:** add explicit type annotations for isolatedDeclarations ([a9f7955](https://github.com/SylphxAI/rosetta/commit/a9f7955fe3e7778c8f5501826d2718000877e27d))

### ⚡️ Performance

- **rosetta:** optimize interpolation and add server ICU security ([d7f08b6](https://github.com/SylphxAI/rosetta/commit/d7f08b654e7437c9addc34c8583c08a643f39358))

### ♻️ Refactoring

- **rosetta:** extract shared ICU formatter module ([924a61f](https://github.com/SylphxAI/rosetta/commit/924a61f658cce082757f133140b1714124c8ce6a))

### 💅 Styles

- fix lint formatting ([651be20](https://github.com/SylphxAI/rosetta/commit/651be2074c18d9a127e30c77eef18ea3fbe6cdbe))

## 0.1.3 (2025-12-08)

### ✨ Features

- **rosetta:** add timeout to OpenRouter adapter ([129f86d](https://github.com/SylphxAI/rosetta/commit/129f86d856e8f15f322e358106c975f57d86ed12))
- **rosetta:** add input validation with size limits ([b46f023](https://github.com/SylphxAI/rosetta/commit/b46f023cf9a68bf5eda0bee516619df5acd1e4c7))
- **rosetta:** add caching layer for serverless deployments ([96e2d0f](https://github.com/SylphxAI/rosetta/commit/96e2d0f3e1db1aeed407d69963456ec8a2bb8520))

### ⚡️ Performance

- **rosetta:** optimize interpolation and add server ICU security ([d7f08b6](https://github.com/SylphxAI/rosetta/commit/d7f08b654e7437c9addc34c8583c08a643f39358))

### ♻️ Refactoring

- **rosetta:** extract shared ICU formatter module ([924a61f](https://github.com/SylphxAI/rosetta/commit/924a61f658cce082757f133140b1714124c8ce6a))

### 💅 Styles

- fix lint formatting ([651be20](https://github.com/SylphxAI/rosetta/commit/651be2074c18d9a127e30c77eef18ea3fbe6cdbe))

## 0.1.2 (2025-12-08)

### ✨ Features

- **rosetta-next:** add Turbopack loader for compile-time extraction ([0ba0566](https://github.com/SylphxAI/rosetta/commit/0ba056673b4fd0e50de0b6fad2d2463355246e93))

## 0.1.1 (2025-12-08)

### ✨ Features

- **rosetta:** compile-time string extraction CLI ([5b58cae](https://github.com/SylphxAI/rosetta/commit/5b58cae8c90db38fb274c87b49c42b1aedaad28c))

## 0.1.0 (2025-12-07)

### ✨ Features

- **rosetta:** add ICU MessageFormat, locale fallback chain, and validation ([4e62e59](https://github.com/SylphxAI/rosetta/commit/4e62e59df2a6efbfafbae082151286bc89832eee))
- add fine-grained translation loading (optional) ([85e7a24](https://github.com/SylphxAI/rosetta/commit/85e7a24e4e8812531d054bb923cbdc152b23fc1a))
- **rosetta-react:** add RosettaProvider server component ([5947eb4](https://github.com/SylphxAI/rosetta/commit/5947eb4ce2d7db201d97bd02cd5798e66df4f393))

### 🐛 Bug Fixes

- comprehensive architecture improvements ([555a8f2](https://github.com/SylphxAI/rosetta/commit/555a8f2c27214d575e561ab3ea9c1edca37ea938))
- replace remaining lingua references with rosetta ([5a28967](https://github.com/SylphxAI/rosetta/commit/5a28967ec1962a6e69266b42fe993aa092fe6af1))

### ♻️ Refactoring

- 💥 rename rosetta-react to rosetta-next ([557d241](https://github.com/SylphxAI/rosetta/commit/557d24181a3899f830319a54f755cff52d237fd2))
- 💥 remove internal cache (serverless-first) ([61e9f39](https://github.com/SylphxAI/rosetta/commit/61e9f3914b7899a97e98490a4f949d5fc1c09533))
- 💥 unify client/server to use hash-based lookup ([93d2e5b](https://github.com/SylphxAI/rosetta/commit/93d2e5b008d65ca121bc5940e96d26c9b77f7a34))
- 💥 rename I18n to Rosetta for consistent branding ([993d193](https://github.com/SylphxAI/rosetta/commit/993d193b9e867fc21edc87ebb490f31800c4fb99))
- 💥 remove enabledLocales, discover languages from DB ([479c441](https://github.com/SylphxAI/rosetta/commit/479c441f1aca0b81158bf8ce11052e10b0b4b8a4))
- 💥 rename packages from lingua to rosetta ([0daf9aa](https://github.com/SylphxAI/rosetta/commit/0daf9aa6be1bbe2aa5e5371e54576ee56641866e))

### 💥 Breaking Changes

- rename rosetta-react to rosetta-next ([557d241](https://github.com/SylphxAI/rosetta/commit/557d24181a3899f830319a54f755cff52d237fd2))
  Package renamed to reflect Next.js-specific nature
- remove internal cache (serverless-first) ([61e9f39](https://github.com/SylphxAI/rosetta/commit/61e9f3914b7899a97e98490a4f949d5fc1c09533))
  Removed cacheTTL and maxCacheSize config options
- unify client/server to use hash-based lookup ([93d2e5b](https://github.com/SylphxAI/rosetta/commit/93d2e5b008d65ca121bc5940e96d26c9b77f7a34))
  Client now uses hash-based lookup (same as server)
- rename I18n to Rosetta for consistent branding ([993d193](https://github.com/SylphxAI/rosetta/commit/993d193b9e867fc21edc87ebb490f31800c4fb99))
  All I18n-related names changed to Rosetta
- remove enabledLocales, discover languages from DB ([479c441](https://github.com/SylphxAI/rosetta/commit/479c441f1aca0b81158bf8ce11052e10b0b4b8a4))
  enabledLocales config removed
- rename packages from lingua to rosetta ([0daf9aa](https://github.com/SylphxAI/rosetta/commit/0daf9aa6be1bbe2aa5e5371e54576ee56641866e))
  All package names have changed

## 0.1.0 (2025-12-07)

### ✨ Features

- **rosetta:** add ICU MessageFormat, locale fallback chain, and validation ([4e62e59](https://github.com/SylphxAI/rosetta/commit/4e62e59df2a6efbfafbae082151286bc89832eee))
- add fine-grained translation loading (optional) ([85e7a24](https://github.com/SylphxAI/rosetta/commit/85e7a24e4e8812531d054bb923cbdc152b23fc1a))
- **rosetta-react:** add RosettaProvider server component ([5947eb4](https://github.com/SylphxAI/rosetta/commit/5947eb4ce2d7db201d97bd02cd5798e66df4f393))

### 🐛 Bug Fixes

- comprehensive architecture improvements ([555a8f2](https://github.com/SylphxAI/rosetta/commit/555a8f2c27214d575e561ab3ea9c1edca37ea938))
- replace remaining lingua references with rosetta ([5a28967](https://github.com/SylphxAI/rosetta/commit/5a28967ec1962a6e69266b42fe993aa092fe6af1))

### ♻️ Refactoring

- 💥 rename rosetta-react to rosetta-next ([557d241](https://github.com/SylphxAI/rosetta/commit/557d24181a3899f830319a54f755cff52d237fd2))
- 💥 remove internal cache (serverless-first) ([61e9f39](https://github.com/SylphxAI/rosetta/commit/61e9f3914b7899a97e98490a4f949d5fc1c09533))
- 💥 unify client/server to use hash-based lookup ([93d2e5b](https://github.com/SylphxAI/rosetta/commit/93d2e5b008d65ca121bc5940e96d26c9b77f7a34))
- 💥 rename I18n to Rosetta for consistent branding ([993d193](https://github.com/SylphxAI/rosetta/commit/993d193b9e867fc21edc87ebb490f31800c4fb99))
- 💥 remove enabledLocales, discover languages from DB ([479c441](https://github.com/SylphxAI/rosetta/commit/479c441f1aca0b81158bf8ce11052e10b0b4b8a4))
- 💥 rename packages from lingua to rosetta ([0daf9aa](https://github.com/SylphxAI/rosetta/commit/0daf9aa6be1bbe2aa5e5371e54576ee56641866e))

### 💥 Breaking Changes

- rename rosetta-react to rosetta-next ([557d241](https://github.com/SylphxAI/rosetta/commit/557d24181a3899f830319a54f755cff52d237fd2))
  Package renamed to reflect Next.js-specific nature
- remove internal cache (serverless-first) ([61e9f39](https://github.com/SylphxAI/rosetta/commit/61e9f3914b7899a97e98490a4f949d5fc1c09533))
  Removed cacheTTL and maxCacheSize config options
- unify client/server to use hash-based lookup ([93d2e5b](https://github.com/SylphxAI/rosetta/commit/93d2e5b008d65ca121bc5940e96d26c9b77f7a34))
  Client now uses hash-based lookup (same as server)
- rename I18n to Rosetta for consistent branding ([993d193](https://github.com/SylphxAI/rosetta/commit/993d193b9e867fc21edc87ebb490f31800c4fb99))
  All I18n-related names changed to Rosetta
- remove enabledLocales, discover languages from DB ([479c441](https://github.com/SylphxAI/rosetta/commit/479c441f1aca0b81158bf8ce11052e10b0b4b8a4))
  enabledLocales config removed
- rename packages from lingua to rosetta ([0daf9aa](https://github.com/SylphxAI/rosetta/commit/0daf9aa6be1bbe2aa5e5371e54576ee56641866e))
  All package names have changed

## 0.1.0 (2025-12-07)

### ✨ Features

- **rosetta:** add ICU MessageFormat, locale fallback chain, and validation ([4e62e59](https://github.com/SylphxAI/rosetta/commit/4e62e59df2a6efbfafbae082151286bc89832eee))
- add fine-grained translation loading (optional) ([85e7a24](https://github.com/SylphxAI/rosetta/commit/85e7a24e4e8812531d054bb923cbdc152b23fc1a))
- **rosetta-react:** add RosettaProvider server component ([5947eb4](https://github.com/SylphxAI/rosetta/commit/5947eb4ce2d7db201d97bd02cd5798e66df4f393))

### 🐛 Bug Fixes

- comprehensive architecture improvements ([555a8f2](https://github.com/SylphxAI/rosetta/commit/555a8f2c27214d575e561ab3ea9c1edca37ea938))
- replace remaining lingua references with rosetta ([5a28967](https://github.com/SylphxAI/rosetta/commit/5a28967ec1962a6e69266b42fe993aa092fe6af1))

### ♻️ Refactoring

- 💥 rename rosetta-react to rosetta-next ([557d241](https://github.com/SylphxAI/rosetta/commit/557d24181a3899f830319a54f755cff52d237fd2))
- 💥 remove internal cache (serverless-first) ([61e9f39](https://github.com/SylphxAI/rosetta/commit/61e9f3914b7899a97e98490a4f949d5fc1c09533))
- 💥 unify client/server to use hash-based lookup ([93d2e5b](https://github.com/SylphxAI/rosetta/commit/93d2e5b008d65ca121bc5940e96d26c9b77f7a34))
- 💥 rename I18n to Rosetta for consistent branding ([993d193](https://github.com/SylphxAI/rosetta/commit/993d193b9e867fc21edc87ebb490f31800c4fb99))
- 💥 remove enabledLocales, discover languages from DB ([479c441](https://github.com/SylphxAI/rosetta/commit/479c441f1aca0b81158bf8ce11052e10b0b4b8a4))
- 💥 rename packages from lingua to rosetta ([0daf9aa](https://github.com/SylphxAI/rosetta/commit/0daf9aa6be1bbe2aa5e5371e54576ee56641866e))

### 💥 Breaking Changes

- rename rosetta-react to rosetta-next ([557d241](https://github.com/SylphxAI/rosetta/commit/557d24181a3899f830319a54f755cff52d237fd2))
  Package renamed to reflect Next.js-specific nature
- remove internal cache (serverless-first) ([61e9f39](https://github.com/SylphxAI/rosetta/commit/61e9f3914b7899a97e98490a4f949d5fc1c09533))
  Removed cacheTTL and maxCacheSize config options
- unify client/server to use hash-based lookup ([93d2e5b](https://github.com/SylphxAI/rosetta/commit/93d2e5b008d65ca121bc5940e96d26c9b77f7a34))
  Client now uses hash-based lookup (same as server)
- rename I18n to Rosetta for consistent branding ([993d193](https://github.com/SylphxAI/rosetta/commit/993d193b9e867fc21edc87ebb490f31800c4fb99))
  All I18n-related names changed to Rosetta
- remove enabledLocales, discover languages from DB ([479c441](https://github.com/SylphxAI/rosetta/commit/479c441f1aca0b81158bf8ce11052e10b0b4b8a4))
  enabledLocales config removed
- rename packages from lingua to rosetta ([0daf9aa](https://github.com/SylphxAI/rosetta/commit/0daf9aa6be1bbe2aa5e5371e54576ee56641866e))
  All package names have changed
