# Issue #153 — final CogniFlow presentation standardization handoff

## Status

Implementation and owner-side local acceptance are complete on:

`standardization/cogniflow-trig-rendering`

The branch is ready for a Draft PR and independent/exact-head validation. It must remain Draft and unmerged until the repository workflow gates are satisfied.

## Scope evolution

Issue #153 began as the first semantics-authored quantitative chart vertical slice:

`TriG + SHACL -> canonical ChartBlock -> renderer-d3 -> Pitch`

Owner-directed work intentionally expanded that slice into the complete CogniFlow presentation and then into a full standardization pass. The resulting branch should therefore be reviewed as a generic presentation-platform migration plus the authored CogniFlow reference presentation, not as a narrow bar-chart-only change.

## Final architecture

The accepted implementation follows:

```text
canonical TriG
    ↓
canonical compiler / semantic projection
    ↓
renderer-neutral SceneDocument
    ↓
generic structural layout inference
    ↓
generic renderer/runtime components
    ↓
Reveal / scroll / mobile / self-study consumers
```

Key architectural invariants:

- CogniFlow audience content is authored in TriG.
- Application/core/renderer behavior does not select layout or runtime behavior from CogniFlow scene/resource ids.
- Presentation-specific pixel geometry, CSS classes, breakpoints and layout-family names remain renderer-owned.
- SceneDocument remains renderer-neutral and preserves source/provenance evidence.
- Responsive behavior is generic and deterministic.
- CogniFlow identity remains only where it legitimately selects content/configuration: authored ontology/data, package/profile entry points, tests/docs and `presentation-profile.ts`.

## Major generic capabilities delivered

- bar and line ChartBlock contracts with D3 renderers and progressive annotations;
- FlowDiagram / NetworkDiagram / SequenceDiagram projection and generic layouts;
- relation-free grouped concentric networks;
- structured diagram node title/body rendering;
- semantic-source and semantic-multi-view projections;
- analytical-proof synchronized chart/flow progression;
- tables and definition lists as canonical structured blocks;
- generic concept/specification, hierarchy, card-sequence, foundation-card-grid, process-diagram, diagram-stage and hero-title layouts;
- generic full-media sequences with structural hard cuts/background suppression/playback lifecycle;
- generic alternate publication projection from existing compiled content;
- reusable presenter clock, laser pointer and native portrait viewport capabilities;
- generic closing scene and responsive presentation shell;
- generic browser diagram regression utility.

## Removed implementation coupling

The migration removed the former CogniFlow-specific presentation implementation layer, including:

- scene-id-specific layout styles;
- CogniFlow-specific dark/mobile compatibility styles;
- CogniFlow-specific semantic-ring runtime;
- CogniFlow-specific publication-projection content/runtime;
- CogniFlow-specific clock and laser-pointer implementations;
- concrete showcase/hard-cut/background-freeze scene-id sets;
- concrete analytical-proof annotation-id color selectors;
- production-generator validation keyed to a CogniFlow scene id;
- the CogniFlow-specific scroll regression script.

A repository-level regression guard now fails if CogniFlow lexical identity re-enters production application/core/renderer/script logic outside the explicit profile selector allowlist.

## Validation / acceptance evidence

Owner-side local acceptance has been completed after the final migration/audit:

- `npm --workspace @project-chemie-digital/pitch run generate:cogniflow` — accepted;
- `npm --workspace @project-chemie-digital/pitch test` — accepted;
- `npm --workspace @project-chemie-digital/pitch run dev:cogniflow` — accepted;
- iterative visual acceptance was completed for the standardized slides, including the final hero title, semantic ring network, graph/flow layouts and shell behavior.

The final documentation/handoff commit is non-runtime. A fresh exact-head repository validator should still be run on the Draft PR as required by project workflow.

## Branch integration state

At final pre-PR comparison:

- base: `main`
- branch: `standardization/cogniflow-trig-rendering`
- behind `main`: **0**
- branch is directly ahead of `main`.

The branch is intentionally large because it contains the owner-directed presentation build plus the subsequent standardization migration.

## Previously known compiler follow-up

The earlier handoff warned that SceneDocument version promotion could be order-dependent. That defect is no longer present: canonical compilation now uses monotonic `promote_document_version()` calls for chart/diagram/table/definition-list capabilities, so later scene items cannot downgrade a previously required document version.

There is therefore no known generic compiler blocker carried forward from the previous handoff.

## Required remaining gates

1. Open/keep the PR as **Draft**.
2. Run the repository's fresh exact-head validator on the PR head.
3. Perform independent review of the generic architectural changes.
4. Do not self-accept or merge as part of this handoff.

## PR metadata

The Draft PR must contain:

`<!-- agent-workflow-validator:project-chemie-digital -->`

and:

`Closes #153`
