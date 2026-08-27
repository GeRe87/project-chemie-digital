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
- `apps/self-study/test/app.test.ts` covers runtime identity derivation, explicit local-file chrome and atomic preflight-before-commit behavior.
- Root `npm test` now includes `test:learner-state` in addition to the existing renderer and self-study suites.

Exact-head CI / validator evidence is to be recorded on the draft PR before manager acceptance.

## Owner browser acceptance requested

On the unchanged validated PR head:

1. Start the self-study app and enter at least one free-text answer plus one choice answer.
2. Open/advance at least one optional or progressive disclosure.
3. Export via **Lernstand exportieren** and inspect that a local JSON file is produced.
4. Reload the page and confirm the interaction state is reset.
5. Import the exported file via **Lernstand importieren** and confirm the represented answers/disclosure state returns.
6. Try an intentionally stale or modified file and confirm the import is rejected without partial UI changes.
