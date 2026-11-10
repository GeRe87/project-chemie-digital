# Bounded canonical ANOVA probe

This is a three-scene vertical technical preview, not a finished lecture: L7-07, L7-13 and L7-19 out of the proposed 47 scenes. Existing lectures are unchanged. There is no Offering, Placement, menu integration, publication or deployment.

## Canonical resources and generation

Only the two new TriG files author semantic content. The data graph contains 36 original synthetic observations. The master dataset, river subset and six cell datasets share observation identities. Observation positions are within-cell replicate numbers, not a global ordered series. Matrix and method membership use SKOS concepts and dct:subject, not label parsing. All observations represent independent sample preparations, not repeated injections.

Use the existing Python API from scripts/generate_canonical_runtime.py:

```python
from rdf_dataset import assemble_dataset
from generate_canonical_runtime import CoursePathReference, compile_scene_document

dataset = assemble_dataset()
document = compile_scene_document(dataset, CoursePathReference(
    'https://w3id.org/project-chemie-digital/resource/path-chemometrics-level7-anova-lecture',
    'https://w3id.org/project-chemie-digital/graph/paths/chemometrics-level7-anova-lecture'))
```

The resulting SceneDocument 1.15 is private generated transport, not an additional authored semantic source. Do not commit a hand-maintained content JSON copy. The path selects final scene identities l7-scene07, l7-scene13 and l7-scene19 in positions 1 through 3. All charts use the existing grouped anova-one-way experiment contract and its three river groups. View defaults are respectively 0, 1 and 2. The existing latex communicative role is discovered from canonical scene items before generation; the formula legend is attached through dct:hasPart, not a duplicate visible block.

## Scientific interpretation

Values stay in percent without division by 100. Differences are percentage points; sums of squares and mean squares use percentage points squared. The original river means are 94%, 98% and 93%, with grand mean 95%. Baseline SS_between is 84 and SS_within is 30; numerator and denominator degrees of freedom are 2 and 15. Thus baseline F is 21 and its right-tail probability is 0.0000448356040690602. These fixed baseline numbers occur in narration only in L7-19 and do not describe transformed states. Live chart descriptions contain no fixed F or p. Scaling creates explicitly hypothetical teaching states. Classical inference assumes independent Normal errors with common positive variance. The omnibus rejection is not a pairwise conclusion. Zero within-group variation requires a semantic degenerate-state explanation, not silent NaN or an ordinary zero F.

Package attribution is synthetic teaching provenance, not experimental provenance. NIST and SciPy support methods claims only. L7-19 uses the existing generic F-reference panel in runAnovaExperiment view 2, not a separately authored drawing or a new statistical engine. Its initial state is F = 21 with numerator and denominator degrees of freedom 2 and 15. The existing panel provides the F-density, statistic marker and visible right-tail shading. Display bounds omit infinity, but the analytic probability counts the full right tail. These describe the existing implementation contract, not a completed browser verification.

## Verification still required

Run the focused integration and exact Level-6 compiler regression tests:

```text
python -m unittest discover -s tests -p test_level7_anova_probe.py
```

The full repository suite and complete semantic gate remain pending. Targeted checks passed on 2026-11-10: 202 core tests, 112 diagram-renderer tests, TypeScript type checking, 33 grouped compiler/SHACL fixtures and five canonical-content tests. Level 6 compiles exactly as before. A focused RDFS/SHACL check of the 92 new subjects passed using the complete authored shapes and actual vocabulary definitions. This is not the full dataset gate.

The actual canonical RDF-to-compiler-to-core bridge passed on all three scenes: original F = 21 and its tail probability, transformed F = 336 with independently calculated analytic tail, equal means F = 0 / p = 1, zero error variance represented as undefined, exact reset, and immutable original data.

The real local browser at 1200 x 750 showed all three projections. A keyboard increment changed between-group scale from 1 to 1.1, F from 21 to 25.41 and p to about 1.52e-5. Setting within-group scale to zero removed the invalid reference plot and displayed undefined F/p. Reset restored F = 21. The complete structured symbol legend opened with Enter on the same slide. The response axis displays its unit once. All 18 preparations remain represented, including exact ties; a single residual legend entry accompanies all 18 identified segments and the full numerical ledger.

Print, PDF, self-study, dark theme, broader viewport coverage and the final lecture rehearsal remain pending. Browser checks are direct local evidence, not an independent external validator.

A standalone Node numerical bridge command, independent of private transport or undocumented module imports, checks the known baseline tail identity for numerator degrees of freedom two:

```text
node -e "const p=Math.pow(15/(15+2*21),15/2);if(Math.abs(p-0.0000448356040690602)>1e-15)throw Error('baseline F tail');console.log(p)"
```

This command verifies the reference arithmetic only. The actual compiler-to-core bridge described above has additionally passed; full-suite acceptance remains pending.

## Deferred

Two-way interaction mechanics, all 47 scenes, seven standalone script chapters, broader source review, final accessibility review, course navigation and publication are deferred. The existing generic F-reference panel is reused; no separately authored F-tail drawing or new statistical engine is required. Full-suite and full semantic validation remain pending. No existing lecture changes or publication are authorized by this probe.
