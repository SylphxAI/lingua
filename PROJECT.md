# rosetta

`rosetta` is an active foundation repository for the `@sylphx/rosetta` i18n
library family. It owns package exports, framework adapters, translator
adapters, database integration helpers, docs, tests, and release wiring for the
Rosetta localization toolchain.

## Lifecycle And Layer

- Lifecycle: `active`
- Layer: `foundation`

## Goals

- Provide a lightweight, typed i18n library with source string collection and
  translation workflows.
- Keep core package exports, Next.js/admin/database/translator adapters, docs,
  and tests coherent as one library family.
- Publish only documented package exports and adapter contracts to consumers.

## Non-Goals

- Own consumer application copy, translation policy, localization operations, or
  provider availability.
- Own enterprise doctrine, org rulesets, or shared CI/release policy.
- Encode one product's copy workflow as hidden library behavior.

## Boundaries

This repository owns the Rosetta package family and docs. Consumers must depend
on package exports and documented adapter behavior, not internal package paths.
Provider-specific behavior belongs behind adapters and documented configuration.

## Public Surfaces

- `README.md` documents the library family.
- `packages/rosetta/` is the core package.
- `packages/rosetta-next/`, `packages/rosetta-admin/`, and
  `packages/rosetta-drizzle/` are adapter packages.
- `packages/translator-*/` are translator provider adapters.
- `docs/` and `sylphx.json` publish the docs site.
- `.github/workflows/ci.yml` and `.github/workflows/release.yml` define CI and
  central release wiring.
- `.doctrine/project.json` is the machine-readable project manifest.

## Delivery

Pull requests and merge groups run the repo CI workflow. Main-branch release
handling is delegated to the central reusable workflow. Production proof for
published package changes must include package/readback or consumer smoke
evidence in addition to CI.

The authoritative control-plane record is `.doctrine/project.json`.
