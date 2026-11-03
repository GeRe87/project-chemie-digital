# ADR-0020: Seeded binary experiments on existing flow diagrams

- Status: Proposed, local Level-5 B01 through B06 review
- Date: 2026-10-30

## Reuse and actual gap

The repository already has semantic FlowDiagram nodes, edges, states, generic
diagram mounting, a replaceable D3FlowRuntimePort, script/static adapters and
an isolated authoring compiler. It has no renderer-neutral seeded Bernoulli
simulation. The existing observation explorer requires authored observations;
inventing a static dataset of simulation results would conflate a model with data.
The R editor remains useful for later tutorials, not as a prerequisite for a
short instructor-controlled experiment with hidden code.

## Decision

SceneDocument 1.13 adds an optional `binaryExperiment` capability to the existing
flow diagram, not a new slide type or a course-ID-based runtime. TriG authors the
model, mode, trial count, positive probability, initial seed and outcome labels.
SHACL, compiler and core reject invalid settings and provenance. The earlier
document versions reject this capability. Existing diagram meanings are unchanged.

The decision mode progressively reveals two outcomes, their 1/0 codes and the
authored experiment name. The series mode draws fresh model outcomes, separately
reveals their count, and collects exactly one count per completed series. A new
series cannot silently skip an uncollected result. Reset empties all results and
returns to the same seed. No parameters change while collecting the initial model.

Core contains the pure binary model/state transitions and a documented Mulberry32
teaching PRNG with fixed test vectors. Each trial consumes a fresh pseudorandom
draw; the model assumes iid Bernoulli trials, not a fixed quota of positives.
This is not a cryptographic or physical random source. Simulation results are
ephemeral derived state and are never written back as authored RDF observations.

The existing flow lifecycle receives a capability-specific runtime port. It uses
native keyboard-accessible buttons, explicit text labels and signs alongside
color, and no automatic transitions. The core does not import DOM, Reveal.js or
course identities. Script/static views retain model parameters, seed and caveats.
No real student answers or analytical measurements are collected.

The accepted course offering is untouched. B01/B02 use a separate local authoring
offering and disposable transport; the prior Level-5 uniform/wheel prototype is
not restored. Further binomial resources and other families remain subsequent
visually reviewed increments.

## Layout and language ownership

The lecture, narration, renderer controls and fallbacks are English. Course text
is authored in TriG; the renderer contains only generic outcome/series actions.
Composition inference stays unchanged: heading plus flow diagram uses the standard
visual stage. Shared stage geometry, the mobile heading token and interactive
controls live in their existing/shared presentation layers. The binary component
stylesheet owns only internal elements, uses theme tokens, and has no slide,
heading, scene-ID or `!important` rules. The observation explorer reuses the same
control primitives while retaining its existing minimum font size. Deterministic
tests enforce these boundaries rather than adding per-slide CSS corrections.

Interactive typography uses the actual host's inline container size, not the
browser viewport outside Reveal's scaled canvas. CSS still owns minimum card
width; the generic card-grid helper reads that capacity and balances columns
across the minimum row count. The existing runtime resize lifecycle remeasures
the grid without resetting experiment state. This prevents viewport-dependent
nine-plus-one wraps without authored column counts or per-scene overrides.

## Five-station binomial extension

The same capability now supports a specified sequence, arrangement exploration,
an exact probability mass chart with persistent parameter controls, a zero-count
question and authored assumption cases. Core owns stable mode-centred binomial
probabilities, moments and bounded arrangement unranking. These views calculate
model probabilities; only the original series mode simulates observations.

Formulas remain ordinary authored MathExpression resources with linked, complete
DefinitionList symbol legends. SceneItem `revealAtStage` and `revealOn` author the
existing progressive-disclosure metadata for the formula and its expanded legend
together. The compiler rejects a trigger outside the same scene. A generic semantic
stage event bridges the flow lifecycle to disclosure without importing Reveal
into the core model. Reset and parameter changes hide both resources again.

The standard `visual-formula` profile is inferred from one diagram or chart and
one formula/legend unit, irrespective of capability or resource identity. Desktop
uses adjacent surfaces. Narrow screens replace the marked interactive details
with the revealed formula unit, retaining controls, the current result and Reset.
Reset restores those details. Formula and complete legend never alternate with
each other. Shared layout CSS, not the binary component, owns this composition.

## Lecture delivery revision, 2026-10-31

Authored `BinaryExperimentStage` snapshots replace content controls in the lecture.
All seven preview scenes now have an ordered initial view and subsequent prompts,
visual states and bounded parameter comparisons. The D3 stage bridge declares a
native presentation-step count and consumes the existing presentation-step event.
Reveal remains encapsulated in the existing presentation adapter; no parallel
navigation counter or automation of hidden button clicks is introduced.

Backward navigation reconstructs earlier seeded series and collection history,
rather than undoing imperative button side effects. The lecture contains no content
buttons, sliders or case selectors. Global navigation remains standard. Models
without authored lecture stages retain the exploratory controls, but that is not
the lecture delivery mode and no new self-study deployment is created here.

Formula/legend disclosure uses actual authored lecture stage positions, and the
compiler rejects positions beyond the trigger's available stages. Before disclosure
the visual occupies the full standard composition surface. B03b changes from sample
positions to a bounded overview of all arrangements, rather than merely revealing a
number. The lecture story and parameter sequence stay in TriG, never scene-ID branches.

## Direct-explanation revision

The subsequent instructor review removes the frequent questions and small reveals.
An authored stage list can now contain one complete initial snapshot and declare
zero native fragments. B01 through B06 retain only six extra comparison advances;
formulas and complete legends are initially visible. Story text and narration are
declarative. Four Poisson explanations reuse standard charts, media and formulas,
not another specialized runtime. See `chemometrics-level5-poisson-review.md` for
the current authoring scope and verification boundary.
