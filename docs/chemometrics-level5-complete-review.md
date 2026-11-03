# Complete English distribution lecture: local review candidate

The second independent review found real PDF defects missed by the original
checks. See [the V2 repair record](chemometrics-level5-review-v2.md) for reproduced
causes, stronger Gate-1 evidence and the still-open didactic work. The original
verification notes below are not a claim of V2 teaching approval.

## Selection and access

The complete compact selection now contains 65 authored content scenes plus the
renderer title, giving N01–N66. The independent review's section order is retained:
opening, normal, lognormal, chi-square, Student t, F/calibration, model checks,
and the dilution Monte Carlo case. Historical selections and their extended
mathematical material are retained; the default command is not replaced.

Generate the disposable preview with:

```text
npm run preview:level5:review-complete:generate
```

Local presentation:
<http://127.0.0.1:5173/authoring.html?preview=authoring-level5-review-complete&view=deck>

Local narrative script:
<http://127.0.0.1:5173/authoring.html?preview=authoring-level5-review-complete&view=deck&mode=script>

The **Slides PDF** link opens the separate one-slide-per-landscape-page view.
The script retains its own portrait print mode. Nothing is deployed or published.

## Authored source and experimental capability

- `ontology/dataset/chemometrics-level5-review-complete.trig` selects all scenes,
  combines the relevant original resources, records source-scene references,
  and keeps executable R in optional disclosures.
- `ontology/dataset/chemometrics-level5-review-experiments.trig` authors parameters,
  bounds, controls, provenance and paired calibration/count data. The six original
  CRM/device A and independent device B values are preserved exactly, including
  ties, and shown with the shared dot-plot renderer.
- `ontology/dataset/scientific-experiments.trig` defines the additive scientific
  chart capability and its targeted SHACL constraints.
- SceneDocument 1.14 carries renderer-neutral scientific experiments. Pure core
  functions calculate results; the D3 adapter owns controls and drawing. The
  self-study and Reveal adapters retain numerical static alternatives.
- A reused authored SceneItem gets a scene-qualified projected occurrence id
  when it occurs multiple times in one selected path. Provenance still points
  to the authored item/resource; duplicate DOM/runtime chart identities are not
  accepted or silently overwritten.

The eight required central experiments work without R: saved normal prefixes;
four to 200 independent signed effects; linked normal threshold/PDF/CDF;
absolute versus relative effects; complete-series variance estimates;
studentization with an estimated denominator; independent variance ratios;
and three-input dilution uncertainty. Additional controls cover averages,
lognormal spread, calibration residuals, count outcomes and assumption stress.

The dilution model retains the exact seed 20261101 and consumes three
Park-Miller uniforms in every trial in all source modes. Absorbance-only,
volumes-only and combined uncertainty are explicitly selectable. One-trial mode
shows the input uniforms and transformed trial, rather than estimating an SD
from one result. More trials do not imply smaller physical uncertainty.

## Verification evidence

At this increment:

- All 65 scenes and all adjustable scientific controls were exercised in Edge
  and Firefox at 1731×1006 light, 1280×720 dark and 390×844 light without loading
  the R runtime. This checks runtime/state behavior, not instructor timing.
- All 66 print pages were checked in both themes in Edge and Firefox. Actual
  saved Edge light/dark PDFs have 66 landscape pages. Saved-PDF text checks
  compare authored paragraphs, legends, captions and numerical readouts, not
  just titles or page counts.
- Native PDF fragmentation could lose final legend/card lines despite correct
  screen bounds. Print fitting now uses layout zoom, intrinsic grid rows and a
  surface grown to the complete content with footer space. Dense pages are
  deliberately scaled; a universal minimum teaching-font-size claim is not made.
- Independent numerical tests reproduce the normal, chi-square, t, F and exact
  Monte Carlo reference results. Five complete-selection tests check scene
  count, occurrence identities, optional R, authored calibration data, SHACL,
  and execution of all fourteen scientific mechanisms at both control bounds.
- The core suite (151), Reveal suite (127), D3 suite (95), focused PDF tests
  (6), and the production Vite build pass. The new static-adapter regression
  and script-view browser check cover the 1.14 version boundary separately.
- Full canonical semantic validation reports `Conforms: True` for Dataset
  fingerprint `7cda54d90241714bb7dfe04b0ba803028cf8c771bcf219fa4d79aa19ddd257cd`.

Earlier complete `npm test` runs were not exact-final-source passes. They found
missing canonical labels on the five signed-effect categories and an old
observation-placement count that omitted the twenty-reading warm-up. Both are
corrected. A fresh full run is still required before repository-wide technical
acceptance; focused passes do not replace it.

## Boundaries

This is a local review candidate, not a release or a claim of pedagogical
effectiveness. Full-session teaching time has not been measured. The complete
package remains intended for multiple sessions. Native Firefox PDF saving has
not been manually verified. Formula derivations and long R examples retained
in the extended historical path have not all been rerun in this increment.
No learner analytics, personal data, external services or credentials are added.
No commit, push, deployment or publication is authorized by this work.
