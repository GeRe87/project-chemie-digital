# Agent handoff

## Role

`Software Architect`

## Issue

`#136 — Define deterministic responsive layout inference boundary`

## Completed

- Added ADR-0012 defining the responsive layout-inference boundary as **renderer-neutral evidence + renderer-owned inference and realization**.
- Kept `SceneDocument 1.0` unchanged. No layout family, viewport, breakpoint, template, column ratio, device name or physical-frame metadata is added upstream.
- Defined the permitted deterministic inference inputs from existing scene structure: block kinds, `DidacticIntent`, `emphasis`, semantic groups, reading order, disclosure, accessibility metadata and bounded payload measurements.
- Defined explicit renderer inputs through a normalized `LayoutEnvironment` and versioned renderer-local layout policy rather than browser/device detection.
- Defined renderer-owned structural layout families/variants as ephemeral policy concepts rather than a new cross-renderer semantic vocabulary.
- Defined hard-constraint filtering before ranking, deterministic score/rank comparison, stable tie-breaking and a reproducibility invariant over scene + environment + asset metadata + policy version.
- Defined two-stage overflow architecture: deterministic preflight followed later by bounded renderer measurement feedback and an ordered fallback chain.
- Explicitly rejected unbounded font shrinking as an overflow strategy below renderer-configured readability/accessibility minima.
- Defined mobile/narrow presentation as a different realization of the same logical scene, including deterministic stacking and optional renderer-owned physical-frame partitioning that preserves source identity and semantic reading order.
- Defined accessibility/static invariants, including complete content, stable semantic traversal, non-visual alternatives, prompt fallbacks, reduced-motion completeness and keyboard accessibility.
- Deferred author layout hints: existing semantics must first demonstrate insufficiency; any future shared hint contract or RDF vocabulary requires a separate reviewed increment.
- Defined stable structured diagnostics/explainability requirements and representative current scene combinations, including prose + media wide/stacked behavior and a high-density fallback case.
- Classified `apps/pitch/src/preview.ts::layoutByScene` and its `opening` / `statement` / `process` / `split-proof` CSS layouts as renderer-owned legacy implementation evidence, not semantic authority.
- Defined four bounded follow-up implementation increments: pure layout analyzer/resolver; reusable Reveal families + removal of scene-id mapping; responsive environment realization; measured overflow recovery/physical-frame planning.
- Did not update `docs/backlog.md`; ADR-0012 already records the required follow-up sequence and no additional backlog mutation is necessary for this architecture-only increment.

## Files or resources changed

- `docs/adr/0012-deterministic-responsive-layout-inference.md` — new architecture decision.
- `.agents/handoffs/issue-136-responsive-layout-architecture.md` — this handoff.
- `.agents/workflows/system/state.json` — worker claim/return lifecycle only; live dispatcher return is handled separately from feature content.

## Verification

- [ ] Automated tests — no production code or executable contract was added in this architecture-only increment; fresh exact-head `agent-validator/project-chemie-digital` evidence remains mandatory before manager acceptance.
- [ ] Semantic validation — no ontology, SHACL or canonical TriG changed; semantic validation is not claimed by this connector-only worker.
- [ ] Manual browser check — not applicable; no renderer/CSS/runtime behavior changed.
- [x] Accessibility check — ADR explicitly preserves semantic `readingOrder`, complete static content, non-visual alternatives, prompt fallback, reduced-motion behavior, keyboard reachability and readability minima across responsive realizations.
- [x] Documentation updated — ADR-0012 and structured handoff added.

## Decisions and assumptions

- Layout inference belongs inside renderer-adapter responsibility. `SceneDocument` supplies renderer-neutral evidence but does not carry a selected layout family or responsive state.
- The first implementation should not create a shared renderer-neutral `LayoutIntent` contract. If multiple renderers later demonstrate substantial identical pure logic, a separate downstream renderer-support package may be considered without reversing the existing dependency direction.
- Scene/resource/path identifiers are traceability inputs only and must never affect layout ranking.
- Media intrinsic geometry may influence a renderer only when supplied through deterministic local asset metadata; no implicit network discovery is permitted.
- Coarse profiles such as `wide`, `compact` and `narrow` are renderer-policy outputs derived from available presentation space, not device categories.
- Physical frames are adapter-generated presentation units, not new semantic scenes. Current `RevealRenderPlan 1.0` would require an explicit downstream evolution before multi-frame support is implemented.
- A generic semantic-stack/sequential representation is the conceptual safe fallback; bounded renderers may need pagination/physical frames to keep it legible.
- Author hints such as `preferTogether` or `avoidSplit` are deliberately deferred until real implementation evidence demonstrates that existing semantic grouping/emphasis/intent is insufficient.

## Risks or unresolved questions

- The first Reveal implementation still needs to choose concrete policy-version types, candidate ids, rank dimensions and stable reason-code names; ADR-0012 fixes the invariants but intentionally does not freeze numerical weights.
- The current scene media contract does not carry intrinsic dimensions. Initial layout scoring must therefore handle unknown geometry conservatively unless an explicit local asset-metadata input is available.
- Measured overflow recovery is intentionally deferred. Real KaTeX, SVG, font and browser measurements may reveal additional fit constraints that must remain renderer-local and deterministic.
- Physical-frame splitting requires a later adapter-plan versioning decision because ADR-0005 currently maps one logical scene to one top-level Reveal section.
- It remains possible that later self-study implementation reveals genuinely reusable analysis code. Premature extraction is intentionally avoided until that commonality is demonstrated.

## Recommended manager action

`review`
