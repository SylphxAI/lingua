---
"@sylphx/rosetta": minor
"@sylphx/rosetta-drizzle": minor
"@sylphx/rosetta-admin": minor
---

feat: add sourceHash for efficient staleness detection

- Add `sourceHash` column to rosetta_translations table (8-char hex hash)
- Replace inefficient `translatedFrom` (full source text) with hash-based comparison
- Maintain backward compatibility: `translatedFrom` deprecated but still supported
- Storage savings: ~100KB → 8 bytes per translation for long texts

Migration required: Add `source_hash TEXT` column to your rosetta_translations table.
