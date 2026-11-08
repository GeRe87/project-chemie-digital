# Statistical Tests — Sprechertext

Stand: 2026-11-08 · 52 Folien · Englisch.

Abgeleitetes Proben- und Reviewdokument, keine zusätzliche semantische Quelle.
Maßgeblich sind die TriG-Inhalte. Alle Datenbeispiele sind synthetisch, die
Grenzwerte illustrative Lehrvorgaben. Der See ist ein statistisches Modell,
keine Sicherheitsbewertung. Eckige Klammern enthalten Regiehinweise.

## Folie 01 — Statistical Tests

Szene: `ex:l6-scene01`

Today we connect a scientific question with a statistical decision. We will compare means, measurement scatter, category counts and rankings. For each test, follow the same structure: population claim, experimental design, assumptions, test statistic, reference and interpretation. We then describe effect magnitude and investigate unusual observations.

**Transition:** Which questions arise in chemical measurements?

## Folie 02 — Is this difference more than measurement variation?

Szene: `ex:l6-scene02`

Our QC target is 50 micrograms per litre, while repeated preparations average 48.5. Could measurement variation explain the difference? We could also compare upstream and downstream diclofenac, or growth rates from independent algal cultures. Each culture supplies one growth-rate estimate. Repeated readings within one culture contribute to that estimate; the culture remains our independent experimental unit.

**Transition:** State a population claim before choosing the calculation.

## Folie 03 — Every test starts with a hypothesis

Szene: `ex:l6-scene03`

H-zero is the starting claim. For example, the population mean amoxicillin concentration is at or below a reference. H-one is the competing claim: the population mean exceeds it. We calculate a **test statistic** from observations to assess H-zero. The four steps are starting point, reference prediction, comparison and decision. Equality belongs to H-zero in the parameter comparisons taught here.

**Transition:** A decision can be correct or mistaken.

## Folie 04 — Tests never prove

Szene: `ex:l6-scene04`

[Follow the single tree from top to bottom.]

Here mu is the population mean and L the reference. Positive means rejecting H-zero and claiming an exceedance. Negative means not rejecting H-zero. If the mean really exceeds L, a positive is a true positive and a negative is a false negative, type II. If H-zero is true, a positive is a false positive, type I, and a negative is a true negative. Non-rejection cannot prove H-zero. Alpha controls false rejection; beta describes missed detection at a specified alternative.

**Transition:** The intended action helps us choose the starting claim.

## Folie 05 — H₀: μ ≥ L OR μ ≤ L OR μ = L

Szene: `ex:l6-scene04b`

Imagine a thickness-only model for a frozen lake. The conservative rule starts with mu at or below L and requires rejection before GO. A false GO is type I. The progressive rule starts with mu at or above L and goes when H-zero is not rejected. Below L, a false GO is type II. An equality null tests departures in either direction. An equality-only GO policy would treat thicker ice as a departure too. Non-rejection cannot establish exact equality. The hypothesis must match the application.

**Transition:** Let us compare the two directional rules at the same true thickness.

## Folie 06 — Same lake, different burden of evidence

Szene: `ex:l6s-lake-comic`

[Read the speech bubbles and compare the figures.]

The boundary is ten centimetres. Each study has four independent Normal readings with known population SD half a centimetre and one-sided alpha five percent. At true thickness 10.3, the conservative figure goes in 32.8 percent of studies and the progressive figure in 99.8 percent. At 9.7, their false-GO rates are 0.22 and 67.2 percent. These are repeated-study decisions, not collapse probabilities. Severe false-GO consequences motivate evidence before action. A progressive policy needs an explicit, acceptable trade-off between the consequences of the two mistakes.

**Transition:** Now keep one rule and its specified alternative fixed, and change alpha.

## Folie 07 — α controls type I errors

Szene: `ex:l6-scene05b`

[Move alpha from five percent to one percent and 0.1 percent.]

One curve describes H-zero at the boundary; the other describes a specified H-one mean of 1.4 micrograms per litre against the reference one. Ten Normal measurements and population SD 0.5 define the model. Both distributions stay fixed. Alpha moves the rejection cutoff. The H-zero area beyond it is type I error; the H-one area inside the non-rejection region is type II error. Lower alpha shrinks false rejections and increases misses here. The type II readout uses the same 4,000 seeded studies at every setting.

**Transition:** The reference also depends on degrees of freedom.

## Folie 08 — Degrees of freedom: ν (nu)

Szene: `ex:l6-scene06`

The Greek letter nu represents degrees of freedom. Fit a mean to six observations: their residuals must add to zero, so five residuals determine the sixth. That leaves nu equal to five. A calibration line fits intercept and slope, leaving four residual degrees of freedom from six observations. In these full-rank models, each independently fitted coefficient costs one residual degree of freedom. Other tests, such as Welch, can use an approximate fractional value.

**Transition:** The p-value locates our result in its reference distribution.

## Folie 09 — The p-value: how unusual is our result if H₀ holds?

Szene: `ex:l6-scene07`

Assume H-zero and the sampling model. The shaded upper tail counts statistics as high as ours or higher. That probability is p for this planned upper-tail question. Compare it with alpha chosen before testing. A p-value is not the probability that H-zero is true. It measures compatibility with a reference model; effect size describes a different aspect of the result.

**Transition:** Our first family compares population means.

## Folie 10 — t-Tests

Szene: `ex:l6r-t-scene`

The t family standardises a mean difference using an estimated standard error. The experimental design determines whether we compare one mean with a fixed target, compare independent groups, or first form within-pair differences. Always identify the independent units before selecting the formula.

**Transition:** What exactly are we comparing?

## Folie 11 — The t-test compares means

Szene: `ex:l6-scene09`

One mean can be compared with a fixed reference, such as a QC target. Two estimated means require both groups' sampling variation. A paired design preserves the connection between two readings from the same unit. The t statistic expresses departure in standard-error units. Its tail reference depends on the hypothesis direction and the estimated degrees of freedom.

**Transition:** Start with one mean against a fixed target.

## Folie 12 — One-sample t-test: compare the mean with the target

Szene: `ex:l6-scene11`

[Open Symbols when introducing the notation.]

Subtract the null reference from the sample mean and divide by sample SD over the square root of n. The denominator estimates the standard error of the mean. Under independent Normal sampling, the t reference has nu equal to n minus one. SD describes individual measurement scatter; SE describes sampling variation in the mean. The NIST link provides the reference procedure.

**Transition:** Explore how each input changes t.

## Folie 13 — Move the mean, spread and sample size: where does t land?

Szene: `ex:l6-scene11b`

The authored starting state is sample mean 48.5, target 50, sample SD two micrograms per litre and six independent preparations. It gives t about minus 1.837 and two-sided p about 0.126. Move the mean toward the target: t approaches zero. Increase scatter: the same difference supplies weaker evidence. Increase independent sample size: standard error falls. These controls compare hypothetical studies; choose sample size and analysis before collecting outcomes.

**Transition:** Apply the one-sided version to recovery.

## Folie 14 — Can we demonstrate mean recovery above the 80% minimum?

Szene: `ex:l6-scene12`

Six independent recoveries are 81, 80, 82, 83, 81 and 82 percent. Their mean is 81.5. H-zero says population mean recovery is at or below 80 percent. The report gives t 3.5032, nu five and upper-tail p 0.008612. Reject H-zero at five percent: the result supports mean recovery above the illustrative minimum. Individual preparations still vary. This table is an authored R-style mimic. The footnote opens the requested NIST t table in a new tab.

**Transition:** Different designs require different standard errors.

## Folie 15 — One target, separate groups, or paired batches?

Szene: `ex:l6-scene13`

Identify the sampling structure first. A fixed target supplies a reference value. Independent groups supply separate estimates from separate units. Paired batches supply two linked readings per batch and one difference per independent batch. Preserve those identities throughout calculation. The same numeric values arranged into a different design can require a different analysis.

**Transition:** First compare independent groups with one justified common variance.

## Folie 16 — Pooled t-test: independent groups, one variance

Szene: `ex:l6-scene14`

The river example represents separate upstream and downstream sampling units. Prior method validation and a homogeneous matrix may support similar measurement variability. The pooled variance averages the two sample variances, weighted by their residual degrees of freedom. Its square root enters the standard error of the mean difference. The t reference has nu equal to n-one plus n-two minus two. The common-variance assumption needs scientific support.

**Transition:** Before/end readings from one batch have a different structure.

## Folie 17 — Paired t-test: before and after batch oxidation

Szene: `ex:l6-scene15`

Each oxidation batch contributes a before and an end reading. Keep the pair and form before minus end. We then apply a one-sample t test to the independent batch differences. A positive difference describes a decrease during treatment. Exact paired-t inference assumes independent Normal differences. The number of independent batches determines n and nu.

**Transition:** Read the six batch differences and the report.

## Folie 18 — Paired t-test: before and after batch oxidation

Szene: `ex:l6-scene16`

The differences are two, three, zero, four, three and five milligrams per litre. The zero stays in the paired-t calculation. Mean difference is 2.833, t is 4.0294, nu five and two-sided p 0.01003. Reject the zero population mean difference at five percent. The conclusion concerns the average before-minus-end difference. A causal explanation also needs a suitable design and consideration of competing time-related effects.

**Transition:** Independent systems can have different measurement spreads.

## Folie 19 — Welch t-test: NIR sensor versus HPLC-MS

Szene: `ex:l6-scene17`

Five NIR and six HPLC-MS preparations come from a homogeneous reference material. The preparations are separate independent units. Welch keeps each group's variance contribution to its estimated mean. Add those contributions to form the standard error. The reference uses an approximate nu, which can be fractional. Keep the full calculated nu when computing p.

**Transition:** Interpret the system difference in its original unit.

## Folie 20 — Welch t-test: NIR sensor versus HPLC-MS

Szene: `ex:l6-scene18`

The system means are ten and fifteen micrograms per litre. NIR minus HPLC-MS is minus five. Welch gives t about minus 2.9704, nu about 6.972 and two-sided p about 0.02089. Reject equal population means under this model. The sign tells us NIR reads lower here. Accuracy and method agreement require their own reference evidence and validation.

**Transition:** What happens when one experiment supports several claims?

## Folie 21 — One water sample, three claims: is the overall risk still 5%?

Szene: `ex:l6r-multi-question-scene`

[Trace the sample, preparations and three analyte series. Ask for predictions.]

Six independent preparations of one water sample provide chloride, bromate and phosphate results. Each analyte has its own illustrative limit and below-limit population claim. We report the claims separately. Our family error is at least one false below-limit claim. Shared preparation effects can link analytes; the next calculation uses independence as an explicit teaching assumption.

**Transition:** Calculate the chance of at least one false rejection.

## Folie 22 — Three 5% tests: a 14.26% chance of at least one false rejection

Szene: `ex:l6r-multi-answer-scene`

Assume all three nulls are true at their five-percent boundaries and tests are independent. Each avoids false rejection with probability 0.95. All three avoid it with probability 0.95 cubed, or 0.857375. The complement is 0.142625: about 14.26 percent. This concerns separately reported claims. One conjunctive claim that every analyte passes has different error logic.

**Transition:** Protect the planned family of separate claims.

## Folie 23 — Bonferroni: protect all three below-limit claims

Szene: `ex:l6-scene20`

Divide the chosen family alpha by the number of planned tests. For three tests at family level five percent, each threshold is about 0.01667. Equivalently, multiply each valid raw p-value by three and cap at one, then compare with five percent. Choose one route. Bonferroni's bound allows dependent tests, which is useful when analytes share preparation effects.

**Transition:** Read the adjusted report.

## Folie 24 — Three p-values: which below-limit claims can we report?

Szene: `ex:l6-scene21`

The illustrative raw p-values are 0.008, 0.021 and 0.200. Bonferroni gives 0.024, 0.063 and 0.600. Chloride supports its below-limit claim on this rule. The other two nulls are not rejected. Holm is another planned family-wise procedure, with adjusted values 0.024, 0.042 and 0.200 here. Prespecify the procedure rather than choosing the result you prefer.

**Transition:** Next compare measurement scatter.

## Folie 25 — F-Tests

Szene: `ex:l6r-f-scene`

The illustration keeps the series means alike while changing their scatter. The F reference can assess a ratio of variance estimates. It can also assess improvement between nested models fitted to the same observations. In both cases, keep numerator and denominator degrees of freedom in their declared order.

**Transition:** Does twice the SD establish greater population variance?

## Folie 26 — Method A has twice the SD: is that convincing?

Szene: `ex:l6-scene24`

Method A has sample SD 0.20 and method B 0.10 milligrams per litre. Squaring gives a variance ratio of four. With six independent preparations per method, nu-one and nu-two are both five. The declared alternative asks whether A has greater variance. Under equal population variances and independent Normal sampling, use the upper F tail.

**Transition:** Compare the resulting p-value with alpha.

## Folie 27 — Method A has twice the SD: is that convincing?

Szene: `ex:l6-scene25`

Observed F is four, with degrees of freedom five and five. The upper-tail p-value is 0.07719. At five percent, do not reject the equality boundary in favour of greater A variance. This cannot prove equal precision. The observed ratio remains useful descriptive information, while the test accounts for sampling variation in both variance estimates.

**Transition:** An F comparison can also ask about a calibration model.

## Folie 28 — One calibration dataset, two models

Szene: `ex:l6-scene26`

Fit a flat response and a line to the same standards. Adding the slope makes the line more flexible. The null sets the added coefficient to zero. With one added coefficient under the same Normal-error model, the nested F equals the square of the corresponding coefficient t statistic. The comparison detects either slope direction. The NIST coefficient chapter provides related background.

**Transition:** Apply that logic to adding curvature.

## Folie 29 — Does a curved calibration fit better than a straight line?

Szene: `ex:l6-scene27`

The reduced model has intercept and slope; the full model adds a quadratic term. Both use the same ten standards. Compare the reduction in residual sum of squares per added coefficient with the remaining full-model error per residual degree of freedom. Here nu-one is one and nu-two is seven. The schematic shows authored error summaries, rather than measured raw standards.

**Transition:** How unusual is the observed improvement under zero curvature?

## Folie 30 — Does a curved calibration fit better than a straight line?

Szene: `ex:l6-scene28`

The residual sums of squares are twelve and five. Their reduction of seven, divided by one added coefficient, is compared with five divided by seven residual degrees of freedom. F is 9.8 and upper-tail p 0.01660. Reject zero curvature under the stated model. Residual checks and validation of the working range remain part of assessing a usable calibration.

**Transition:** Chi-square references serve several different questions.

## Folie 31 — Chi-square: are we comparing spread or counting things?

Szene: `ex:l6-scene31`

Separate the three questions. One numeric measurement series can be compared with a fixed known variance. Category counts can be compared with fixed expected shares. A contingency table can ask whether two classifications are associated. They share a chi-square reference in suitable conditions, but their sampling models and definitions of expected values differ.

**Transition:** Start with a known variance target.

## Folie 32 — Is measurement scatter above the known target?

Szene: `ex:l6-scene32`

The target population SD is known to be 0.10 milligrams per litre, so its variance is 0.010 squared units. Multiply our sample variance by n minus one and divide by that target variance. Independent Normal observations give a chi-square reference with nu equal to n minus one. The planned alternative is excess scatter, so we use the upper tail.

**Transition:** Read the observed variance and report.

## Folie 33 — Is measurement scatter above the known target?

Szene: `ex:l6-scene33`

The six measurements have sample variance 0.024 squared milligram-per-litre units. Multiplying by five and dividing by 0.010 gives Q twelve. With nu five, upper-tail p is 0.03479. Reject the known-target boundary in favour of excess population variance at five percent. A separately estimated target would need an analysis that includes its sampling uncertainty.

**Transition:** Now count particles in categories.

## Folie 34 — Do the particle counts match the expected mix?

Szene: `ex:l6-scene34`

Sixty independent particles are classified into three mutually exclusive, exhaustive categories. Fixed expected shares are fifty, thirty and twenty percent, giving expected counts thirty, eighteen and twelve. Pearson's statistic squares each observed-minus-expected difference, divides by its expected count, and adds. With fixed shares, nu equals categories minus one. Adequate expected counts support the approximate chi-square reference.

**Transition:** Compare the observed discrepancy with that reference.

## Folie 35 — Do the particle counts match the expected mix?

Szene: `ex:l6-scene35`

Observed counts are thirty, twenty and ten. Pearson's statistic is 0.5556, with nu two and approximate upper-tail p 0.7575. Do not reject the specified mix. This cannot prove the shares exactly correct. Fitted category probabilities or sparse expectations would require suitable recalibration.

**Transition:** A two-way classification obtains expectations differently.

## Folie 36 — Is exposure group associated with damage?

Szene: `ex:l6-scene36`

[Open Show experiment using the keyboard; close with Escape.]

Forty independent vessels form two treatment rows: control and exposure, twenty each. Each vessel receives one affected or unaffected classification, defining the columns. Under independence, multiply the row total by the column total and divide by the grand total. For control/affected this gives twenty times twenty-two over forty, or eleven. Sum the Pearson cell contributions. Nu is rows minus one times columns minus one. The full symbol legend remains on this slide.

**Transition:** Read the uncorrected Pearson result.

## Folie 37 — Is exposure group associated with damage?

Szene: `ex:l6-scene37`

Control has eight affected and twelve unaffected vessels; exposure has fourteen and six. Independence predicts eleven affected and nine unaffected in each row. Pearson's statistic is 3.6364, nu one, and approximate p 0.05653. At five percent, do not reject independence; this cannot prove absence of association. The calculation is uncorrected Pearson. Software continuity corrections can change the result.

**Transition:** Rank methods compare ordering of observations.

## Folie 38 — Mann–Whitney: are values in one group usually higher?

Szene: `ex:l6-scene38`

Our independent X group is one, two, two; Y is two, three, four. Keep repeated observations as separate units. The usual null makes group labels exchangeable under equal distributions. A pure location or median-shift interpretation requires additional same-shape assumptions. We will first calculate the statistic, then construct an explicit tie-aware probability reference.

**Transition:** Count every cross-group comparison.

## Folie 39 — Mann–Whitney U: count wins and give ties half credit

Szene: `ex:l6-scene39`

For the X-oriented U, compare each X with every Y. X greater earns one point, equality half a point, and X smaller zero. Add across all nine pairs. This convention declares which group owns the score. Reversing orientation changes the score, so read software definitions carefully. The symbol legend explains the indicator function and pair indices.

**Transition:** Build the account one comparison at a time.

## Folie 40 — Build U: compare one pair, score it, add the points

Szene: `ex:l6s-pair-scene`

[Use Next comparison. Pause at the first tie; use Previous and Reset once.]

X-one is one and loses each comparison. X-two is two: it ties with Y-one, earning half a point, then loses to three and four. X-three is another original observation with value two. It contributes another half point against Y-one. The completed account is U-X equal to one. The ledger preserves each original pair and its credit. Reduced-motion mode shows the same states directly.

**Transition:** Check the completed calculation against the full grid.

## Folie 41 — Nine comparisons: who wins, loses or ties?

Szene: `ex:l6-scene40`

The grid contains zero X wins, seven losses and two ties. U-X is therefore one. Its null centre is four and a half. The report uses a declared tie-aware label-permutation reference and gives two-sided p 0.300. This example requires a reference that respects ties; the next slide shows exactly how the probability is counted.

**Transition:** Enumerate the possible group labels under H-zero.

## Folie 42 — From U = 1 to p = 0.300: relabel the six observations

Szene: `ex:l6s-u-reference-scene`

Choose three of the six original observations for X. There are twenty equally likely label assignments under exchangeability. Tied numeric values retain distinct identities. Recalculate U for each assignment. Observed U one is three and a half from the null centre four and a half. Six assignments give U at most one or at least eight. Thus two-sided p is six over twenty, or 0.300. At five percent, do not reject equal distributions.

**Transition:** Paired observations require their original differences.

## Folie 43 — Wilcoxon signed ranks: do paired measurements show a shift?

Szene: `ex:l6-scene41`

Keep the original pair identities and calculate one difference per pair. Rank the absolute nonzero differences, then restore each original sign. W-plus adds ranks attached to positive differences. Independent pairs and a symmetric difference distribution support the usual zero-shift reference. State the software rules for zero differences and absolute ties.

**Transition:** Why do five differences produce thirty-two sign patterns?

## Folie 44 — Five differences, 32 sign patterns: where does p come from?

Szene: `ex:l6s-sign-reference-scene`

Each of the five independent differences can have a plus or minus sign under the symmetric zero-shift null. Two choices multiplied five times give thirty-two patterns. Keep absolute differences and ranks fixed. Our positive ranks sum to thirteen; all ranks sum to fifteen, so the null centre is seven and a half. Three patterns give W-plus at most two, and three give at least thirteen. Two-sided p is six over thirty-two, or 0.1875.

**Transition:** Verify those ranks and read the report.

## Folie 45 — Wilcoxon signed ranks: do paired measurements show a shift?

Szene: `ex:l6-scene42`

Differences are one, minus two, three, four and five micrograms per litre. Their ranks of absolute difference are one through five. Positive ranks sum to thirteen and negative ranks to two. The report gives the same exact two-sided p, 0.1875. At five percent, do not reject the symmetric zero-shift null. The diagram says difference and rank of abs(diff); abs means absolute value.

**Transition:** Describe effect magnitude as well as testing a null.

## Folie 46 — Cohen's d: mean difference relative to within-group spread

Szene: `ex:l6-scene45`

Cohen's d divides the mean difference by a pooled within-group descriptive SD. For the NIR/HPLC-MS example, the mean difference is minus five micrograms per litre and the descriptive SD about 2.981. Their ratio is minus 1.677. Units cancel. Pooling here defines the effect-size denominator; the mean test remains Welch.

**Transition:** Interpret the value using a declared reference convention.

## Folie 47 — Cohen's d: mean difference relative to within-group spread

Szene: `ex:l6s-effect-scene`

We already have d equal to minus 1.677. Its sign says NIR reads lower. Its absolute magnitude says the mean difference is about 1.68 pooled within-group SDs. Read the table: below 0.2 negligible, from 0.2 small, from 0.5 medium, from 0.8 large. This result is large by those conventional bands. Chemical importance depends on the application and its requirements.

**Transition:** An ordering-based effect reuses the comparison grid.

## Folie 48 — Cliff's delta: which group tends to have larger values?

Szene: `ex:l6-scene47`

Cliff's delta subtracts losses from wins and divides by all cross-group comparisons, including ties. It ranges from minus one to plus one. Negative values describe X tending lower; positive values describe X tending higher. This is an ordering effect, complementary to a mean difference. Keep the declared X/Y orientation consistent.

**Transition:** Calculate and interpret delta for our nine comparisons.

## Folie 49 — Cliff's delta: which group tends to have larger values?

Szene: `ex:l6-scene48`

Zero wins minus seven losses over nine comparisons gives minus seven ninths, about minus 0.778. X tends lower in this sample. The conventional absolute-delta boundary for large is 0.474, so this is large by that convention. The nine comparisons reuse six original observations. Any sampling analysis must respect those original independent units.

**Transition:** Finally, investigate an unusually high nitrate value.

## Folie 50 — Grubbs outlier test: mistake or real nitrate event?

Szene: `ex:l6-scene49`

Five results are near ten milligrams per litre and one is 12.5. Possible explanations include preparation, contamination, instrument behaviour and a genuine event. Keep the observation and its sample identity. Check acquisition order, blanks, calibration and preparation records. A statistical flag helps focus investigation; a scientifically justified correction requires supporting evidence.

**Transition:** How extreme is the largest deviation under a single-outlier Normal model?

## Folie 51 — Grubbs test: compare G with its critical value

Szene: `ex:l6-scene50`

Grubbs divides the largest absolute deviation from the sample mean by sample SD, using all six original observations. G is about 2.0219. The two-sided five-percent critical construction gives about 1.8871 and accounts for searching the sample for its most extreme value. G exceeds the cutoff, so flag 12.5 under the independent Normal single-outlier model. The NIST footnote explains the reference. A flag cannot establish a laboratory error or authorise automatic deletion.

**Transition:** What if several observations look unusual?

## Folie 52 — Several suspected outliers? Plan a multiple-outlier procedure

Szene: `ex:l6s-esd-scene`

Plan a procedure designed for multiple outliers, such as Generalized ESD. Choose an upper bound r before testing. The method computes successive extreme-deviation statistics with its own adjusted critical values, then uses the largest qualifying step to determine the flagged count. Repeated fresh five-percent Grubbs tests change the error behaviour. A simple Bonferroni correction alone does not resolve adaptive deletion and masking. NIST reports reasonable approximation from fifteen observations and stronger approximation from twenty-five. Our six-point example remains a single-outlier illustration. Preserve the raw record and investigate causes.

**Closing:** Match the hypothesis, independent units, statistic and reference to the intended decision. Report the result together with its magnitude, assumptions and scientific context.
