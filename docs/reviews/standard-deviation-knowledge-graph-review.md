# Scientific and pedagogical review: Standardabweichung knowledge graph

## Scope and verdict

**Verdict: changes required.**

The graph is structurally strong and already suitable as the basis of a Bachelor-level chemistry learning sequence. The sample/population formulas, units, worked pH calculation, misconceptions, provenance separation and reuse across scenes are broadly coherent. Two important content corrections are required before the dataset should be treated as the canonical pedagogically accepted Standardabweichung example: the meaning of the `n - 1` convention must be qualified as an inferential estimator convention rather than an unconditional property of every sample dataset, and the comparison exercise must supply the two datasets (or an equivalent fully specified input) that learners are asked to compare.

Issue #53 must therefore not be treated as pedagogically accepted until the blocking findings below are dispositioned and re-reviewed.

## Review basis

Reviewed source: `ontology/dataset/standard-deviation.trig` on `main` after merge of issue #52. No scientific RDF, ontology, compiler or renderer content was modified in this review-only turn.

Severity classes:

- **blocking**: prevents canonical pedagogical acceptance;
- **important**: materially affects scientific precision or assessability and should be corrected in the bounded follow-up;
- **minor**: improves teaching quality or traceability but does not invalidate the current content.

## Findings

### F-01 — `n - 1` is presented too categorically

- **Severity:** blocking
- **Resources:**
  - `https://w3id.org/project-chemie-digital/resource/sd-definition-university-de`
  - `https://w3id.org/project-chemie-digital/resource/sd-definition-university-en`
  - `https://w3id.org/project-chemie-digital/resource/def-sample-standard-deviation`
  - `https://w3id.org/project-chemie-digital/resource/def-bessel`
- **Source location:** `ontology/dataset/standard-deviation.trig`, lines 49–52 and 65–66
- **Assessment:** The authored statements say that a sample “uses `n - 1`” and define the sample standard deviation solely through that denominator. For introductory analytical chemistry this is the conventional estimator, but the wording conflates a dataset being a sample with the inferential purpose of estimating population variance. A descriptive standard deviation of the observed values may be defined with `n`; the Bessel-corrected variance estimator uses `n - 1`, and taking its square root does not make `s` an unbiased estimator of population standard deviation.
- **Smallest bounded disposition:** Semantic Web and Ontology Engineer, reviewed by Chemistry Lecturer: revise only these definitions to state that `n - 1` is used for the conventional Bessel-corrected estimator of population variance from a sample; explicitly avoid claiming that every calculation on sample data must use `n - 1`. Preserve the existing formulas and sample/population distinction.

### F-02 — comparison exercise is not solvable from authored RDF

- **Severity:** blocking
- **Resources:**
  - `https://w3id.org/project-chemie-digital/resource/exercise-compare-series`
  - `https://w3id.org/project-chemie-digital/resource/criterion-compare-series`
- **Source location:** `ontology/dataset/standard-deviation.trig`, lines 103–104
- **Assessment:** The prompt asks learners to compare two measurement series with the same mean and different spread, but neither series is supplied or linked. The assessment criterion gives the desired conclusion, so the resource currently tests recall rather than an independently executable calculation and interpretation.
- **Smallest bounded disposition:** Semantic Web and Ontology Engineer: add two small ordered datasets with the same mean and distinct sample standard deviations, link both to the exercise, and extend the expected result or assessment criterion with the calculated values and the required precision-versus-trueness interpretation.

### F-03 — precision comparison needs explicit comparability conditions

- **Severity:** important
- **Resources:**
  - `https://w3id.org/project-chemie-digital/resource/criterion-compare-series`
  - `https://w3id.org/project-chemie-digital/resource/correction-sd-accuracy`
- **Source location:** `ontology/dataset/standard-deviation.trig`, lines 97 and 104
- **Assessment:** “Smaller standard deviation indicates higher precision” is appropriate only for comparable measurements under stated repeatability or reproducibility conditions, using the same measurand, scale and procedure. Without that boundary, learners may compare unlike concentration levels or methods directly by absolute standard deviation.
- **Smallest bounded disposition:** Chemistry Lecturer plus Semantic Web and Ontology Engineer: append one sentence limiting the comparison to commensurate series under the same stated measurement conditions; optionally point to relative standard deviation when scales or means differ.

### F-04 — caffeine example is chemically relevant but not a worked example

- **Severity:** important
- **Resource:** `https://w3id.org/project-chemie-digital/resource/worked-example-caffeine`
- **Source location:** `ontology/dataset/standard-deviation.trig`, line 119
- **Assessment:** The resource is typed as `cd:WorkedExample` but contains no observations, calculation steps, result or reporting unit. Its statement about precision and trueness is correct, yet it functions as a contextual vignette rather than a worked quantitative example.
- **Smallest bounded disposition:** Chemistry Lecturer: either reclassify it as a contextual example or add a compact, plausible repeated-determination dataset, unit, mean, sample standard deviation and one interpretation step. Do not imply method trueness without a reference value or recovery evidence.

### F-05 — source records are authoritative classes but lack claim-level locators

- **Severity:** minor
- **Resources:**
  - `https://w3id.org/project-chemie-digital/resource/source-openstax-statistics`
  - `https://w3id.org/project-chemie-digital/resource/source-vim`
  - `https://w3id.org/project-chemie-digital/resource/source-gum`
  - `https://w3id.org/project-chemie-digital/resource/source-nist-dispersion`
- **Source location:** `ontology/dataset/standard-deviation.trig`, source graph
- **Assessment:** The selected source classes are appropriate: introductory statistics for formulas, NIST for dispersion, and VIM/GUM for metrology. However, the book-level or publications-page links do not identify sections, clauses or editions closely enough for efficient verification of individual claims.
- **Smallest bounded disposition:** Documentation/provenance follow-up: add page, chapter, section or clause locators where available, without claiming formal standards compliance beyond the cited text.

## Required distinction review

| Topic | Review result |
|---|---|
| Sample vs population standard deviation | Formulas and symbols are correct; wording around when `n - 1` applies requires F-01 correction. |
| Bessel correction and degrees of freedom | The `n - 1` connection is present and correctly tied to variance estimation, but the estimator-purpose qualification is missing. |
| Formula symbols | `s`, `sigma`, `n`, `N`, `x_i`, `x-bar` and `mu` are defined consistently and used correctly in the formulas. |
| Units | Correct: standard deviation has the original unit; variance has the squared unit. pH is dimensionless in strict metrology, but reporting “pH” as the scale label is pedagogically conventional and acceptable here. |
| Variance | Correctly distinguished through squaring and unit difference. |
| Standard error | Correctly distinguished as spread of an estimator rather than spread of individual observations. |
| Relative standard deviation | Correctly presented as normalized spread; the graph would benefit from using it explicitly in F-03’s comparability note. |
| Precision | Conceptually correct, subject to the comparability boundary in F-03. |
| Trueness and accuracy | The graph correctly warns that small spread does not establish trueness. The separation is suitable at Bachelor level. |
| Systematic error | Correctly separated from random spread. |
| Measurement uncertainty | Correctly states that standard deviation may contribute to uncertainty but is not identical to measurement uncertainty. |

## Formula and worked-calculation check

For the pH observations `6.98, 7.01, 7.00, 7.02, 6.99`:

- mean: `7.00`;
- deviations: `-0.02, 0.01, 0.00, 0.02, -0.01`;
- sum of squared deviations: `0.0010`;
- sample variance: `0.0010 / 4 = 0.00025`;
- sample standard deviation: `sqrt(0.00025) = 0.015811...`, reported as `0.0158 pH`.

The authored sequence and arithmetic are correct.

## Prerequisites and sequencing

The prerequisite chain from measurement values through arithmetic mean, deviations, squared deviations, sum of squares and degrees of freedom is coherent for Bachelor chemistry. Nine scene definitions reuse stable resources rather than duplicating scientific prose. The sequence supports presentation, graph exploration and exercise views without introducing contradictory parallel definitions. The main pedagogical gap is assessability of the second exercise, not graph structure.

## Suitability decision

The dataset is **not yet accepted as the canonical pedagogically approved Standardabweichung example**. After F-01 and F-02 are corrected, F-03 and F-04 should be included in the same bounded content correction if feasible. F-05 may remain a documented non-blocking follow-up. A Chemistry Lecturer re-review should verify the exact corrected RDF before issue #53 is considered pedagogically accepted.