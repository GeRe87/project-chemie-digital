# Issue #88 — local learner-state export boundary

Role: Backend and Data Integration Engineer  
Branch: `agent/88-learner-state-export`

## Implemented boundary

- Added DOM-free `packages/learner-state` contract for deterministic `LearnerStateDocument 1.0`.
- State is bound to the canonical dataset fingerprint and stable document/scene/block identities.
- Prompt state covers reflection/free-text, single-choice and multiple-choice values.
- Disclosure state covers renderer-owned optional/progressive `open` and visibility state.
- Canonical JSON serialization sorts documents, records and multiple-choice selections and adds no timestamp or random identifier.
- Strict import rejects unsupported versions, stale fingerprints, unknown document/scene/block identities, invalid state owners, response-mode mismatches, unauthored choices, disclosure-mode mismatches, malformed values and duplicate/conflicting records.
- Self-study controller now exposes typed capture plus a prepare/commit restore boundary. Every controller is preflighted before any prepared UI mutation is committed.
- Self-study UI adds explicit `Lernstand exportieren` and `Lernstand importieren` local-file actions with deterministic status codes/messages.
- Reload behavior remains ephemeral unless the learner explicitly imports a saved file.
- Added privacy documentation in `docs/learner-state-export.md`.

## Automated evidence

- `packages/learner-state/test/learner-state.test.ts` covers stable serialization, prompt/disclosure round-trip, fingerprint mismatch, stale block, response-mode mismatch, invalid choice values, duplicate records, invalid state ownership, forbidden metadata fields and forbidden service/browser-store dependencies.
- Contract fixtures explicitly cover free-text, single-choice, multiple-choice, optional disclosure and progressive disclosure even though the current canonical Standardabweichung demo does not expose all of those interaction forms.
- `apps/self-study/test/app.test.ts` covers runtime identity derivation, explicit local-file chrome and atomic preflight-before-commit behavior.
- Root `npm test` now includes `test:learner-state` in addition to the existing renderer and self-study suites.

Exact-head CI / validator evidence is to be recorded on the draft PR before manager acceptance.

## Owner browser acceptance requested

The current canonical Standardabweichung path contains a single-choice poll but no free-text prompt and no optional/progressive disclosure blocks. Do not invent those semantics for browser acceptance; their learner-state behavior is covered by the deterministic contract fixtures above.

On the unchanged validated PR head:

1. Start the self-study app and select one of the existing section-9 single-choice answers (`Messreihe A` / `Messreihe B`).
2. Export via **Lernstand exportieren** and confirm a local `chemie-digital-lernstand.json` file is produced. Inspect that it contains `version: "1.0"`, the canonical `datasetFingerprint`, stable document/scene/block identities and the selected authored option, with no timestamp or user/account identifier.
3. Reload the page and confirm the radio selection is reset without explicit import.
4. Import the exported file via **Lernstand importieren** and confirm the represented radio selection returns.
5. Modify a copy of the exported file so its `datasetFingerprint` is stale (or replace the selected option with a value that is not authored), import it, and confirm the import is rejected while the currently visible interaction state is not partially changed.
6. Confirm the UI provides only explicit export/import actions and does not restore state automatically on another reload.
