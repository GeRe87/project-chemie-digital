# ADR-0028: Pairwise scoring and optional supporting material

- Status: Proposed (local Level-6 authoring)
- Date: 2026-11-08

## Decision

Extend the existing renderer-neutral `ScientificExperiment` mechanism with
`pairwise-score`. Authored observations provide finite values, stable identities,
labels, graph-attributed sources, and group code 0 or 1. Each group contains
1–8 observations. A bounded integer `step` selects completed comparisons.
The core calculates ordered cross-group scores (greater: 1, equal: 0.5, less: 0),
cumulative totals and the complete text ledger. D3 renders compare → score →
accumulate states with Previous, Next and Reset. Reduced-motion mode skips motion;
revision tokens prevent cancelled animations from advancing a reset state.
The mechanism contains no course identities or embedded example observations.

`cd:optionalMaterial` is an authored boolean on an illustration `SceneItem`, projected to the
existing optional-disclosure contract. Its selected resource label names the
keyboard-accessible control. The existing same-slide supporting workspace handles
Escape, focus restoration and narrow-screen placement. This is a native disclosure,
not a modal dialog. Static/Script views retain the full material; print exposes
the supporting illustration. It cannot simultaneously be a required reveal step.
The initial compiler supports image media only: formulas and their symbol legends
cannot be hidden as optional material.

Authored `MediaAsset` resources with `mediaType "text/html"` and HTTPS URIs are
reference links, not embedded web pages. Reveal places them in a small independent
footnote rail; Script keeps them in the relevant thematic chapter. Links open
new tabs with `noopener noreferrer`; no external content is loaded before a click.
Local Script SVG integrity checks remain unchanged. Reference footnotes and
optional blocks are excluded from primary composition inference.

## Consequences and limits

TriG remains the sole authored semantic source. No Reveal dependency enters core.
SHACL includes the mechanism and optional attribute; compiler/runtime checks
enforce bounded values, authored sources and disclosure compatibility.
The existing SceneDocument 1.14 scientific-experiment/disclosure transport is reused;
no new block kind or document field is introduced. Adapters must validate supported
experiment kinds explicitly. A static full ledger accompanies the interaction.
Reference chapters may use different statistic/tie conventions; lesson prose
declares its own exact probability calculation rather than borrowing a table
that excludes its ties.
