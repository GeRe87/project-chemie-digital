# Compact variance and Bessel lecture: local review

## Scope and actual state

Implementation worktree: `C:\Users\PCUser\AppData\Local\Temp\opencode\variance-first-two-published`.
Branch: `agent/variance-first-two-published`; unchanged HEAD:
`05d8ff8091bbb3ec83e8dce1b6191637d1fad5c9`.
All accumulated work remains uncommitted. No PR, push, merge or integration.

The actual active path had 71 scenes at the start of this revision and now has
46 (25 fewer, approximately 35%). Counting inclusively from the first MSD
result to the final residual-df interpretation, the old range was 10–48
(39 scenes), and the new range is 8–23 (16 scenes, approximately 59% fewer).
These precise landmarks supersede the preliminary progress-message count.
Earlier scene definitions, derivations and path-step resources are preserved;
only the selected `hasStep` list changes.

## Primary teaching sequence

| New positions | Purpose |
| --- | --- |
| 1–5 | Existing motivation, unchanged A/B observations and residuals |
| 6 | Zero-sum result; complete three-step proof is optional |
| 7–8 | Existing squared residuals and observed MSD |
| 9 | Side-by-side empirical MSD and theoretical mean/variance definitions |
| 10–11 | Expectation linearity; variance scaling and covariance |
| 12 | Existing lake sample and its observable quantities |
| 13 | Explicit question comparing E[MSD] with unknown population variance |
| 14–15 | Existing repeated-sampling/Monte Carlo illustrations |
| 16 | Centered difference, square/sum operation and normalized identity |
| 17 | Apply expectation and recognize individual/mean variances |
| 18 | Sample-mean variance result with a complete optional proof |
| 19 | Substitute the helper result and factor the MSD bias |
| 20–21 | Correct the random statistic, then compute its observed value |
| 22 | Existing Monte Carlo/theory comparison |
| 23 | One residual constraint and the three-observation example |
| 24–46 | All 23 later worked-example/SD/precision/RSD/replication/R scenes retained |

The package contains exact old/new scene lists and an old-scene-to-new-scene
comparison. The main argument no longer gives each algebraic operation its own
scene. Optional proofs introduce no Reveal fragments or hidden slide stages.

## Detail windows and canonical resources

`cd:hasDerivationDetail` links an ordinary `MathExpression` or a displayed
`MathematicalDerivationSection` to a complete `MathematicalDerivation`.
The existing authored short sections partition its ordered steps. The compiler
rejects missing/overlapping coverage and disconnected boundaries. SHACL checks
link types and coverage. This is an additive SceneDocument 1.7 capability:
`MathBlock.derivationDetails`, retaining graph-attributed provenance.

| Entry point | Full proof |
| --- | --- |
| Residual zero-sum formula | Reused `ex:derivation-residual-zero`, three steps |
| Central normalized identity | New `ex:cv-algebra-proof`, four steps: binomial expansion, finite sum, centered-sum substitution, collection |
| Sample-mean variance result | New `ex:cv-mean-proof`, nine steps including E[X̄], the general variance definition, centering at μ, scaling and zero covariances |

Each proof shows its starting point and every result. Each operation can be
expanded to see its general mathematical rule, applied formula, explanation
and prerequisites. Conditions and complete symbol definitions remain available.
The older expanded mean/error derivations remain canonical, but are not forced
into the primary detail dialog or active path.

New primary one-operation derivations are `ex:cv-main-algebra`,
`ex:cv-expectation` and `ex:cv-correction`; `ex:bf-section6` is reused for bias
factorization. Existing expectation/variance definitions and formulas are
referenced rather than changing the original scientific data.

Shared rules retain graph
`https://w3id.org/project-chemie-digital/graph/mathematics/rules`.
Reused rules include expectation of constants, affine expectation, addition,
finite averages, variance definition/scaling/covariance, common moments,
binomial expansion, sum linearity and arithmetic-mean substitution.
New reusable rules are:

- `ex:rule-expectation-equality`
- `ex:rule-second-moment`
- `ex:rule-independent-product`
- `ex:rule-variance-uncorrelated-sum`
- `ex:rule-mean-centered-squares`
- `ex:rule-fixed-center-sum`
- `ex:rule-substitute-and-factor` (available library resource, not a required slide)

Second moments and independent-product rules are canonical supplementary
resources; their extra proof sequence is not added to the main path.
Shared rule ownership, unique formula resolution, prerequisites, legends and
identical resolution through another LearningPath are tested.

## Mathematical checks

- Lowercase observations/means and uppercase random sample quantities are
  distinguished; S² denotes the statistic and s² its observed value.
- E[MSD] concerns hypothetical repetition. An individual MSD may exceed σ².
- The normalized squared-distance identity is deterministic per realization;
  the squared shift is nonnegative but its unknown value is not computed from
  one real sample.
- Linearity of expectation does not assume independence.
- The mean-variance result needs common expectations, common finite variances,
  fixed positive n and pairwise zero covariance. iid observations suffice;
  normality is unnecessary. The zero-covariance operation has its own explicit
  rule rather than incorrectly requiring independence.
- n > 1 is required by the correction. Unbiasedness does not imply exact
  equality for a single sample, or unbiasedness after taking a square root.
- Residual df describe freely varying coordinates, not statistically
  independent residuals. The expectation proof, not counting alone, establishes
  unbiasedness.
- Exact rational arithmetic verifies the normalized identity on unchanged A/B
  values and the expectations/bias/correction over every sample of a finite
  non-normal population.

## Generic implementation

Canonical compiler → SceneDocument → existing generic renderer remains the only
content pipeline. There are no scientific-IRI, title, formula-string or
scene-number rendering switches. The new content is authored only in TriG.

The existing native rule dialog handles both individual operations and full
proofs. It retains the same modal navigation shielding, Escape, close button,
Tab containment and focus return. Native `details` elements expose individual
operations without creating more slide states. CSS is scoped to generic math
detail classes. Reveal/self-study plans and static fallbacks preserve proofs.

## Validation and evidence

- Final semantic fingerprint:
  `8ccca0e5fb86d3a9fbeb7ff1b68e5311b1eb17eabbe5c2e729d77acad8d46497`.
- SHACL: `Conforms: True`; offering-level canonical generation succeeds.
- 23 targeted Python tests pass (9 compact sequence/library/exact-moment tests
  and 14 derivation compiler/reference tests).
- 44 targeted Node tests pass: derivation contract/rendering, step navigation,
  code runtime, course world and evidence composition.
- 228 final scene views: Dark/Light, 1440×900 and 1280×720; all variance scenes
  plus representative views of published modules. No detected region overflow,
  unintended slide scrolling, direct region overlap, KaTeX errors or visible
  em dash. Long modal proof content intentionally scrolls.
- 12 detail-dialog cases in development and another 12 in production test
  every authored operation, real Enter/Space activation, Escape/close,
  focus return, wheel input and unchanged underlying stage state.
- Full native-CDP-wheel forward/backward traversal, sustained/rapid input,
  direction changes, overlay interruption and wheel-to-end → overworld → Start
  pass in development and production. The wheel suite has no plain-page click
  fallback.
- Full normal-motion keyboard traversal passes for variance and independently
  for Introduction, Variables and Mean Values. Their scientific SceneDocument
  payloads match the before snapshot after removing provenance fields. The
  retained 23 later variance scenes also match.
- Direct Vite production build succeeds at `/compact-review/`. Production
  lazy loading, direct scene/level/legacy links and the optional proofs pass.
- Production webR probe succeeds, retaining the Base Path asset repair. An
  initial parallel probe encountered refused asset connections; its failed
  evidence is retained separately, and the retry passes without request errors.

### Explicit limits and unsuccessful checks

An initial broad `preview.test.ts` invocation had 20 failures: its default
single-SceneDocument fixture conflicts with the offering-level generated
runtime, and CSS-import assertions still expect eager imports in `main.ts`
rather than the existing lazy `presentation-main.ts`. This revision does not
claim those tests pass or change unrelated tests to hide them. The relevant
targeted tests and real offering browser regressions are reported separately.

The official `build_static_course.py` helper rejects a non-root base before
building, using its existing blanket subpath restriction. No helper-certified
subpath release artifact is claimed. A separate local Vite build and actual
subpath browser tests provide preview evidence, not publication authorization.

No full suite was run. Only Chromium/Edge automation was tested; physical mouse
hardware, other engines and projector/mobile devices were not tested. Large
bundle warnings and the full shared RDF snapshot remain known boundaries.

## Review package and stop gate

Gallery/report/evidence directory:
`C:\Users\PCUser\AppData\Local\Temp\opencode\variance-compact-review`.
ZIP:
`C:\Users\PCUser\AppData\Local\Temp\opencode\variance-compact-review.zip`.

Earlier review packages and the before snapshot remain untouched. The revision
is ready for scientific/visual review, not committed, published or integrated.
Stop after this report and wait for approval.
