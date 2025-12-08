---
"@sylphx/rosetta-next": patch
---

Fix hot reload support in development mode

- Dev mode now checks for manifest on every request
- Production still only syncs once per server lifecycle
