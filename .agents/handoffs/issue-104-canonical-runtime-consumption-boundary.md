# Agent handoff

## Role

`Backend and Data Integration Engineer`

## Issue

`#104 — Add typed canonical-runtime consumption boundary`

## Completed

- Added `packages/core/src/canonical-runtime.ts` as the shared renderer/framework-neutral TypeScript contract and runtime validator for generated `CanonicalRuntimeArtifact 1.0` and `TeachingOfferingRuntimeDocument 1.0` values.
- Added version constants and typed contracts for localized authored text, offering metadata, normalized placements, reusable units, exact path `{id, graphId}` records, the TeachingOffering runtime document and the outer canonical runtime artifact.
- Added `CanonicalRuntimeContractError` and a fail-closed `validateCanonicalRuntimeArtifact(value: unknown)` boundary; consumers no longer need to trust type assertions on generated JSON.
- Kept outer-root compatibility additive: unrelated root fields are tolerated. `datasetSnapshot` is required to be present but is deliberately opaque and is never traversed to infer course structure.
- Enforced canonical `sha256:<64 lowercase hex>` root/document Dataset revision identities and exact equality between every TeachingOffering document and the containing root before any validated document is exposed.
- Reused the existing `validateSceneDocument()` contract for all `sceneDocuments[]` entries and wrapped its diagnostics in the canonical-runtime contract error rather than duplicating scene validation.
- Validated absolute HTTP(S) offering, composition-graph, placement, unit, path and path-graph identities without using labels, routes or array positions as identity.
- Validated normalized course integrity: unique placement ids, positive unique authored positions serialized ascending, placement-to-unit joins, no unreferenced/duplicate units, deterministic unit IRI serialization, exact path-pair uniqueness/order, and valid zero-path units.
- Validated authored localized `labels[]` / `descriptions[]` as deterministic `(language-or-empty, value)` sequences, rejecting malformed, duplicate or out-of-order entries while preserving language-neutral values and making no locale choice.
- Chose the authored `offering.id` IRI as the unique TeachingOffering-document identity inside one root collection. `offering.graphId` remains provenance/ownership evidence, matching ADR-0010, and does not create a second semantic offering identity.
- Exported the new core boundary through `packages/core/src/index.ts`.
- Migrated `apps/self-study/src/scene-data.ts` to validate the imported generated JSON once through the shared core validator. Existing `canonicalDatasetFingerprint` and `canonicalSelfStudySceneDocuments()` behavior is preserved, and `canonicalSelfStudyTeachingOfferingDocuments()` exposes already-validated course documents read-only for later work.
- Migrated `apps/self-study/scripts/generate-static.mts` to the same shared validator and removed its local canonical-runtime interface. Static generation still maps only `sceneDocuments[]` to HTML and introduces no course shell or navigation chrome.
- Updated self-study tests to consume the generated runtime through the shared validator and verify the current Standardabweichung offering/unit/path shape, including exact root/document fingerprint equality and deliberately empty current path labels/descriptions.
- Added focused core tests for versions, canonical/mixed fingerprints, semantic identities, placement/unit normalization, exact path pairs, zero-path units, localized metadata, offering identity uniqueness and delegated SceneDocument validation.
- Updated `packages/core/README.md` with the transport boundary, Dataset-revision gate, opaque Dataset snapshot rule, accessibility/privacy implications and explicit navigation/learner-state exclusions.

## Files or resources changed

- `packages/core/src/canonical-runtime.ts` — new shared TypeScript transport contracts and validator.
- `packages/core/src/index.ts` — exports the canonical-runtime boundary.
- `packages/core/test/canonical-runtime.test.ts` — focused runtime contract/fail-closed coverage.
- `packages/core/README.md` — documents the shared validated generated-transport boundary.
- `apps/self-study/src/scene-data.ts` — validates generated JSON once and exposes course documents read-only.
- `apps/self-study/scripts/generate-static.mts` — uses the same validator while continuing to render scenes only.
- `apps/self-study/test/app.test.ts` — consumes generated runtime through the shared validator and checks the current course read model.
- `.agents/handoffs/issue-104-canonical-runtime-consumption-boundary.md` — this handoff.

## Verification

- [ ] Root `npm test` — not executed by this connector-oriented worker; authoritative exact-head `agent-validator/project-chemie-digital` evidence is required after the draft PR is opened.
- [x] Contract/source review — new validation logic is framework-neutral, performs no network access, imports only the existing SceneDocument contract, and does not inspect generic Dataset statements for course structure.
- [x] Producer compatibility review — accepted Python projector output matches the TypeScript contract: canonical fingerprint form, normalized placements/units, path-pair order and `(language-or-empty, value)` localized-text order.
- [x] Branch-scope review — before this handoff the branch changed exactly the seven bounded Core/self-study files expected by Issue #104; this handoff is the intended eighth file.
- [x] Scene compatibility review — SceneDocument validation is delegated to `validateSceneDocument()` and static/browser scene rendering behavior is not otherwise changed.
- [x] Accessibility review — authored multilingual labels/descriptions remain available for future accessible controls, but no visual course/navigation UI or locale negotiation is introduced in this issue.
- [x] Privacy review — the new transport contract contains project-authored semantic/display data and Dataset revision evidence only; learner answers, progress, accounts, analytics and personal data remain in separate contexts.
- [x] Documentation updated.
- [ ] Manual browser check — no new UI is introduced; authoritative project validation remains the acceptance gate.

## Decisions and assumptions

### Offering identity is the authored offering IRI

ADR-0010 explicitly defines `offering.id` as semantic identity and `offering.graphId` as provenance/ownership evidence. The root validator therefore rejects two TeachingOffering documents with the same `offering.id`, even if their graph ids differ. This prevents graph provenance from silently becoming a second offering identity.

### Outer root is additive; known nested invariants are strict

The canonical-runtime root may gain unrelated additive fields without changing `artifactVersion: "1.0"`, so the validator checks required fields but does not reject unknown root keys. The known TeachingOffering fields are validated for their version-1.0 invariants and deterministic representation. No generic JSON-schema/exact-key policy was introduced.

### Dataset snapshot remains opaque

`datasetSnapshot` is required because it remains an existing canonical-runtime root field, but the new boundary does not validate or traverse its graph/exploration shape. This prevents an application from reconstructing authoritative TeachingOffering navigation from generic statements.

### Core validation does not imply self-study navigation

`canonicalSelfStudyTeachingOfferingDocuments()` returns validated documents only. It does not select a document, locale, placement, unit or path; construct routes; or create current-navigation state. The existing self-study scene rendering and learner-state flows remain unchanged.

### Self-study still requires at least one SceneDocument at its app boundary

The shared generic root validator permits an empty `sceneDocuments[]` collection because it is a transport contract rather than a renderer policy. The existing `canonicalSelfStudySceneDocuments()` accessor retains the self-study-specific requirement that at least one SceneDocument be present.

## Risks or unresolved questions

- Authoritative exact-head validation is pending until the local validator publishes `agent-validator/project-chemie-digital` for the final draft-PR head.
- `datasetSnapshot` remains intentionally opaque. If a future generic graph consumer needs a shared TypeScript snapshot contract, that should be a separate boundary and must not be coupled to course navigation.
- The current Standardabweichung path still has no authored human-readable path label. The validator correctly accepts empty path metadata; a later multi-path UI must not fabricate a display name.
- The validator uses deterministic lexical string comparison matching the current ASCII project IRIs/language tags and the Python projector's serialization semantics. Locale negotiation remains explicitly outside this boundary.
- Course shell/navigation, ADR-0009 request construction from user interaction, route state and path-choice UX remain intentionally unimplemented.

## Recommended manager action

`review` after authoritative exact-head `agent-validator/project-chemie-digital` evidence is available. Verify the eight-file bounded scope, shared unknown-JSON validation boundary, exact root/document fingerprint rejection, normalized placement/unit/path validation, delegated SceneDocument checks, current generated Standardabweichung runtime test, removal of self-study local artifact interfaces and absence of Python/RDF/navigation/learner-state scope expansion before acceptance.
