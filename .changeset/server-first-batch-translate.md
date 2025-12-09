---
"@sylphx/rosetta-admin": minor
---

Server-first batch translate API

- `batchTranslate` now only requires `{ locale }`
- Server looks up untranslated strings from storage
- Optional `hashes` array for selective translation
- No more sending sourceText from client
