# Issue #80 handoff — Phase 2e end-to-end acceptance

## Branch / role / scope

- Branch: `agent/80-phase2e-e2e-acceptance`
- Issue: #80
- Role: QA, DevOps, Security, and Accessibility Engineer
- Scope: verification/release readiness only.

No TriG, SHACL, scientific content, SceneDocument semantics, poll semantics, production runtime behavior or visual design was changed in this worker turn.

## Acceptance artifact

Added:

- `docs/phase-2e-end-to-end-acceptance.md`

It records the deterministic Phase 2e demonstration and failure-mode choreography for:

1. authoritative automated validation;
2. normal/static Firefox mode;
3. connected-interactive Firefox mode;
4. public-Internet-offline local-runtime operation;
5. unavailable poll-provider fail-closed behavior;
6. unavailable local CodeMirror/webR fail-closed behavior;
7. accessibility/privacy checks;
8. the exact-head evidence rule before merge.

The document keeps real UDE LimeSurvey credentials/configuration and all Phase 3 platform work out of scope.

## Existing automated evidence inspected

The existing repository tests already guard most Phase 2e invariants:

### Canonical semantic / SceneDocument path

- `tests/test_standard_deviation_knowledge.py`
  - nine-scene path ordering;
  - authored resource resolution;
  - accepted SceneItem role/path contract;
  - graph-backed audience poll and options;
  - poll position 4 and executable R position 5;
  - canonical R code authored in RDF;
  - SHACL/meta-SHACL and dataset fingerprint stability.

- `apps/pitch/test/preview.test.ts`
  - one canonical fingerprinted Dataset snapshot;
  - complete nine-scene render;
  - RDF identity, provenance and relation-path metadata;
  - local KaTeX rendering with spoken mathematical alternative;
  - graph-backed poll before executable R;
  - static prompt/options and code fallback;
  - complete nine-item static fallback boundary;
  - default network guard.

### Graph/navigation behavior

- `apps/pitch/test/graph-summary-shell.test.ts`
  - summary/graph switching;
  - deterministic graph focus;
  - return to presentation/invoker;
  - reduced-motion/static graph behavior;
  - keyboard forwarding only in graph mode;
  - presentation-visible and summary fallbacks on projection/render failures.

### CodeMirror / webR / offline runtime

- `apps/pitch/test/code-runtime.test.ts`
  - explicit `?interactive=1` opt-in;
  - local pinned CodeMirror/webR paths;
  - no public runtime URL in browser runtime code;
  - `webr.js` browser entry and `ChannelType.PostMessage`;
  - coherent CodeMirror dependency graph and keyboard isolation;
  - explicit preparation plus network-free preflight contract.

### Poll privacy / fail-closed contract

- `apps/pitch/test/poll-runtime.test.ts`
  - local default provider endpoint plus explicit override;
  - aggregate-only canonical option contract;
  - mismatch rejection/fail-closed behavior;
  - no LimeSurvey administrative credentials or RemoteControl methods in browser code.

- `tests/test_limesurvey_poll_proxy.py`
  - configured-field-only response extraction;
  - answer-code to canonical-option mapping without authored labels;
  - aggregate-only demo payload;
  - no authored poll labels duplicated into the proxy.

## Narrow acceptance regression added

Updated `apps/pitch/test/code-runtime.test.ts` with one release-readiness test that guards two previously unasserted integration invariants:

- both `mountExecutableCodeBlocks(root)` and `mountLivePolls(...)` are invoked only inside the explicit `if (connectedInteractive)` gate in `main.ts`;
- the R output remains labelled `R-Ausgabe` and retains `aria-live="polite"`.

This adds no production behavior and does not duplicate the existing semantic/runtime tests.

## Production-defect inspection result

Static inspection of the acceptance matrix against the existing implementation/tests found no new production defect requiring a repair assignment.

This statement is limited to repository inspection. It is **not** a claim that the branch has passed `npm test` or manual browser acceptance from this GitHub-connector worker environment.

## Automated validation status

No local `npm test` result is claimed in this worker environment.

After the final acceptance branch head is published, the installed exact-head validator must report:

```text
agent-validator/project-chemie-digital = success
```

Any validator failure must be reviewed before owner Firefox acceptance.

## Owner Firefox gate after validator success

Follow `docs/phase-2e-end-to-end-acceptance.md` on the unchanged validated PR head. In particular:

1. force-refresh vendor cache while online;
2. verify normal/static mode;
3. verify graph/summary/presentation switching;
4. verify connected poll + CodeMirror + webR;
5. confirm `[1] 2` and `[1] 1` for the two canonical R checks;
6. disconnect public Internet and repeat network-free preflight and R execution;
7. stop the poll demo and verify authored poll/code content survives;
8. temporarily rename the vendor cache and verify static-code fail-closed behavior;
9. verify keyboard isolation, mathematical alternative, R live region and privacy/network boundaries;
10. report unexpected Firefox console errors, if any.

Browser evidence must be recorded against the exact head. Head movement invalidates it.

## Worker return rule

Open a draft PR with the validator marker and return to the manager. Do not merge or declare Phase 2e complete in this worker turn.
