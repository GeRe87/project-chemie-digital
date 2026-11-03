# Level 5: remote-led lecture stages

**Superseded delivery style:** the later request removes audience questions and
most reveals. See [the direct-explanation and Poisson review](chemometrics-level5-poisson-review.md)
for the current eleven-scene preview. The snapshot implementation remains reusable;
the 39-snapshot choreography below is historical, not the current lecture.

Status: local review, 2026-10-31. No commit, push, publication or deployment.
This supersedes the on-slide button/slider interaction described in the earlier
`chemometrics-level5-block1-review.md`. The seven-scene scope is unchanged.

## Delivery contract

The lecture is a conversation supported by a changing visual, not a self-paced
quiz. The instructor can remain beside the screen. PageDown, ArrowRight or Space
advances one stage; PageUp or ArrowLeft goes back. Only after the final stage does
the normal navigation leave the slide. The existing global Previous/Next controls
use the same navigation, but there are no content buttons, sliders or case selectors.
Standard keyboard focus semantics remain: Space on a focused global button belongs
to that button; PageDown/PageUp remain available for a remote.

Every stage is an authored RDF snapshot with an English discussion prompt. Going
back restores the exact earlier visual, parameter setting and collection history.
It does not generate another series or collect a result twice. Questions are spoken
to the room. No student devices, personal data or answer submissions are needed.

## Story and pauses

| Scene | Stages including the initial view | Dramaturgy |
| --- | --- | --- |
| B01 | 4 | Sample and question; outcomes; binary codes; Bernoulli name |
| B02 | 10 | Predict; first series; count; collect; repeat for two more series |
| B03a | 3 | One specified order; trial factors; probability and full legend |
| B03b | 5 | First order; two position changes; all 45 arrangements; count probability |
| B04 | 8 | Initial model; four probability comparisons; two trial-count comparisons; return and explain moments |
| B05 | 3 | Zero observation; prediction under known p; reverse to estimation |
| B06 | 6 | Each of cases A/B/C followed by its reasoning |

B02 retains the seeded stream, with counts 1, 3 and 0. Its bars are simulated
series frequencies, not exact probabilities. There is one count per collected
series. The stage ordering includes every displayed series, rather than selecting
convenient results. Three repetitions start a discussion; they do not establish
the distribution empirically.

B03b first changes actual sample positions. Its next visual shows all 45 distinct
two-positive arrangements, one sequence per row. Only the final stage introduces
the binomial formula. Positive/negative outcomes use both signs and color, with a
shared visible key. Repeating the full outcome word on every card is unnecessary.

B04 uses authored parameter snapshots, not scripted slider clicks:
`(10,.2), (10,.5), (10,.8), (10,.05), (10,.95), (20,.2), (100,.2), (10,.2)`.
The vertical scale stays 0 to 100 percent; the horizontal axis is explicitly an
absolute count and changes extent with n. The final return to the initial model
reveals expectation 2 and variance 1.6 with their authored formula/legend unit.
Absolute count variance grows with n; relative-frequency variance decreases.
The script provides prediction pauses before the next visual change.

## Shared implementation, not special slides

- `cd:hasBinaryStage` links ordered `cd:BinaryExperimentStage` resources to a model.
  Each snapshot has identity, provenance, position, prompt and a reveal level;
  relevant snapshots also author parameters, an arrangement, case or series index.
- Core validates bounds and reconstructs series snapshots deterministically from
  the initial seed. No DOM, Reveal.js, scene identities or authored story are in core.
- The D3 bridge consumes the existing `pcd-presentation-step` event. It declares a
  step count; the existing fragment preparation and stage-lock navigation do the
  rest. Repeated events for an unchanged step do not rerender the component.
- Formula disclosure uses actual authored lecture-stage positions. Formulas remain
  MathExpression resources with linked complete symbol legends, rendered together
  by the shared renderer. The compiler rejects unreachable disclosure stages.
- The standard `visual-formula` profile gives the visual the full stage until the
  formula is revealed. Desktop then uses adjacent surfaces. Narrow screens replace
  visual details with the full formula/legend unit, retaining the current result.
  Going back restores the visual. No scene-ID-based CSS or new slide DSL is used.
- Unstaged models retain exploratory runtime controls as a separate capability;
  this change does not create or publish a new self-study interface.

## Verification

- Pure tests: seeded snapshot reconstruction, forward/back independence, no double
  collection, model bounds, native event binding, duplicate-event suppression and
  listener cleanup.
- Compiler/SHACL tests: stage order and provenance, English prompts, parameter
  sequence, duplicate positions, out-of-range cases, unreachable formula stages,
  complete legends and accepted-course isolation.
- `npm run preview:level5:generate`: seven scenes.
- `npm run check:semantics`: conforms, fingerprint
  `d53f879435951ea25fdf3fb88138c5f40c1b700176ed7af2c6eb666f1c2e8989`.
- Browser script: `check-level5-lecture.cjs` in the approved local OpenCode temp
  directory. It checks no content controls, every snapshot forwards and backwards,
  fragment-to-slide boundaries, exact restoration, disclosure and visible bounds.
  Screenshot files use the prefix `lecture-`.
- Current browser matrix passes in Edge and Firefox: eight theme/viewport
  combinations per engine, each covering all seven scenes and all 39 snapshots
  forward and backward. Dimensions include 1731 x 1006, 1440 x 900, 1280 x 720,
  1920 x 1080, 700 x 1000, 640 x 960 and 390 x 844, with light/dark mobile views.
  `check-level5-lecture-continuity.cjs` additionally traverses the entire lecture
  forwards and backwards without hash jumps. Page-boundary geometry is assessed
  after the existing 800 ms cosmetic transition, not during its animation.
- All 18 targeted Python tests and 71 targeted Node tests pass. Visual review
  includes desktop and mobile final formula states. No browser errors were found.
- `npm test` is required separately. The previous run was stopped because it
  overlapped the requested redesign; its partial output is not validation evidence
  for this version. The fresh complete run passed: 574 Python tests and all Node
  suites, including runtime generation/checks, Pitch and self-study. Local log:
  `C:/Users/PCUser/AppData/Local/Temp/opencode/level5-lecture-stages-npm-test.log`.

## Preview

Run `npm run preview:level5`, then open:

<http://127.0.0.1:5173/authoring.html?preview=authoring-level5-block1#/ex:l5-b01-scene--scene>

For the five new scenes directly:

<http://127.0.0.1:5173/authoring.html?preview=authoring-level5-block1#/ex:l5-b03a-scene--scene>

The narration is available through the existing script view. Poisson and later
goodness-of-fit tests remain subsequent review batches. Overall timing and the
missing additional source document remain unresolved; neither is silently settled
by this presentation change. Accepted Levels 0 to 4 and deployments are unchanged.
