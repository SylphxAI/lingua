---
"@sylphx/rosetta-next": minor
---

feat(rosetta-next): add page-level translation loading (zero-config)

Automatic optimization that loads only the translations needed for each page:

- Build generates `routes.json` mapping routes to translation hashes
- `RosettaProvider` automatically uses route manifest for optimized loading
- Supports Next.js App Router conventions (pages, layouts, route groups, dynamic segments)
- Shared components marked as `_shared` and included in all routes
- Falls back to loading all translations if no manifest exists

```tsx
// Zero-config - automatic optimization
<RosettaProvider rosetta={rosetta} locale={locale}>
  {children}
</RosettaProvider>

// Or with explicit pathname for nested layouts
<RosettaProvider rosetta={rosetta} locale={locale} pathname="/products">
  {children}
</RosettaProvider>
```

New exports from loader:
- `readRoutes()` - Read route manifest
- `getHashesForRoute(route)` - Get hashes for a specific route
- `filePathToRoute()` - Convert file paths to routes (for testing)
