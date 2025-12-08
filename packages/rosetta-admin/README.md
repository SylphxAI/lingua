# @sylphx/rosetta-admin

Headless translation admin hooks for [@sylphx/rosetta](https://github.com/SylphxAI/rosetta).

## Features

- **Pure Hooks** - No UI components, just logic. Build your own UI with your existing design system.
- **Framework-Agnostic Core** - Vanilla TypeScript store, ready for React/Vue/Solid adapters.
- **tRPC & REST** - First-class support for both tRPC and REST APIs.
- **AI Translation** - Built-in OpenRouter and Anthropic translators.
- **Source Override** - English text can be overridden in DB (CMS mode).
- **Staleness Detection** - Know when translations are outdated.

## Installation

```bash
npm install @sylphx/rosetta-admin
# or
bun add @sylphx/rosetta-admin
```

## Quick Start

### 1. Server Setup (tRPC)

```ts
// server/trpc/routers/admin.ts
import { createAdminRouter } from '@sylphx/rosetta-admin/server/trpc';
import { storage } from '@/lib/rosetta';
import { createOpenRouterTranslator } from '@sylphx/rosetta-admin/ai';

export const adminRouter = createAdminRouter({
  storage,
  translator: createOpenRouterTranslator({
    apiKey: process.env.OPENROUTER_API_KEY!,
    model: 'anthropic/claude-sonnet-4',
  }),
});

// Merge into your app router
export const appRouter = router({
  admin: adminRouter,
});
```

### 2. Client Setup

```tsx
// app/admin/translations/page.tsx
'use client';
import {
  TranslationAdminProvider,
  useTranslationAdmin,
  createTRPCClient,
} from '@sylphx/rosetta-admin/react';
import { api } from '@/trpc/react';

const client = createTRPCClient(api.admin);

function TranslationDashboard() {
  const {
    locales,
    stats,
    view,
    activeLocale,
    enterEditor,
    exitEditor,
    getLocaleProgress,
  } = useTranslationAdmin();

  if (view === 'editor' && activeLocale) {
    return <TranslationEditor locale={activeLocale} onBack={exitEditor} />;
  }

  return (
    <div className="grid gap-4">
      {locales.map(locale => (
        <div key={locale} onClick={() => enterEditor(locale)}>
          <h3>{locale}</h3>
          <p>{getLocaleProgress(locale)}% translated</p>
        </div>
      ))}
    </div>
  );
}

export default function Page() {
  return (
    <TranslationAdminProvider client={client}>
      <TranslationDashboard />
    </TranslationAdminProvider>
  );
}
```

## Hooks

### `useTranslationAdmin()`

Main hook providing all state and actions:

```ts
const {
  // Data
  sources,           // All source strings with translations
  locales,           // Active locales
  stats,             // Translation statistics

  // View state
  view,              // 'dashboard' | 'editor'
  activeLocale,      // Currently editing locale
  filteredSources,   // Filtered by search/status

  // Editor state
  searchQuery,
  statusFilter,
  editingHash,

  // Loading
  isLoading,
  isBatchTranslating,
  batchProgress,
  error,

  // Actions
  enterEditor,       // (locale: string) => void
  exitEditor,        // () => void
  setSearchQuery,
  setStatusFilter,
  saveTranslation,   // (hash, text, locale?) => Promise
  markAsReviewed,    // (hash, locale?) => Promise
  batchTranslate,    // (locale?, hashes?) => Promise
  addLocale,
  removeLocale,
  refresh,

  // Helpers
  getLocaleProgress, // (locale) => number (0-100)
  getOutdatedCount,  // (locale) => number
} = useTranslationAdmin();
```

### `useTranslationEditor()`

Focused hook for the editor view:

```ts
const {
  locale,
  sources,
  searchQuery,
  statusFilter,
  editingHash,
  isSaving,
  saveError,

  setSearchQuery,
  setStatusFilter,
  startEditing,
  cancelEditing,
  saveTranslation,
  markAsReviewed,
  getTranslation,
  getStatus,
} = useTranslationEditor();
```

### `useBatchTranslate()`

Focused hook for batch AI translation:

```ts
const {
  isRunning,
  progress,
  error,
  untranslatedCount,
  translateAll,
  translateSelected,
} = useBatchTranslate();
```

## REST API Setup

If you prefer REST over tRPC:

```ts
// app/api/admin/translations/route.ts
import { createRestHandlers } from '@sylphx/rosetta-admin/server';
import { storage } from '@/lib/rosetta';
import { createOpenRouterTranslator } from '@sylphx/rosetta-admin/ai';

const handlers = createRestHandlers({
  storage,
  translator: createOpenRouterTranslator({
    apiKey: process.env.OPENROUTER_API_KEY!,
  }),
  authorize: async (req) => {
    // Add your auth check
    return true;
  },
});

export const { GET, PUT, PATCH } = handlers;
```

```ts
// app/api/admin/translations/batch/route.ts
import { handlers } from '../route';
export const POST = handlers.batchTranslate;
```

```tsx
// Client
import { createRestClient } from '@sylphx/rosetta-admin/react';

const client = createRestClient({ baseUrl: '/api/admin/translations' });
```

## AI Translators

### OpenRouter

```ts
import { createOpenRouterTranslator } from '@sylphx/rosetta-admin/ai';

const translator = createOpenRouterTranslator({
  apiKey: process.env.OPENROUTER_API_KEY!,
  model: 'anthropic/claude-sonnet-4', // default
  batchSize: 50,  // default
});
```

### Anthropic (Direct)

```ts
import { createAnthropicTranslator } from '@sylphx/rosetta-admin/ai';

const translator = createAnthropicTranslator({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  model: 'claude-sonnet-4-20250514',
});
```

### Custom Translator

```ts
import type { TranslateFunction } from '@sylphx/rosetta-admin';

const myTranslator: TranslateFunction = async (items, locale) => {
  // Call your own API
  return items.map(item => ({
    sourceHash: item.sourceHash,
    translatedText: await myCustomAPI(item.sourceText, locale),
  }));
};
```

## Package Exports

```ts
// Core types and store
import { ... } from '@sylphx/rosetta-admin';

// React hooks and context
import { ... } from '@sylphx/rosetta-admin/react';

// Server-side (service + REST handlers)
import { ... } from '@sylphx/rosetta-admin/server';

// tRPC router
import { ... } from '@sylphx/rosetta-admin/server/trpc';

// AI translators
import { ... } from '@sylphx/rosetta-admin/ai';
```

## License

MIT
