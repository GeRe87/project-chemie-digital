# Level 5: C14 central limit theorem

Local review, 2026-10-31. No commit, push, publication or deployment.
Five complete scenes extend the preview from thirty-three to thirty-eight scenes.

## Lecture views

| Scene | Complete explanation |
| --- | --- |
| C14a | Exact expectation, variance and SD identities; theoretical SDs 9, 4.5, 2.25 and 1.125 mg/L |
| C14b | Frequency polygons for sample sizes 1 and 4, 5,000 sample means each |
| C14c | Frequency polygons for sizes 16 and 64 on identical axes |
| C14d | All 5,000 size-64 standardized means versus a standard-normal reference, with the distributional-limit formula |
| C14e | iid/finite-variance assumptions, no universal size-30 rule and the exact-normal special case |

All authored text, captions, narration and alternatives are English. Every slide
is complete on entry without questions, controls, quizzes or extra reveal stages.
Both formulas have independent, complete authored symbol legends linked by
`dct:hasPart` and rendered on the same slide through the shared formula unit.

## Scientific distinctions

- Keep C13's specified individual lognormal population: arithmetic expectation
  10 mg/L and population SD 9 mg/L. It is not changed by increasing sample size.
- Under independent identically distributed sampling with finite variance, the
  sample mean's expectation and variance identities are exact. The SD values in
  C14a are theoretical, not estimates fitted to a simulation. The CLT is a separate
  asymptotic statement about standardized distributions with finite positive variance.
- The CLT denominator is the specified population SD, not a sample estimate.
  Standardization subtracts the true mean and scales by the true SD divided by
  square root of size. Standardized quantities and their density are dimensionless.
- A normal-like finite histogram is not an exact normal identity or a universal
  approximation error guarantee. Tail behavior may still differ. The arrow denotes
  convergence in distribution as size increases, not individual realizations
  converging to zero or the original population becoming normal.
- This iid theorem does not excuse correlation, drift, changing populations or
  infinite variance. Heavy tails can slow convergence. There is no universal
  sample-size-30 rule, especially for extreme-tail probabilities.
- With independent normal individuals from one common population, a sample mean
  is exactly normal for every positive sample size. That is stronger than the
  general asymptotic CLT statement.

## Reproducible comparisons and honest plotting limits

The authored WorkedExample protocol retains C13's Mulberry32 and uncached cosine
Box-Muller algorithm. A separate comparison resets seed 20261031 and uses one
continuous stream, partitioned into disjoint new samples in size order 1, 4, 16, 64,
with 5,000 samples each. This consumes 425,000 individual draws and 850,000 uniforms.
The old C13 four-value collection is not reused as the size-four comparison. The
seed reset is for reproducibility, not a claim of independence between lecture
illustrations; independence is the within-model sampling assumption.

The two raw-scale charts are explicitly frequency polygons, not fitted smooth
densities or disguised observation traces. Heights are counts divided by all 5,000
means and width-one bins. Linear connections join bin midpoints, with boundary bin
heights carried to the display edge; unused all-zero runs can omit interior vertices.
The polygons approximate shape. Their vertices are not raw observations and their
areas are not exact population probabilities.

Both comparisons use the same concentration window 0 to 40 mg/L and exact density
range 0 to 0.38 L/mg. Solid/dashed lines are explicitly identified in the caption,
so the comparison does not rely on color alone. The size-one simulation has 80
means above 40 mg/L; the other three have none outside this window. All values
remain in the reproducible protocol, and the denominator is never changed to the
displayed 4,920. The outside count is visible, not silently clipped or renormalized.
The common window is an explicit display choice, not bounded model support.

The standardized size-64 histogram uses width-0.5 bins from -6 to 6 and retains all
5,000 values. Its minimum is -2.8553490373465515 and maximum 4.793893986539489. The
normal reference uses theoretical sampled coordinates with no fitted mean or SD
and extends beyond the plot. Both mathematical references and frequency polygons
are connected approximately for drawing.

## Shared implementation and privacy

Semantic resources live in `ontology/dataset/chemometrics-level5-clt.trig`; authored
numerical vertices and published counts are in `chemometrics-level5-clt-data.trig`.
Both retain named-graph identity and derivation links. Existing complete bar/line
charts, published histograms, reference curves, definition cards and formula units
are reused. No Core contract, compiler, SHACL rule or runtime generator is added.
The reproducibility code is authored provenance, not executable lecture UI.

One existing narrow-screen opt-in rule now also removes the projection-sized SVG
minimum height from complete line charts. It is capability-based, with no scene IDs,
and leaves legacy charts without the option unchanged. Numerical captions and the
complete formula legends remain visible on phones. No personal data, network
service, learner storage, accepted Levels 0-4 content or deployment is changed.

S15/T16 confidence intervals, estimation of standard error, goodness-of-fit tests
and overall lecture timing remain separate later work.

## Verification

- Preview generation produces thirty-eight scenes.
- All 70 targeted Level-5 Python tests pass. Seven new tests independently replay
  the authored JavaScript simulation in Python; check every frequency-polygon
  vertex, retained tails, exact SDs, unchanged axes, standardized counts, normal
  reference coordinates, complete legends, language and scientific guardrails.
- Edge and Firefox pass all five new scenes at 1731 x 1006 light, 1280 x 720 dark
  and 390 x 844 light. Checks cover no controls/questions/reveal fragments, full
  formula legends, two distinctly styled comparison traces, no apparent raw-point
  markers and all 5,000 standardized means counted in 24 bins. Representative
  desktop and mobile screenshots reviewed.
- Current-source semantic validation conforms with dataset fingerprint
  `70f2b029670bb1d0245e0a28ed48a85ecfa57b6b55c7c1b502d92f0c34aec425`.
- Native PageDown traversal passes all thirty-eight slides in Edge and Firefox,
  with only the six original comparison advances. PageUp reverses C14 without
  extra reveals.
- The full current-source Edge matrix passes. After normalizing the temporary
  audit to exact native scroll-page boundaries following font/chart reflow, the
  full Firefox matrix also passes. The normalized Edge rerun passes through C13b
  before its overall timeout; a separate tail run passes C13c and all five C14
  slides in all three configurations. Boundary alignment is an audit adjustment,
  not an application navigation change.
- `git diff --check` passes with line-ending warnings only.
- The C14 full `npm test` run completed successfully: 626 Python tests and all Node
  suites pass. Its log is
  `C:\Users\PCUser\AppData\Local\Temp\opencode\level5-c14-final-npm-test.log`.
  This is C14-era evidence, not validation of the later S15/T16 increments.

## Preview

<http://127.0.0.1:5173/authoring.html?preview=authoring-level5-block1#/ex:l5-c14a-scene--scene>

The following S15 increment is documented in
[the standard-error review](chemometrics-level5-standard-error-review.md).
