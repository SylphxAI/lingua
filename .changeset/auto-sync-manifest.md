---
"@sylphx/rosetta-next": patch
---

Add automatic manifest sync on first request

- RosettaProvider now auto-syncs extracted strings from .rosetta/manifest.json to storage
- Sync runs once per server lifecycle on first render
- Eliminates need for manual postbuild scripts
