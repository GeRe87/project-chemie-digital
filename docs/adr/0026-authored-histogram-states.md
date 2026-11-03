# ADR-0026: Authored histogram snapshots on a fixed comparison grid

- Status: Proposed, local compact-lecture increment
- Date: 2026-11-02

## Decision

Extend the existing published-count histogram capability with ordered
`cd:HistogramState` resources selected through `cd:hasHistogramState`. Each state
has an explicit position, label, explanation and `cd:usesDataset` link. Its dataset
contains integer published bin counts in the chart's measurement units, not
reconstructed midpoint observations. All states share the chart's bin grid and
normalization. The first state must equal the chart's default counts.

The compiler projects these resources to optional `HistogramBlock.states` entries
with source references. Existing histograms are unchanged when the capability is
absent. Targeted SHACL, compiler and core checks reject malformed counts, missing
provenance, duplicate/noncontiguous positions, a changed default, raw-data mixtures,
two-dimensional states and interactive rebinning of published counts.

The shared histogram renderer supplies an accessible native state selector and
reset action. Selection updates the bars, n readout, active state identity, caption
and numerical fallback together. Its y-axis covers every state's density heights,
and the x-axis/bin grid is fixed: changing the sample count does not silently change
the comparison's scale. It is a saved experiment, not a claim of fresh randomness.
Browser execution needs neither R nor a remote service.

The initial state is the deterministic slide/PDF fallback. Print omits controls,
not the authored observation or explanation. Self-study and static text retain all
states, their sample counts and every published bin. The optional R reproduction
replays the same authored stream independently.

## First use and scope

The reviewed normal scene shows prefixes of 20, 50, 100 and 1,000 simulated readings
from the existing Park-Miller seed 20261102, with inverse-normal transformation,
mean 10.00 mg/L and SD 0.10 mg/L. Its 1,000-draw state reuses the original published
dataset. Independent Python replay checks every count; browser R checks each
prefix. Visible prose explicitly labels normality and independence as generating
assumptions, not empirical conclusions.

No scene IDs, plot coordinates, CSS classes or Reveal mechanics are authored in
the vocabulary. This is additive local authoring; it authorizes no workflow run,
publication, push or deployment.
