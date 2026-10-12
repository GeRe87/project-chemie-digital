# Agent handoff

## Role

Frontend and Reveal Renderer Engineer — System worker only.

## Issue

#261 — Shared teaching primitives. Draft PR #262 targets
`agent/259-level2-course-preview-repair` (#260), then #258/#185.
Feature commit: `5a0f973`. No acceptance, merge, deployment or publication.

## Completed

- Transparent local dice and cell-population drawings, securely copied as inert
  inline SVG primitives so active theme color actually reaches outlines/pips/text.
  Source image is replaced, not duplicated. Media is above the process diagram.
- Bold-only warmup instruction, paragraph gap and two indented question bullets.
  Global decorative question-circle/attention-circle/neutral-triangle markers
  have separate theme colors. Purpose is semantic block/context based, never
  inferred from punctuation. Plain prose stays plain; raw HTML stays escaped.
- Square text/card/editor surfaces and persistent definition-entry wrappers.
  Supporting icons anchor to their own cards, including footer cards. Prompt
  and code start at the same top edge. Editor uses 24px; output remains 24px.
- All 23 active Level 2 formulas own authored DefinitionList symbol parts through
  existing RDF `dct:hasPart`. Generic compilation preserves their complete text,
  motifs and provenance; formula units render centered math with legend boxes
  underneath, separate from applicability cards. No LaTeX-derived explanations,
  new vocabulary/schema or scientific values in renderer code. 32 scenes remain.
- Water results use one intrinsic-height surface; observations/units/values
  remain unchanged. Added cell sketch uses the existing 100 → 200 → 1600 case.

## Files or resources changed

- Shared Pitch primitive styles, `preview.ts`, `main.ts`, new teaching text/SVG
  helpers and regression tests; generic Reveal formula-unit policy/tests.
- `scripts/generate_canonical_runtime.py`: authored formula-part expansion and
  safe static prompt formatting, retaining existing contracts.
- Exact Mean Values examples/scenes/path TriG, dice/cell assets, relevant tests.
- README/migration notes, this handoff, only System state.
- Generated Pitch/self-study HTML excluded. Original owner worktree and
  Chemometrics state untouched. Overlapping #257 work remains serialized.

## Verification

- [x] Full `npm test` passed on committed feature basis `5a0f973`: 400 Python
  tests and every following phase, including 101 Reveal and 180 Pitch tests.
  External validation of the final audit head remains required.
- [x] 34 focused Mean Values tests and SHACL passed; all 23 active formulas have
  two complete authored legend entries. Initial URI datatype and old pairing
  count failures were fixed without weakening SHACL or scientific checks.
- [x] Production build passed (322 modules; existing bundle-size warning).
- [x] Ordinary `npm run pitch:intro`, 5173, overworld → Level 2. All five R labs
  executed successfully and Reset restored their placeholders. Seeded outputs
  unchanged; simulation includes 50,000 repetitions.
- [x] Dark/light screenshots at 1440×900 and responsive reflow at 390×844;
  live Alt+T changed inline SVG color from `rgb(98,239,255)` to `rgb(0,90,120)`.
  Transparent canvas, no duplicate image, zero illustration/flow intersections,
  exactly two warmup question bullets, 24px editor/output measured.
- [x] All 21 supporting-header text ranges measured without icon intersections
  at wide size. Symbols retain case instead of inheriting uppercase card chrome.
- [x] Actual browser sanitizer rejected script/foreignObject elements and stripped
  event handlers/external paints. Only exact authored same-origin SVG GETs are
  enabled alongside pinned vendor requests; no new external requests/tracking.
- [x] Level 1 opens and retains its three-card formula legend. Its current active
  path has zero executable code labs; no Level 1 R execution is claimed.
- [x] Native button focus, CodeMirror keyboard isolation, polite output, accessible
  SVG alternatives and hidden decorative markers retained. Documentation updated.

Local evidence under the approved
`C:/Users/PCUser/AppData/Local/Temp/opencode/browser-tools/` directory:
`course261.cjs`, `261-report.json`, `verify261.cjs`, `261-verification.json`,
`261-{1440,390}-{dark,light}-*.png`, `261-level1-formula-legend.png`.

## Decisions and assumptions

- This is one shared-primitives increment, not a whole-course CSS redesign.
  No resource/scene/filename-driven layout selector was introduced.
- Paragraph/strong/unordered-list syntax is an inert supported Markdown subset.
  Marker purposes are uniform within a semantic block/list. Mixed per-item
  question/statement purposes would require explicit metadata in a separately
  assigned contract increment; they are not guessed by scanning punctuation.
- Formula legend units preserve authored source order. Comparison units retain
  their side-by-side logical-frame layout at portrait scale instead of stacking
  beyond the slide boundary or shrinking fonts to conceal overflow.
- The current worker-owned 5173 server was restarted only after identifying its
  process/worktree. Restart cleared a stale Vite outside-root module cache.

## Risks or unresolved questions

- Fresh portrait opening fails: `Reveal did not settle on requested course level
  document ex:path-chemometrics-mean-values-lecture--scene-document`. Portrait
  screenshots are **wide opening followed by resize**, not evidence of successful
  fresh portrait navigation. Do not claim this requirement passed or blame a
  specific cause without reproducing it. Navigation implementation is outside
  #261; #214 review obligation remains independent.
- Whole-deck portrait scaling is still small; broader #257 mobile/math fit and
  phrase-marker limitations are not waived by this increment.
- Quantitative TypeScript river/tracer animation is intentionally not implemented
  in #261. Its exact source data, playback and static/reduced-motion requirements
  remain in the issue for a separate manager assignment.
- Compatible current-main integration and exact-head external
  `agent-validator/project-chemie-digital` success remain mandatory. Local tests
  never authorize acceptance or merging of this stacked PR.

## Recommended manager action

Review #262 as a bounded result, retain all stacking/cross-track gates and obtain
fresh exact-head external evidence. Separately scope the fresh portrait entry
failure against #214 and the typed, RDF-driven river/tracer animation. No blanket
visual acceptance or self-acceptance is requested.
