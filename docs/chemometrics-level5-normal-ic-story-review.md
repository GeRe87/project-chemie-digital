# Normal distribution: an IC experiment from binomial errors to control limits

Historical 83-scene selection. The current
[95-scene preparation/lognormal rebuild](chemometrics-level5-lognormal-workup-review.md)
selects Normal → Lognormal → Chi-square and omits this path's premature normal-to-IC
bridge. Its first 18 normal scenes are reused unchanged. The full `npm test` below
was intentionally stopped for the new request and is not a passing full run.

## Main selection

`npm run preview:level5:generate` selects the new exact pair
`ex:path-level5-normal-ic` /
`https://w3id.org/project-chemie-digital/graph/paths/level5-normal-ic`.
It contains **83 scenes**, including **19 new normal-story scenes**. Earlier
74/70/61-scene paths remain authored supporting selections.

The CDF-first nitrate foundations remain. Their quantile and generic-standardization
tools precede the short binomial application; that application leads **directly to
the IC normal story**. The normal story ends **directly before the IC chi-square
precision check**. The six-stage lognormal particle-size case is retained after F,
so it no longer interrupts that causal transition. t, F, model checks and the final
live dilution Monte Carlo case retain their internal order.

## The closed analytical story

1. **Same IC control, different results:** a local process schematic connects a
   homogeneous control, injection, separation, detector and reporting. Six readings
   are 10.03, 9.95, 10.08, 9.98, 10.12, 9.94 mg/L. Nominal concentration, method
   expectation, one result and sample mean are explicitly different quantities.
   Their mean 10.0166667 and SD 0.0728469 are descriptive, not parameter estimates
   used to define the later theoretical model.
2. **More results:** optional seeded R runs grow from 20 to 50, 100 and 1,000
   individual results, with acquisition order and histogram together. The generating
   normal model is an explicit teaching assumption, not a conclusion proved by the
   generated histogram. The saved 1,000-result histogram has no fitted/theoretical
   overlay and supplies a noninteractive fallback.
3. **Why compensation is common:** four independent fair signed effects have
   combination counts 1, 4, 6, 4, 1 out of sixteen. Exact binomial masses explain
   common small total errors and rare extremes. Injection, flow, temperature and
   electronics motivate the simplified construction, not a literal validation model.
4. **Binomial toward normal:** optional R compares n=4, 16, 50, 200. Each contribution
   is scaled by inverse root n so physical total SD stays 0.10 mg/L and standardized
   variance stays one. Compare mass divided by lattice spacing against density,
   never raw PMF heights against a PDF. Every finite model remains discrete. The
   standard-normal limit is motivated by the CLT under suitable conditions; iid
   finite-variance effects suffice. Stirling asymptotics remain an optional extension,
   not a falsely claimed full derivation on the main path.
5. **Lowercase phi:** define the standard-normal density on the eta coordinate,
   discuss symmetry, maximum at zero, decreasing tails and unit total area. Exact
   points have zero probability; density height is not probability.
6. **Eta and the fixed IC model:** use independently specified known expectation
   10.00 mg/L and SD 0.10 mg/L. Eta equals the usual z coordinate; it is an argument,
   not a third function beside phi and Phi. Examples 10.00, 10.10, 10.20, 9.70 give
   eta 0, +1, +2, -3. Mapping density back to concentration needs the one-over-SD
   factor and produces L/mg units. Standardization does not make arbitrary data normal.
7. **Two devices:** the same 10.20 mg/L is eta=2 for SD 0.10, eta=1 for SD 0.20.
   Its upper-tail probabilities are about 2.28% and 15.87%, respectively. Do not
   compare dimensional density heights as though they were tail probabilities.
8. **Uppercase Phi:** pair the density's accumulated left area with the CDF ordinate.
   The local graphic is explicitly schematic/truncated; its probability labels come
   from the full normal law. At eta=2, phi is 0.0539909665 per eta-unit, while Phi is
   0.9772498681 and the upper probability is 0.02275013195. A stable device can
   exceed 10.20 by chance; this is not a fault diagnosis or specification limit.
9. **Priority live experiment:** the editable threshold workbench changes the physical
   limit, expectation or SD, prints eta/density/CDF/tail separately and plots the
   PDF's left area beside its CDF. Its inverse-CDF result can be used after students
   propose their own upper 1% limit. It is instructor-operated and optional, not a
   mandatory audience programming task or a new custom renderer widget.
10. **ECDF versus model:** overlay the complete empirical step CDF from exactly the
    saved 1,000 simulated results with the fixed theoretical CDF. At 10.20 the empirical
    fraction is 978/1,000; the theoretical probability is about 97.725%. Their difference
    is finite-sample variation. This is not a fitted-model test or a confidence band;
    the authored prompt retains numerical fallback values without executing R.
11. **Reverse the question:** the 99th percentile is eta star 2.326347874, giving
    10.2326347874 mg/L, displayed approximately as 10.233. The 1% rate is per individual
    result under a known-parameter normal model, not campaign-wide risk. Multiple
    checks, estimated parameters, resolution and rounding require separate calibration.
    No real operational, regulatory or sample-release decision is authorized.
12. **Central coverage:** derive 68.27%, 95.45%, 99.73% using CDF differences and symmetry.
    The central two-SD interval excludes two tails totaling 4.55%; one upper two-SD
    limit excludes only 2.28%. These are model intervals for individual observations,
    not confidence intervals for a mean.
13. **Means:** independence and common variance give variance of the mean equal to
    individual variance divided by sample size. Normal individuals additionally give
    an exactly normal mean for every n. For six readings, true SE is 0.040824829 mg/L;
    individual SD stays 0.10. Optional R repeats fresh complete experiments and plots
    individual results and means on shared physical/density scales. Averaging does
    not remove constant bias, drift or dependence.
14. **Challenge the model:** the earlier reading workbench has stable, drift,
    interference and censored modes. Inspect acquisition order and histogram together.
    Drift changes the expectation over time; rare interference creates another error
    process; reporting censoring creates a point mass. The artificial 9.95 mg/L cutoff
    is not an actual nitrate LOD or recommended substitution. Static interpretation
    cards remain visible without returning to the optional code experiment.
15. **Next random quantity:** a new QC series gives SD about 0.155 against reference
    0.10. Is the larger estimate explainable by chance? The selected next scene is
    the existing IC chi-square process, with its distinct six readings and fitted
    mean 10.05. The previously known mean was a teaching-model assumption, not a
    requirement to subtract the nominal concentration in the precision check.

## Implementation

- Knowledge, numerical resources, complete visible formula legends and saved counts:
  `ontology/dataset/chemometrics-level5-normal-ic-story.trig`.
- Five editable executable base-R examples:
  `ontology/dataset/chemometrics-level5-normal-ic-code.trig`.
- Scenes and local accessible media:
  `ontology/dataset/chemometrics-level5-normal-ic-scenes.trig`,
  `apps/pitch/public/chemometrics/level5-normal-ic-process.svg`,
  `apps/pitch/public/chemometrics/level5-normal-eta-phi.svg`.
- Curated selection: `ontology/dataset/chemometrics-level5-normal-ic-path.trig`.
- Deterministic tests: `tests/test_level5_normal_ic_story.py`.

All scientific content and code are TriG-authored. Existing infocards, chart/table
contracts, formula/legend rendering and browser-R workbench are reused. No domain
logic is added to the renderer, and no ontology contract or accepted source format
is changed. Media have text alternatives and light/dark styles. Existing phone
compositions retain numerical/text fallbacks where full desktop plots are omitted.
All data are hypothetical; no student or patient information is used.

The saved sample uses Park-Miller state 20261102, multiplier 16807 and modulus
2147483647, followed by inverse-standard-normal transforms. Every draw is one result.
Mean is 9.996703971087724 mg/L, sample SD 0.100219841887375 mg/L. Counts at or below
9.80, 10.00, 10.20 are 21, 526, 978; 22 exceed 10.20. All sixteen saved histogram
counts are independently replayed in Python.

## Verification status

- Preview generation succeeds with 83 scenes.
- Eight focused normal-story tests pass, including path continuity, exact binomial
  masses/fixed variance, independent numerical probabilities/quantile/SE, complete
  legend bindings, all saved histogram counts and ECDF fractions. The thirteen
  retained IC tests pass with the updated default-preview command.
- Actual authored R passes **17 cases in each of Edge and Firefox**: four growth
  sizes, three alternative modes, four binomial sizes, both device SDs, the ECDF
  overlay, and means at n=1, 6, 30. Evidence: `level5-normal-ic-r-retry.log` in the
  approved local temp folder. An initial audit-driver keyboard-insertion failure
  was corrected by setting and verifying the editor document before execution;
  no speculative application-runtime change was made.
- Example means-run empirical SDs: individual 0.1001296 / six-reading means 0.04061139,
  versus theoretical 0.10 / 0.04082483. These are one deterministic finite simulation,
  not exact equalities or measured method validation.
- Initial layout audits found overflow in the mean, tail, decision and bridge scenes.
  Redundant context was removed from the mean scene, wide formulas were wrapped,
  headings/captions shortened, and repeated eta arithmetic kept on its dedicated
  scene. Fresh focused Firefox checks pass the corrected case, mean, eta, four-effect,
  tail and decision scenes in light desktop, dark desktop and light phone views.
- Revised normal-section matrices in `level5-normal-ic-edge-revised.log` and
  `level5-normal-ic-firefox-revised.log` contain snapshots predating final caption/
  formula adjustments and are not final evidence. Final full-path matrices are
  running in `level5-normal-ic-edge-final.log` and `level5-normal-ic-firefox-final.log`.
  Firefox has completed: all 19 new normal-story scenes pass in all three tested
  configurations, and all 83 scenes pass both desktop configurations. The complete
  matrix is **not passing**: 21 retained scenes in IC/F/lognormal/model-check/Monte
  Carlo sections fail the 390-pixel phone layout checks (formula overflow or content
  extending into/beyond navigation). These are current failures, not stale evidence;
  no broad out-of-scope renderer/content changes were made in response.
  Final forward/reverse navigation passes all 83 scenes in both Edge and Firefox,
  without mandatory controls or reveals: `level5-normal-ic-native-final.log`.
  All eight focused normal-story tests pass again on the stabilized sources.
- A fresh authoritative `npm test` is running on stabilized semantic/code/test sources:
  `level5-normal-ic-npm-test.log`. No full pass is claimed. The prior CDF-only full run
  was intentionally stopped for this requested rebuild. Old 74-scene browser runs
  were superseded while the new selection was being authored and do not validate it.

The requested 75–90 minutes for the normal section remains a rehearsal target, not
a measured duration or evidence of pedagogical effectiveness. All changes remain
local, uncommitted, unpushed and unpublished.

Start at:
<http://127.0.0.1:5173/authoring.html?preview=authoring-level5-block1#/ex:nn-case--scene>
Add `&interactive=1` before the hash for optional browser-R demonstrations.
