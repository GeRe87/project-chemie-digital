# Issue #76 handoff — live LimeSurvey audience poll

## Branch / PR

- Branch: `agent/76-limesurvey-live-poll`
- Draft PR: #77
- Base: current `main` after merged PR #75
- The old stacked #75 history was removed; the PR now contains only the polling increment plus its bounded semantic-integration repairs.

## Restack and semantic integration

The polling increment was cleanly restacked onto current `main` rather than carrying the historical `agent/74-codemirror-webr` stack forward.

Canonical graph ownership remains closed and unchanged:

- polling vocabulary (`AudiencePoll`, `PollOption`, `PollRole`, `hasAudiencePoll`, `hasPollOption`) lives in `graph/concepts`;
- the Standardabweichung poll, options and `standard-deviation -> hasAudiencePoll` relation live in `graph/specifications/standard-deviation`;
- `scene9-poll` and its scene membership live in `graph/scenes/standard-deviation`;
- poll-specific SHACL remains in `graph/shapes/core`.

No `concepts-poll`, `specifications/interactive-poll` or `scenes/interactive-poll` graph was added to the canonical registry.

The central `SceneItemShape` now narrowly permits `cd:PollRole` and `"cd:hasAudiencePoll"`, with targeted positive and negative semantic regressions. Scene 9 ordering is poll position 4 followed by the already-merged R code block at position 5.

## Architecture

`TriG -> canonical SceneDocument compiler -> PromptBlock -> Reveal poll shell -> LiveResponseProvider -> aggregate results`

LimeSurvey is a runtime provider only. It is deliberately absent from RDF and the SceneDocument domain contract.

## Canonical content

`ontology/dataset/interactive-poll.trig` adds:

- `cd:AudiencePoll`
- `cd:PollOption`
- `cd:PollRole`
- `cd:hasAudiencePoll`
- `cd:hasPollOption`

Poll prompt:

`Messreihe A: 9, 10, 11. Messreihe B: 6, 8, 10. Welche Messreihe ist präziser?`

Options are graph-backed resources `ex:sd-precision-option-a` and `ex:sd-precision-option-b`.

## Compiler / renderer boundary

`scripts/generate_canonical_runtime.py` compiles typed `AudiencePoll` resources directly to renderer-neutral `PromptBlock` values with:

- canonical poll source identity / provenance / `cd:hasAudiencePoll`
- option source identities / provenance / `cd:hasPollOption`
- `single-choice` response mode
- authored static fallback

Poll and option provenance resolves to the existing `graph/specifications/standard-deviation` graph. The static generated HTML fallback includes the poll prompt and both options.

`apps/pitch/src/preview.ts` renders the PromptBlock as `.live-poll` with canonical poll and option ids in data attributes.

## Connected runtime

`apps/pitch/src/poll-runtime.ts` defines a replaceable `LiveResponseProvider`.

The default HTTP provider calls:

`GET http://127.0.0.1:8787/polls/<canonical-poll-id>`

or a `pollEndpoint` query override.

The response contract contains only:

- poll id
- public participation URL
- optional QR URL
- total response count
- canonical option ids + aggregate counts

Visible option labels are read from the graph-backed PromptBlock DOM, not from the provider response.

## LimeSurvey proxy

`scripts/limesurvey_poll_proxy.py` is stdlib-only.

Demo mode:

```powershell
npm run poll:demo
```

Real mode uses RemoteControl 2 with:

- `get_session_key`
- field-restricted JSON `export_responses`
- `release_session_key`

Required environment variables:

- `LIMESURVEY_USERNAME`
- `LIMESURVEY_PASSWORD`
- `LIMESURVEY_SURVEY_ID`
- `LIMESURVEY_QUESTION_CODE`
- `LIMESURVEY_ANSWER_MAP`

Example answer map:

```json
{"A1":"ex:sd-precision-option-a","A2":"ex:sd-precision-option-b"}
```

Optional: `LIMESURVEY_RPC_URL`, `LIMESURVEY_AUTH_PLUGIN`, `LIMESURVEY_PARTICIPATION_URL`, `LIMESURVEY_QR_CODE_URL`, `PITCH_POLL_KEY`, `PITCH_ORIGIN`.

Credentials, session keys and individual responses never reach browser code.

## Validation status

Focused tests cover:

- RDF/SHACL poll semantics, allowed role/path and scene ordering
- canonical PromptBlock compilation, canonical provenance and static fallback
- browser aggregate parser / provider boundary
- canonical option identity matching
- proxy answer-code aggregation and absence of duplicated teaching labels

Exact head `8a73c5e50a7d2dc8834f8f78693b2477fcd81441` was validated by `agent-validator/project-chemie-digital`. All RDF/SHACL and Python semantic tests passed; the sole failure was the browser regression `apps/pitch/test/preview.test.ts`, which still expected the discarded `graph/specifications/interactive-poll` provenance even though the canonical compiler correctly emitted `graph/specifications/standard-deviation`.

The regression-only follow-up changes that one test expectation to `graph/specifications/standard-deviation`. No production code, RDF/SHACL, poll runtime, proxy behavior, credentials, or browser acceptance scope is changed. The branch is re-anchored onto the then-current `main`; the resulting exact head containing this handoff must be revalidated before runtime/browser acceptance.

## Later manual acceptance

Terminal 1:

```powershell
npm run poll:demo
```

Terminal 2:

```powershell
npm run pitch:dev
```

Open `http://127.0.0.1:5173/?interactive=1` and verify scene 9:

1. poll prompt/options render before the R editor;
2. demo aggregate bars update;
3. the static prompt/options remain if the proxy is unavailable;
4. the R code block still executes;
5. default mode without `?interactive=1` remains no-network/static.

## Follow-up for real UDE survey

Create/activate a single-choice LimeSurvey question, record the survey ID, question code and answer codes, then configure the proxy locally. If UDE RemoteControl authentication fails, inspect whether RemoteControl is enabled and whether an auth plugin value is required for the account.
