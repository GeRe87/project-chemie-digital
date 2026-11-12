# Level 7 ANOVA: didactic and visual review

The local review path contains 49 slides. The experiment, tables and other
evidence use the same local authoring frame. Formula and comparable-table tabs
operate only in the interactive view; the underlying resources remain
available in static reading order. The original N1 reference and Level 6
paths are unchanged.

- **Variation and the F test.** Each within-method table uses its original six
  observations and displays the group mean. The three residual sums of squares
  are 10 pp² each. The between-method slide connects the group means and
  sample sizes to the 84 pp². The new slide before the ANOVA table calculates
  the two mean squares, the F statistic and the upper-tail probability.
- **Effect size and follow-up.** The research question comes before the
  calculation of η². The decomposition slide checks that two calculations
  agree on 114 pp²; the effect-size slide compares the residual error of
  the grand-mean and method-mean models (114 vs. 30 pp²). The 73.7% describes
  the observed reduction in this sample. The Tukey worked slide plots the
  studentized range distribution for three groups and 15 residual degrees
  of freedom. Its right tail at q ≈ 6.928 gives adjusted p ≈ 0.000532 for
  B versus A. The simultaneous intervals follow.
  [NIST Tukey reference](https://itl.nist.gov/div898/handbook/prc/section4/prc471.htm)
- **Factorial interpretation.** The method marginal mean averages the two
  matrix-specific means with equal weights in the balanced design. A marginal
  mean does not predict recovery in either matrix separately.
- **Alternatives.** Welch and Kruskal–Wallis each have two slides with their
  own illustrative data. The Welch calculation explains the precision weights
  using the three observed group means, then shows how the weights produce the
  common reference mean before interpreting the F test. The Kruskal–Wallis
  example retains tied ranks and uses an exact permutation reference for the
  small sample. The transfer exercise
  compares a one-factor design, a crossed design and a one-factor design with
  unequal group variances.
  [Welch reference](https://stat.ethz.ch/R-manual/R-devel/library/stats/help/oneway.test.html)

The walkthrough's static values describe the authored data. They do not change
when someone adjusts the hypothetical sliders on “What makes F large?”.
In “Place F on the null distribution”, the F reference view shows a live ANOVA
table. The same current observations drive the plot and the table. Zero residual
variance leaves F and p undefined. Reset restores the original data.
Six additional figures visualize the sampling design, reporting, comparison
family and choice of method. The illustrated flow cards use short structured
labels. The inline teaching SVGs have a separate high-contrast dark palette.

For the didactic review of formulas, check three things from the audience’s
perspective: what question the calculation answers, what each key operation
does, and whether a worked substitution connects the formula to its result.
The same-slide symbol legend complements these explanations.
No production navigation or publication target is part of this review.
