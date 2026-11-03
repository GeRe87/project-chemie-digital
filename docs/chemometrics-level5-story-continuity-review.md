# Level 5: first narrative-continuity review

Superseded as a teaching-purpose decision by the later instructor clarification
and [the full population-inference review](chemometrics-level5-population-inference-review.md).
Its next-measurement motivation is not accepted as the lecture's main purpose.
The full-suite run listed below was stopped before that review; it did not complete
successfully and is not acceptance evidence. Historical targeted/browser checks
do not validate the planned lecture-wide reframing.

Local, uncommitted and unpublished. User feedback: “reading” is unclear, and the
lecture often jumps between slides without showing how the story progresses.

## Scope and teaching changes

This is the first review batch, the 17 scenes from the nitrate story through the
Normal/Lognormal comparison (positions 17-33), not a claim that the whole lecture
has been revised. Later sampling, Student-t, F, goodness-of-fit and reserve blocks
still need the same narrative/terminology review. Their remaining “reading” wording
is not yet accepted as final lecture language.

The visible sequence is now:

1. One nitrate sample gives five different illustrative measured values.
2. We need a model for the next measurement result, not just a summary of those five.
3. Normal measurement errors are an explicit assumption. A specified model is not
   fitted evidence from the five values.
4. Explain the same model's centre and spread, then write its density formula.
5. Apply it to results above 10.45 mg/L, then reverse the task to find a 95% threshold.
6. Close that individual-result task and distinguish the later unknown-mean task.
7. Explicitly change the variation source: one sample versus different sites.
8. Label both constructed comparison datasets and explain that the new histogram
   does not add observations to the original five-value sample.
9. Follow site dilution as concentration factors, motivating a lognormal candidate.
10. Explicitly introduce 20 new constructed illustrative values, transform those same
    values, and return to the concentration scale to distinguish median and mean.

Continuity is visible in headings, story cards and existing chart context, not only
in narration. Narration links the completed task to the following task and explains
why data or model status changes. No new slide, layout, formula, numeric dataset,
interaction or disclosure stage is added. Existing semantic IDs, including IDs
containing “reading”, remain stable; human-facing wording in this batch uses
“measured values”, “measurement result” or the specific concentration quantity.

There is no claim of pedagogical effectiveness. Existing bias, sampling, normality,
model-support and same-slide formula-legend guardrails are retained. No learner
information is collected and no deployment changes are made.

## Validation status

The preceding story full-suite run was explicitly stopped before these edits; it
cannot validate this new revision. Earlier story browser evidence is superseded for
the edited scenes. New targeted checks and browser checks must be reported from
their own completed logs. Main generation still yields 70 scenes.

- Five new continuity tests pass: terminology throughout the reviewed text,
  visible progression, explicit dataset/model switches, narration handoffs and
  absence of new disclosure stages. The six story-insertion tests also pass.
- The broader Level-5 targeted run passes all 136 tests in
  `level5-continuity-targeted.log`. Discovery began before the five new continuity
  tests were added; those pass separately, giving 141 targeted checks in total.
  The final narration-only dilution-story revision is also covered by the separate
  six-test story run. PowerShell reports exit code 1 for the redirected broader run,
  but its unittest summary is `Ran 136 tests ... OK` with no test failures.
- The 17-scene Edge/Firefox matrices run in `level5-continuity-edge.log` and
  `level5-continuity-firefox.log` at the established desktop/dark/phone sizes.
- Firefox's matrix has completed successfully for all 17 scenes in all three
  configurations. Edge and the full suite remain pending.
- Fresh SHACL validation is active in `level5-continuity-semantics.log`.
- The authoritative full suite is active in `level5-continuity-npm-test.log`.
  Keep semantic/feature sources unchanged while it runs. Earlier interrupted logs
  are not successful full-regression evidence.

All logs above are in `C:\Users\PCUser\AppData\Local\Temp\opencode`.

## Remaining narrative review

The next batches must explicitly connect lognormal individual values to a new
sampling population, distinguish the mean-uncertainty target from individual
variation, and explain the return to the nitrate model with its changed specified
SD. Chi-square, Student-t and F need continuity within their stories as well as
before their formulas. Model-fit tests then need a visible change of purpose,
from describing sampling variation to checking agreement with a proposed model.
Do not invent measured datasets or fitted parameters to disguise those switches.

Local preview:
<http://127.0.0.1:5173/authoring.html?preview=authoring-level5-block1#/ex:l5-n09-story1-scene--scene>
