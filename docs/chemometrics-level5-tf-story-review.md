# Connected Student t and F revision

The current local default selects `ex:path-level5-multiplicative-story-tf` in
`https://w3id.org/project-chemie-digital/graph/paths/level5-multiplicative-story-tf`.
It contains 111 scenes: the first 67 prerequisites unchanged, 26 new connected
t/F/synthesis scenes, ten retained model-check scenes, and the final eight-scene
live dilution Monte Carlo case. Prior selections and their resources remain intact.

The new study explicitly replaces the old five-reading t transition only in this
selection. Device A is 9.95, 10.05, 10.10, 10.10, 10.15, 10.25 mg/L throughout.
Device B is 9.55, 9.85, 10.00, 10.00, 10.15, 10.45 mg/L. The new CRM study is
distinct from the preceding chi-square QC series. Reference uncertainty is negligible
only by teaching assumption; true repeatability SD is unknown.

Key results: t=root six, two-sided t-five p=0.05797277, compared with hypothetical
known-SD normal p=0.01430588. The 95% mean CI is [9.99505644,10.20494356] mg/L.
Prespecified B/A sample variance ratio is nine, two-sided F-five/five p=0.03074944,
with bounds 0.13993095 and 7.14638183. Squared t gives six with F df 1,5 and the
same upper-tail p as the two-sided t test, not the devices' F-five/five comparison.

Six optional TriG-authored R workbenches cover 10,000 studentized series, varying
sample size, 10,000 independent variance-ratio pairs, prespecified-alpha sensitivity,
nested linear/quadratic calibration, and outlier/drift stress cases. No new renderer
or ontology contract is required. The calibration example has twelve fixed x values,
two versus three coefficients including intercept, and F df 1,9. Constructed noise
illustrates calculation, not validation evidence. The independent null quadratic
forms are added-term SS and complex-model residual SS, not the two dependent RSS.

Authored English content includes visible linked formula legends, fixed ratio
orientation, ordered df, frequentist CI coverage, non-rejection versus proof of no
bias, independence and normality boundaries, paired versus independent designs,
Welch, Brown-Forsythe and design-aware resampling cautions. No external instrument
photograph is copied. Data are fictional, with no privacy implications.

## Current verification boundary

Preview generation succeeds with 111 scenes. Numerical references were computed
independently before authoring. Five focused semantic/numerical tests cover the
selection, unchanged A data, exact sample summaries, independently integrated t
probability, visible legend blocks and inference safeguards.
Actual execution of the six new R workbenches, dedicated t/F browser-layout checks
and a fresh full `npm test` pass are still required before calling this revision
complete. The earlier lognormal full test was stopped for this requested rebuild;
its exit code is not a completed validation result. Duration 90–100 minutes remains
an instructor rehearsal target, not a measured lecture duration.

All accumulated work remains local, uncommitted, unpushed and unpublished.
