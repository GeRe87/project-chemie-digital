# ADR-0023: Published counts without artificial observations

- Status: Proposed, local C13 authoring review
- Date: 2026-10-31

## Gap

The histogram already renders raw observations, density normalization and reference
curves. A reproducible simulation can instead publish exact bin counts. Expanding
those counts into repeated midpoint values would falsely invent individual values;
embedding thousands of individual means is unnecessary for this fixed lecture view.

## Decision

Add optional `binCounts` to 1D HistogramBlock in the unpublished SceneDocument 1.13
proposal. Its counts align one-to-one with existing authored `edges`; `data` must
be empty. TriG authors `cd:binCounts` as a named RDF list on the Dataset. The compiler
preserves its source relation and promotes affected documents to 1.13. No JSON
semantic source or distribution-specific renderer is introduced.

Compiler/Core reject negative, fractional, nonfinite or unsafe counts; a zero or
unsafe total; a count/edge cardinality mismatch; raw/count mixtures; 2D use; and bin
adjustment. Fixed published frequencies cannot be rebinned without their raw data.
SHACL additionally checks the Dataset/list contract, nonnegative integer counts,
positive total, no raw observations and fixed 1D chart usage.

Shared histogram arithmetic calculates count or density heights from exact counts.
Unequal widths still require density normalization. Rendering, numerical text
fallbacks and static HTML preserve the actual total, including empty bins. They
explicitly distinguish published counts from recoverable raw observations and do
not reconstruct midpoints. Curves remain separate and never enter the count total.

Omission preserves the existing raw-observation path, document versions and output.
The helper accepts copies of identical edges but rejects changed bins. Existing
interactive histograms continue to use their raw values. No new CSS is needed.

## Scientific provenance

C13 publishes 5,000 sample-mean counts and the first four-value sample in TriG, with
an authored reproducible JavaScript protocol as a WorkedExample Markdown literal.
It specifies the model, seed, PRNG, normal transform, draw consumption, sample size,
repetition count, edges and boundary behavior. The protocol is not executed by the
presentation or compiler. Deterministic tests replay it independently in Node and
verify every count, first-sample value and arithmetic mean. Test JSON is disposable
process transport, not an authored semantic source.

## Verification

Core and renderer tests cover safe-count validation, version gating, no midpoint
substitution, exact totals, density area, locked edges, numerical alternatives and
mount cleanup. Python tests cover compilation/SHACL, full simulation replay and
static HTML. Browser checks verify 5,000 entries across forty bins and the distinct
individual-population reference curve.
