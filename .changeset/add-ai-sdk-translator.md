---
"@sylphx/rosetta-admin": minor
---

Improve AI translators with proper SDK support

- Add createAiSdkTranslator for Vercel AI SDK users (any provider)
- Update createOpenRouterTranslator to use @openrouter/sdk
- Update createAnthropicTranslator to use @anthropic-ai/sdk with tool use
- All translators now require model parameter (no hardcoded defaults)
- Uses structured output / JSON schema for reliable parsing
