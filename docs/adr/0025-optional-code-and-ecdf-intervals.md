# ADR-0025: Optional reproducibility code and two-threshold ECDFs

- Status: Proposed, local review increment
- Date: 2026-11-02

## Context and decision

The compact lecture review requires visible experimental results without requiring
R execution. Full executable programs and their authored function glossaries must
remain available. Two consecutive ECDF slides should become one threshold/interval
experiment with identical observations and correct tie handling.

Reuse two existing renderer-neutral contracts rather than introduce presentation
layout identities into RDF:

1. `cd:optionalCode` is an optional boolean on a `cd:SceneItem` selecting a
   `cd:CodeExample` with `cd:CodeRole`. The compiler projects true to the existing
   `Disclosure.mode: "optional"`, including every expanded function-glossary block.
   The field does not authorize hiding formula legends. It cannot also specify a
   required reveal stage. Existing code remains main-stage material when absent
   or false. Normalize sibling disclosure order after expansion.
2. `cd:lowerThresholdInitial` optionally supplies the lower endpoint for an ECDF's
   existing threshold domain. It projects to `threshold.lowerInitial`. The initial
   lower bound must be finite, inside the domain and no greater than the initial
   upper threshold. It is not valid for count or other chart views. It adds no
   measurements or inferred distribution family.

Targeted SHACL shapes and compiler/core validation check the new authored metadata.
Existing SceneDocument contracts already permit optional disclosure and extensible
threshold configuration; no old version or path is removed. The vocabulary remains
TriG-authored; JSON is disposable generated transport.

## Adapter behavior

Reveal's composition, fit and lecture budget use main-stage blocks only. The pitch
adapter retains optional blocks in one native, keyboard-accessible details panel
on the same scene. Opening it creates no slide or history entry. Full source text
and the existing lazy local R runtime remain available. Escape closes the panel;
form input does not navigate the deck. Print hides optional code from slide pages;
the script/self-study and canonical static fallback retain the complete program.

The ECDF's interval is **lower excluded, upper included**. Subtract the inclusive
lower cumulative count from the inclusive upper count. Every lower-endpoint tie is
excluded; every upper-endpoint tie is included. Invalid crossed bounds leave the
last valid plot/readout unchanged with visible validation. Equal bounds give an
empty interval. A switch returns to a single upper threshold. Reset restores the
authored two-threshold state. The accessible fallback describes that same interval.
The shaded horizontal range is not presented as probability area under an ECDF.

Both widgets use existing theme tokens and generic component classes, never scene
IDs. Optional-code details do not collect learner data or make remote requests.
No workflow activation, commit, push, publication or deployment is authorized.
