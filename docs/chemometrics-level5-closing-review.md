# Level 5: E18 synthesis and transition

Local authoring review, 2026-10-31. No commit, push, publication or deployment.
Two complete English views extend the preview to 54 scenes.

Following the KS extension, these same views move to positions 58 and 59 in the
59-scene preview. Their cards and reference calculation are preserved; narration
now acknowledges the implemented KS example and still-pending Pearson addition.
Current integration evidence is in [the KS review](chemometrics-level5-ks-review.md).

After the Pearson addition, E18 occupies positions 63 and 64. Its narration now
summarizes both goodness-of-fit examples without changing the cards or reference
calculation. See [the Pearson review](chemometrics-level5-pearson-review.md) for
current integration and regression evidence.

## Lecture views

- **E18a, From mechanisms to evidence:** four concise cards distinguish binary
  outcomes, exposure-based event counts, continuous individual concentrations and
  sampling distributions of estimated statistics.
- **E18b, Before a statistical decision:** the five nitrate repeats and reference
  9.5 mg/L motivate the need for data context, defensible sampling, model assumptions
  and a defined decision procedure.

The blueprint's exit question is replaced by complete explanations in accordance
with the current no-audience-questions requirement. No question appears in slides,
narration or alternatives, and no interaction or reveal stage is required. Existing
definition cards are reused without CSS, Core, renderer, compiler or SHACL changes.
No displayed mathematical formula is added; numerical summaries are verbal.

## Scientific boundaries

The synthesis does not imply that every count is Poisson, positivity establishes
lognormality or individuals become normal under the CLT. Exact normal-sampling
results retain their independence and normality conditions in narration. Checking
model fit is distinct from selecting a distribution by appearance.

The reference example is explained, not left as an unanswered audience task.
Under the explicit iid normal illustration, T16's lower confidence endpoint is
approximately 9.60735 mg/L, so reference 9.5 lies outside that conditional interval.
This repeats the solved model calculation without claiming real-world assumptions,
chemical importance, absence of bias or environmental representativeness. The
one-sample illustration treats the reference as fixed; reference uncertainty can
require additional treatment. Formal test targets, hypotheses, direction and error
rate must be specified before a decision, not selected after seeing the result.
No additional p value or formal hypothesis-test decision is introduced.

The planned Kolmogorov-Smirnov and Pearson chi-square goodness-of-fit additions
remain unimplemented and explicitly separate. The blueprint's supplementary
Markdown remains unavailable and is not claimed as read. Overall timing remains
unresolved; this synthesis does not assert that all requested lecture additions
are complete.

## Accessibility and privacy

All authored text, narration and alternatives are English. Cards are fully visible
on entry and labelled independently of color. Existing responsive layouts and
static alternatives retain all explanations. There is no learner-data collection,
storage, network service or deployment change. Accepted Levels 0-4 are untouched.

## Verification

- Preview generation: 54 scenes.
- All 96 targeted Level-5 Python tests pass, including four E18 tests checking
  ordering, complete English views, no questions, scientific distinctions,
  explained reference comparison and static alternatives.
- Edge and Firefox pass both E18 scenes at 1731 x 1006 light, 1280 x 720 dark and
  390 x 844 light, with no controls/questions/reveals or text overflow.
  Representative desktop and mobile screenshots reviewed.
- Native PageDown traversal passes all 54 slides in both engines with only the six
  original comparison advances. PageUp reverses E18 and the preceding blocks without
  additional reveals.
- `git diff --check` passes with line-ending warnings only.
- E18-source semantic validation conforms with fingerprint
  `cb12f0ed68f65da9f91c448c50698c78c6759f9a686a297669898c1fd9afe372`.
  Log: `C:\Users\PCUser\AppData\Local\Temp\opencode\level5-e18-semantics.log`.
- The earlier full T16 `npm test` run completed successfully: 641 Python tests and
  all Node suites pass. It predates this increment and is not exact-current evidence.
- The E18-era full `npm test` run failed on a changing source basis. Its log is
  `C:\Users\PCUser\AppData\Local\Temp\opencode\level5-e18-current-npm-test.log`.
  Current targeted tests and a fresh stable-source full run are documented in the
  Pearson review; this earlier mixed-basis result is not accepted as validation.

## Preview

<http://127.0.0.1:5173/authoring.html?preview=authoring-level5-block1#/ex:l5-e18a-scene--scene>
