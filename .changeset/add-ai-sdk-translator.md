---
"@sylphx/rosetta-admin": minor
"@sylphx/rosetta-translator-ai-sdk": minor
"@sylphx/rosetta-translator-openrouter": minor
"@sylphx/rosetta-translator-anthropic": minor
---

Split AI translators into separate packages

- Remove AI translators from @sylphx/rosetta-admin (now 0 AI deps)
- Add @sylphx/rosetta-translator-ai-sdk (for Vercel AI SDK users)
- Add @sylphx/rosetta-translator-openrouter (for OpenRouter SDK users)
- Add @sylphx/rosetta-translator-anthropic (for Anthropic SDK users)

Each translator is independent - only install what you need.
