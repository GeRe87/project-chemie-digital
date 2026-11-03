# Level 5: story-first distribution authoring

Local instructor-led English lecture. Applies to new distribution blocks and later
revisions of this lecture, not to accepted Levels 0-4.

## Current governing purpose: analytical distributions and simulation

The instructor's later clarification replaces the water-investigation narrative
as the mandatory organizing structure. The new main path is
`path-level5-analytical-distributions`: general PDF/CDF/inverse-CDF concepts,
Normal, Lognormal, chi-square, Student-t and F, distribution tests, a relationship
map and a live Monte Carlo application. Each family needs an analytical usecase,
model rationale and assumptions, a formula with an authored same-slide legend,
numerical substitution and interpretation. Introduce inverse CDF as a general
quantile operation before using critical values or generating simulation inputs.

The current illustrated revision uses Uniform(0,1) consistently for the general
PDF/CDF/inverse-CDF introduction, with explicit input/output axis roles. Introduce
analytical cases through existing SVG thumbnail cards and concise bullets before
their models and calculations. Show additive effects before normal notation.
The first normal control application uses its CDF directly; standardization is a
separate subsequent tool, never an unexplained prerequisite. Omit isolated density
height arithmetic without an analytical purpose. See the
[illustrated-usecase review](chemometrics-level5-illustrated-usecases-review.md).

The 51-scene [depth revision](chemometrics-level5-depth-review.md) strengthens this
pattern: explain how each distribution arises before applying it. Use linked PDF
area/CDF difference diagrams, numerical normal sigma ranges, and multiplicative
lognormal ranges in a complete particle-size case. State whose variation is being
modeled and distinguish individual ranges from confidence intervals. Introduce
chi-square, t and F through their normal-coordinate constructions, then connect
them to the actual variance, mean or precision question. Keep supporting reasoning
in narration and every displayed formula's legend visible on the same slide.

The current [55-scene storyline](chemometrics-level5-storyline-review.md) makes
the causal story visible, not narration-only: process picture first, then the
specific data question, construction, numerical answer and interpretation. Keep
one dataset through an inferential example and name every deliberate dataset change.
Introduce degrees of freedom before the sampling-reference families. Distinguish
a normal sample mean from a t-distributed ratio using estimated SE. Q-Q plots
precede KS; reuse the same compatible/departing data, overlay ECDF/CDF, then show
row/column lookup and a function for the calibrated cutoff. Standardization of
observations is optional; fitting parameters changes KS calibration. Pearson
uses grouped counts and an approximate reference, not the exact variance law.

The [IC precision revision](chemometrics-level5-ic-precision-review.md) replaces the
chi-square interval example with an actual analytical decision: six nitrate repeats,
fixed reference SD, observed variance, scaled squared residuals, five-df reference
and an upper-tail precision test. Show why a new reference distribution is needed
before showing its density. Keep the same six values throughout this section and
explicitly announce the later switch to the separate five-value t example.

Keep the older 70-scene path as supporting authored material, not a second required
prelude. Binomial/Poisson are supplementary rather than forced main blocks.
The earlier environmental-inference review remains historical evidence, not a
requirement to motivate every distribution with a water-body mean.

Use shared cards, diagrams, bullet/list, formula/legend, chart and code-workbench
compositions. Media are source-linked SVG assets with accessible English
alternatives and self-contained contrast for both themes. Do not add scene-ID
CSS or renderer-owned scientific content. The Monte Carlo measurement equation,
input models, executable R code, seed and saved reference are all authored in TriG.

## Continuing scope guardrails

For any investigation or measurement example, state its target quantity and
uncertainty scope. A model probability for a specified individual result is a
valid analytical exercise, not an estimate of an unknown population parameter.

Keep environmental sampling, laboratory repeats and uncertainty of an estimator
distinct. Repeated measurements of one sample cannot establish representativeness
for the water body. A technical-repeat confidence interval cannot be relabelled as
an interval for an environmental mean. Known-parameter probability calculations
remain useful tools, not estimates of the unknown population parameters.

The earlier lecture-wide review of all 76 supporting scenes is in
[Population-inference review](chemometrics-level5-population-inference-review.md).
Its data-scope cautions still apply; its water-body-first structure is superseded.

## Required sequence

1. Open with one or two formula-free slides telling a concrete chemistry story.
   Identify what we want to learn about the investigation target, how observations
   relate to it, and which quantity varies. Show observations or a clearly labelled
   constructed illustration before introducing notation.
2. Bridge to the random quantity and model. State the assumptions rather than
   claiming that the story, a few points or a plausible shape establishes them.
3. Introduce the distribution, parameters and formula. Every displayed formula
   must retain a complete visible authored symbol legend on that same slide.
4. Return to the original investigation question with the worked calculation,
   the quantity it estimates or informs, its uncertainty and its scope. If this is
   only a supporting model calculation, explicitly connect it to the later inference
   rather than implying it already answers the investigation question.

Keep the story explanatory, not a quiz. No audience response, mandatory control,
gratuitous reveal or extra comparison stage is needed. Presentation-remote
navigation must suffice. Retain the subtle authored topic context throughout.

## Content guardrails

- Build a visible chain across adjacent slides: observation, need for a model,
  assumption, calculation, interpretation. A new slide must show why it follows,
  through its heading or short existing context, not only through narration.
  Explicitly announce a change of dataset, population, scale or inference target.
  Do not present newly inserted story slides as a substitute for these bridges.
- Prefer “measured value”, “measurement result” or a named concentration quantity
  over the vague “reading”. Distinguish the measurement procedure from its result.

- Reuse the same authored observations and summaries wherever the story returns.
  Do not silently substitute a new dataset or infer specified population parameters
  from a tiny illustrative sample.
- Distinguish measured evidence, random teaching simulations, deterministic
  illustrations and theoretical reference curves visibly and in narration.
- Distinguish analytical repeats of one sample from independent environmental
  samples. Avoid implying that repeatability establishes accuracy or absence of bias.
- For variance, Student-t and F references, retain the precise normal-sampling and
  independence assumptions. Do not invent sample sizes or a formal test decision.
- Show only the short story and its visual on the slide. Put secondary explanation
  in English narration. Avoid em dashes in newly authored content.

## Implementation and checks

Author semantic resources, chart references, scene items and ordered path steps in
TriG. Reuse existing diagram/card/chart components and composition signatures.
Never add scene-ID styling or renderer-owned topic/story lookup tables.

Check story-before-model ordering, absence of formulas and hidden reveals on the
story slides, unchanged original mathematical content, shared data identities,
topic coverage, static alternatives and English narration. Check desktop, dark and
phone views and forward/reverse native navigation before full regression.

Existing B01/B02 and the illustrated Poisson P07a already provide story openings;
do not duplicate them. The known-SD standard-normal case is a comparison within the
mean-uncertainty story, not a separate unrelated distribution introduction.
