# V2 review response: export repairs and authored P1 states

Review input: `Review_Chemometrie_Verteilungen_V2_2026-11-02.md`.
The actual reviewed `authoring.html.pdf` in Downloads was inspected, not merely
the review's descriptions. It contains 66 pages and identifies Firefox as creator.
Its export defects are real. Earlier text/geometry-only checks were insufficient.

## Reproduced causes and repairs

| Review | Cause / bounded repair |
| --- | --- |
| V2-01, 14–20 | Screen info/visual charts use a zero-height SVG flex remainder. In an intrinsic print cell its height remains zero. The vectors and data existed, but the PDF clipped their entire viewport. Print now restores intrinsic SVG aspect ratio and a non-flex height. The shared rule repairs binomial, dot and histogram families. |
| V2-02, 18, 28, 38 | A grid region forced to `justify-content:flex-start` retained an approximately 300px intrinsic image track inside an approximately 829px column. Print now stretches grid tracks normally and gives media figures/images explicit full-column width and intrinsic height. |
| V2-03, 45, 60, 64 | Shared media sizing restores the residual, tail and Q-Q illustrations. N64 now puts the process before its complete measurement-equation/legend unit and uses one concise authored input-model card. This selects the existing visual/formula composition rather than piling two unrelated footer surfaces under a formula deck. All original input models remain in the extended path. |
| V2-04, 48 | Complete formula/legend comparison units now stack as full-width cards instead of letting two long equations overflow adjacent half-width cells. This is a component-signature rule, not a scene-id override. |
| V2-05, 27, 58 | Stress plots now receive one explicit data-near domain spanning stable, outlier and drift outcomes at the same seed/design. Switching modes does not zoom the axis or discard out-of-window observations. The domain derives from all available outcomes and the authored stress magnitudes. |
| V2-06, 29 | The saved-PDF prose check verifies the complete N22 explanation and caption, including their paragraph endings, after the shared print fixes. |
| V2-61 | The authored decision had been lost in the exported stack. N61 now uses two explicit decision/conditions cards beside the shared ECDF/CDF image: cutoff 0.563275, A do not reject, B reject. The distinction between a fixed null and fitted parameters is visible. |

## Stronger acceptance probes

`scripts/check_slides_pdf_browser.cjs` now checks visible SVG viewport dimensions,
vector primitive presence and illustration dimensions, not merely the containing
figure. It rejects a stage narrower than 70% of its landscape page and detects
intersections between the mathematical contents of separate formula units.
These checks would have failed the blank-chart and colliding-formula exports.

The 66-page current selection passes these probes in both themes in Edge and
Firefox. Minimum measured fit is about 82%, versus about 65% before these repairs.
Actual Edge light/dark saved PDFs pass paragraph, legend, caption and readout
checks. All 66 saved light-PDF pages were rasterized into a contact sheet, and
the restored graphics and full-width layout were inspected there. Browser print
emulation in Firefox is not claimed as manual verification of native PDF saving.

Disposable local evidence is under:
`C:/Users/PCUser/AppData/Local/Temp/opencode/v2-gate1-pdf/`.
It includes saved PDFs, browser reports and `contact-sheet.png`.

Focused regressions cover intrinsic paper SVG sizing, stacked formula units and
a common data-near stress domain. The complete-selection compiler/SHACL/bounded
execution checks still pass. A full `npm test` started before these review repairs
cannot certify this new source state; fresh final-source validation remains due.

## Gate 2 implementation and current validation

The complete path now selects authored, distinct printed states rather than
repeating one experiment snapshot:

- N10: 200 signed effects with a normal overlay; N13: two known-SD models.
- N14–18: CDF, forward tail, 20-result ECDF, inverse threshold and symmetric bands.
- N23: connected 10 → 12.5 → 10 trajectory and its log ratios.
- N25–28: log-ratio transformation, cropped three-center density and separate
  forward/inverse questions with view-specific explanations.
- N29–30: population/censoring cards and an open spread question before deriving
  the sampling law. Original extended material remains available.
- N33–41: three actual illustrative dotplots, variance markers, five squared
  components and six-versus-thirty variance histograms on a common grid.
- N46–48: four-versus-thirty Student curves, two-sided decision markers and the
  corresponding concentration confidence interval.
- N52–56: ordered df 9/5, both F decision tails, residual-first calibration,
  then the full nested-model comparison.
- N58: visible outlier state on the stable/outlier/drift common domain.
- N62–63: actual diameter categories, then contribution bars and a visible cutoff.
- N65–66: one trial's uniforms/transforms/result before 10,000 trials, quantile
  markers and absorbance-only versus volume-only output SDs.

The roadmap is reduced to six cards. Formula legends and inference conditions
remain visible. Scientific view selection and numerical inputs are authored in
TriG; the pure core and shared D3 renderer remain independent of scene identity.

Current focused evidence: seven complete-selection tests and twelve numerical,
static-renderer and PDF regressions pass. Edge and Firefox pass all 65 content
scenes, adjustable controls, three viewport/theme configurations, script toggle
and no-R-request checks. Both engines pass all 66 print pages in both themes,
including scientific SVG dimensions and formula nonintersection. Minimum fit is
82.17% in Edge and 82.25% in Firefox.

The final audit exposed a print initialization race: print styling could capture
its own block fallback before the underlying composition stylesheet. Preparation
now reruns after Reveal initializes, outside the print override; the shared
visual/formula composition explicitly retains its grid on paper.

Current disposable evidence: `C:/Users/PCUser/AppData/Local/Temp/opencode/v2-p1-browser/`
and `C:/Users/PCUser/AppData/Local/Temp/opencode/v2-p1-pdf/`.
Saved-PDF text/raster inspection and the fresh full `npm test` are the remaining
technical completion checks; their results must not be inferred from Gate 1.

Human-only checks remain: teaching time, readability on the actual lecture
display and the user's content review. Native Firefox saved-PDF output has not
been manually verified. No claim of pedagogical effectiveness is made.

The 66-slide selection and historical extended paths remain intact. No numerical
CRM/device/reference constants are changed. No publication, deployment, commit
or push is performed.
