# Level 4 scientific knowledge graph — initial increment

**Scope:** reusable authored scientific RDF, independent of presentations. Issue #286, based on `chemometrics` after PR #285. The canonical sources are the new `ontology/dataset/level4-*.trig` files; this document is an implementation guide, not a second authored scientific source.

## Reuse and granularity

Reuse `ex:distribution`, `ex:median`, `ex:arithmetic-mean`, `ex:expected-value`, `ex:variance`, `ex:sample-variance`, `ex:population-variance`, and the shared mathematical rule resources. New concepts, source nodes, definitions, expressions, interpretations, misconceptions and their corrections are scoped to the Level 4 specification graph. No new RDF classes, predicates, or SHACL rules are introduced in this increment.

The graph has two conceptual tracks:

- **Order-based descriptors:** order statistic → empirical CDF → sample quantile method → quartiles → IQR, raw/scaled MAD, hinges, fences, boxplot.
- **Moment-based descriptors:** raw/central population moments → empirical central moments → standardized moments → descriptive sample skewness/kurtosis versus population skewness/kurtosis.

The conceptual categories *population parameter*, *descriptive sample statistic*, and *estimator* are modeled as linked scientific concepts, **not** as additional ontology classes or an unsupported assertion that every statistic is unbiased. Computational methods and source conventions are independently addressable resources.

## Explicit conventions

- **Population quantile**: generalized inverse of population CDF, for \(0<p<1\).
- **Sample quantile type 1**: inverse ECDF for \(0<p\le 1\), \(p=0\) uses the sample minimum by endpoint convention.
- **Sample quantile type 7**: default R `stats::quantile` linear interpolation with \(h=1+(n-1)p\). Formula for interior \(0\le p<1\), \(n\ge2\); at \(p=1\) use the maximum, for \(n=1\) the single observation.
- **IQR**: \(Q_{.75}-Q_{.25}\), with **one specified method**; R `IQR()` default is type 7.
- **MAD**: \(\mathrm{median}|x_i-\mathrm{median}(x)|\) (raw), versus R `mad()` default multiplied by about \(1.4826\) for asymptotic Gaussian consistency. No general finite-sample unbiasedness is claimed.
- **Boxplot**: R `boxplot.stats()` uses Tukey hinges; for even sample sizes they may differ from type-7 quartiles. Whiskers are *observed values* within declared fences, not the numerical fences.
- **Empirical central moments**: \(m_r=n^{-1}\sum_i(x_i-\bar x)^r\), including \(m_2\). The conventional Bessel-corrected sample variance is \(s^2=n m_2/(n-1)\) for \(n>1\); under iid sampling with finite variance it estimates the population variance without bias. The correction is not generic for higher moments.
- **Population shape**: skewness \(\gamma_1=\mu_3/\sigma^3\), kurtosis \(\beta_2=\mu_4/\sigma^4\), excess \(\gamma_2=\beta_2-3\); third/fourth absolute moments and \(\sigma>0\) are required.
- **Descriptive sample shape**: unadjusted \(g_1=m_3/m_2^{3/2}\), \(g_2=m_4/m_2^2-3\), defined when \(m_2>0\). Other bias-adjusted conventions are explicitly not conflated.
- **Analytical interpretation**: a Tukey fence labels potentially unusual observations; it is not permission to delete a laboratory result. Zero skewness does not prove symmetry; kurtosis is not central-peak height.

The Q1/Q3 and second empirical central moment results have **explicit quantitative concept identities** (first quartile, third quartile, empirical second central moment), not meanings inferred from resource ID strings. The recorded quartile/IQR results explicitly depend on the type-7 method via the already established `cd:dependsOn` relation.

The new QC example is **synthetic**: seven equal-weighted concentrations with an altered last value. It records exact observations and method-dependent results, not inferred chemical facts. Its comparison demonstrates stable median/IQR/raw-MAD but changed uncorrected \(m_2\).

## Provenance and further steps

Methods are grounded in primary R documentation (quantile, IQR, MAD and boxplot.stats); moment definitions/conventions in the NIST/SEMATECH e-Handbook. Source-resource ownership is explicit via `cd:hasSource` and `cd:supportsResource`.

**Deliberately deferred:** scene selection/Level 4 offering placement, ECDF step-geometry, boxplot renderer, linked analytical views, negative chart values, missing-data/imputation policies, chromatographic weighted moments, advanced robust-estimator theory and estimators' finite-sample bias derivations. These require separate authoring/contract reviews.

**Validation gates:** `python -m unittest discover -s tests -p test_level4_graph.py -v`; `python scripts/validate_semantics.py`; `npm test`; external exact-HEAD `agent-validator/project-chemie-digital`. No merge or deployment pending independent review.
