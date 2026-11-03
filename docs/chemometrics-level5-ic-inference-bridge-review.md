# IC precision story: why computing the variance is not the test decision

Historical 61-scene sequence. The current main selection is the
[70-scene experiment-first rebuild](chemometrics-level5-ic-experiment-review.md).
The full test attempts described below were interrupted/cancelled, not passed.

The instructor's follow-up identified a teaching defect, not an arithmetic error:
the previous 59-scene version calculated spread before making its purpose clear,
then explained sampling variation only after the test decision. A technically
correct calculation and narration did not supply a visible inference story.

The main path now has **61 scenes**. The same six IC readings, fixed reference
SD, normal-error assumptions, five-df construction and numerical decision are
unchanged. No other distribution section is rewritten in this increment.

## Revised causal sequence

1. IC problem and six observations.
2. **Before arithmetic:** explicitly distinguish describing today's results from
   deciding whether true precision deteriorated. An unchanged method can produce
   a sample SD above its true SD. Ask how often six readings would give at least
   this much spread under unchanged precision.
3. Calculate deviations, variance 0.024 (mg/L)² and SD 0.1549 mg/L. These summarize
   the observed series; the comparison with reference SD 0.10 mg/L is not by itself
   a calibrated decision.
4. **Before the named law and decision:** repeat the study under unchanged precision.
   Show the existing 10,000 simulated series on the **raw sample-variance axis**,
   not the previously unexplained Q axis. True SD stays 0.10 mg/L, reference variance
   is 0.010 (mg/L)², but estimates vary. Locate today's 0.024 in that variation.
5. **Explain why scale at all:** variance is a valid spread measure. The missing
   ingredient was its sampling reference, not a better summary statistic. One can
   compare on the raw variance scale, including by simulation. Rescaling gives a
   convenient known normal-model law; it does not create new evidence. Variance
   0.024 and scaled statistic 12 describe the same event and upper-tail probability.
6. Build the scaled statistic from the six actual residuals, then derive the five-df
   chi-square reference through the fitted-mean constraint and orthogonal directions.
7. Only now compare observed 12 with critical 11.0705 and the exact boundary-null
   upper tail 0.0347878. Return to the original precision question and limitations.

The Monte Carlo experiment is no longer a retrospective justification after the
decision. It motivates the need for a reference before introducing chi-square.
The visual reference is a sampling distribution of variances, not a distribution
of raw concentration readings. The simulated upper frequency at variance 0.024
is 342/10,000 = 3.42%, an approximation to the later exact 3.47878%, not an exact
Monte Carlo result or proof of the theoretical law.

## Implementation

`ontology/dataset/chemometrics-level5-ic-story-bridge.trig` authors the two explicit
question/bridge scenes, their visible infocards and raw-variance histogram. It reuses
the original simulation counts, with bin edges rescaled by 0.10²/5 = 0.002. No
simulation was regenerated, no scientific code moved into the renderer and no new
layout, compiler capability or ontology contract was added. The pre-derivation
histogram deliberately has no unexplained chi-square reference curve.

`chemometrics-level5-ic-scenes.trig` now places the repeated-series explanation on
the raw variance scale and connects the transitions. The named-graph path in
`chemometrics-level5-ic-path.trig` moves that scene before construction and inserts
the two bridges. Subsequent t/F/model-check/Monte Carlo ordering is preserved, with
the existing explicit transition to the separate five-value t example.

## Verification

- Preview generation succeeds with 61 scenes.
- All eight focused IC Python tests pass, including exact numerical replay, visible
  motivation before arithmetic, repeated-series comparison before the named law,
  raw variance units/edges, no premature theoretical overlay, and invariant tail
  comparison under scaling.
- Focused IC browser matrices pass in Edge and Firefox at light desktop,
  dark desktop and light phone sizes; the final title wording was shortened
  afterward. Native forward/reverse navigation passes all 61 scenes in both engines.
- Final full matrices are running on stabilized sources:
  `level5-ic-bridge-edge-final.log` and `level5-ic-bridge-firefox-final.log`.
  Firefox has completed successfully: all 61 scenes pass in all three configurations.
  Edge has also completed successfully for all 61 scenes in those three configurations.
  Both final browser matrices pass.
- The fresh authoritative `npm test` is running on unchanged semantic/feature
  sources: `level5-ic-bridge-final-npm-test.log`. No final pass is claimed yet.
- The previous 741-test pass and 59-scene browser matrices belong to the preceding
  revision and do not validate this new sequence.

Everything remains local, uncommitted, unpushed and unpublished. Formula legends,
accessible alternatives, privacy boundaries and the hypothetical nature of the
analytical example are retained. No pedagogical effectiveness is claimed.

Start the revised story at:
<http://127.0.0.1:5173/authoring.html?preview=authoring-level5-block1#/ex:ic-process--scene>
