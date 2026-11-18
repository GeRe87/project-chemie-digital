# ANOVA review, 18 November 2026

The locally reviewed lecture contains 48 scenes. Eight contiguous review
sequences cover the generated scene order exactly, without omissions or
duplicates. All eight sequences have current assessments in five dimensions:
accuracy, reasoning, prerequisites, answer fit and visual clarity.

The reviewed source stamp is
`f5dc978fa6fa0b53411daa78024424b52be607ed10a463f95cfaea3109834774`.
The canonical dataset fingerprint is
`sha256:9651888c99c7535513aa8faf7787544ad59b2fdf9a1d58de85bfbef3d6f0a8e4`.

| Sequence | Scenes | Captured images |
| --- | ---: | ---: |
| Opening | 4 | 10 |
| Spread | 2 | 26 |
| Pairs and experimental design | 5 | 28 |
| ANOVA table | 9 | 44 |
| Diagnostics and effect size | 6 | 38 |
| Two-way ANOVA | 12 | 74 |
| Interactions | 5 | 40 |
| Tukey HSD | 5 | 20 |

The 280 images include both themes, every captured stage and relevant slider
extremes. Two independent model reviewers assessed the sequences. Their
follow-up reviews used prior context and selective image coverage for the five
previously reviewed sequences. The final reference-sequence review inspected
all 90 current images for spread, table construction and Tukey. An additional
continuity review examined final-stage text for all 48 scenes and twelve images
at sequence boundaries. No actionable findings remain within those scopes.
These are model assessments, not evidence of learning outcomes.

The F plot was additionally exercised live in both themes with within-group
mean square changing from 2 to 0 to 18. Zero correctly produces undefined F and
p; returning to 18 restores a full-height reference distribution with F = 2.333
and p = 0.1311.

Revisions explain additive means before partitioning variation, specify the
response and contrast when discussing synergy or antagonism, and connect the
interaction result to method comparisons within each matrix. The worked
interaction calculation accounts for 278 of the additive residual sum of
squares of 338, leaving 60. The diagnostic slides explain normal quantiles and
the fitted-normal KS distance; `scripts/check_anova_ks_calibration.py`
reproduces the displayed fitted-model p-values.

Review packets, screenshots, source/evidence-bound RDF assessments, complete
coverage and status manifests are retained in `.local/didactic-review/` in the
authoring checkout. See `docs/didactic-review.md` for reproduction commands.
These local evidence files are not lesson content and are not published with
the course. Publishing requires the separate production build and release
checks described in `docs/deployment/chemometrics.md`.
