# Scientific and pedagogical re-review: corrected Standardabweichung RDF

## Scope and verdict

**Verdict: accepted with non-blocking findings.**

The corrected canonical RDF resolves findings F-01 through F-04 from `docs/reviews/standard-deviation-knowledge-graph-review.md` coherently and without introducing a new blocking scientific or pedagogical problem. The Dataset is suitable as the pedagogically accepted Standardabweichung input for issue #53. Issue #53 may therefore proceed with the canonical TriG Dataset, subject to its own compiler, migration and exact-head validation requirements.

This is a repository-backed review of `ontology/dataset/standard-deviation.trig` on current `main` after merge of issue #58. No RDF, ontology, compiler, renderer, test or migration file was modified.

Severity classes:

- **blocking**: prevents pedagogical acceptance;
- **important**: materially affects scientific correctness or assessability;
- **minor**: improves traceability or teaching quality but does not prevent use;
- **accepted limitation**: explicit bounded limitation suitable for separate follow-up.

## Re-review of F-01 through F-04

### F-01 — estimator-purpose qualification

- **Disposition:** resolved.
- **Resources:**
  - `https://w3id.org/project-chemie-digital/resource/sd-definition-university-de`
  - `https://w3id.org/project-chemie-digital/resource/sd-definition-university-en`
  - `https://w3id.org/project-chemie-digital/resource/def-sample-standard-deviation`
  - `https://w3id.org/project-chemie-digital/resource/def-bessel`
- **Source location:** `ontology/dataset/standard-deviation.trig`, specification graph, definitions near lines 49–52 and 65–66.
- **Assessment:** The German and English university definitions now identify division by `n − 1` as the conventional Bessel-corrected estimation of population variance from a sample. They explicitly state that this is not an unconditional rule for every descriptive calculation and that taking the square root does not automatically produce an unbiased estimator of population standard deviation. The sample-standard-deviation and Bessel definitions preserve the same distinction. The sample and population formulas remain correctly separated.
- **Smallest bounded disposition:** none required.

### F-02 — executable comparison exercise

- **Disposition:** resolved.
- **Resources:**
  - `https://w3id.org/project-chemie-digital/resource/exercise-compare-series`
  - `https://w3id.org/project-chemie-digital/resource/dataset-compare-series-a`
  - `https://w3id.org/project-chemie-digital/resource/dataset-compare-series-b`
  - `https://w3id.org/project-chemie-digital/resource/expected-compare-series`
  - `https://w3id.org/project-chemie-digital/resource/criterion-compare-series`
- **Source location:** `ontology/dataset/standard-deviation.trig`, exercise resources near lines 103–105 and example graph near lines 119–126.
- **Assessment:** The exercise links two ordered datasets, `9, 10, 11 mg/L` and `5, 10, 15 mg/L`. Both have mean `10 mg/L`; their Bessel-corrected sample standard deviations are exactly `1 mg/L` and `5 mg/L`. The expected result and assessment criterion provide the correct calculation and interpretation while keeping the learner-facing prompt independently executable from authored RDF.
- **Smallest bounded disposition:** none required.

### F-03 — bounded precision comparison

- **Disposition:** resolved.
- **Resources:**
  - `https://w3id.org/project-chemie-digital/resource/correction-sd-accuracy`
  - `https://w3id.org/project-chemie-digital/resource/criterion-compare-series`
  - `https://w3id.org/project-chemie-digital/resource/expected-compare-series`
- **Source location:** `ontology/dataset/standard-deviation.trig`, correction near line 97 and exercise result/criterion near lines 104–105.
- **Assessment:** Absolute standard deviations are now compared only for commensurate series of the same measurand, scale and method under the same stated repeatability or reproducibility conditions. The content explicitly points to relative standard deviation when means or scales differ and states that precision does not establish trueness. This is scientifically appropriate and proportionate for Bachelor chemistry teaching.
- **Smallest bounded disposition:** none required.

### F-04 — quantitative caffeine worked example

- **Disposition:** resolved.
- **Resources:**
  - `https://w3id.org/project-chemie-digital/resource/worked-example-caffeine`
  - `https://w3id.org/project-chemie-digital/resource/dataset-caffeine`
  - `https://w3id.org/project-chemie-digital/resource/caffeine-step-1`
  - `https://w3id.org/project-chemie-digital/resource/caffeine-step-2`
  - `https://w3id.org/project-chemie-digital/resource/caffeine-step-3`
  - `https://w3id.org/project-chemie-digital/resource/caffeine-step-4`
- **Source location:** `ontology/dataset/standard-deviation.trig`, example graph near lines 128–142.
- **Assessment:** Five ordered observations (`99.8`, `100.1`, `100.0`, `100.2`, `99.9 mg/L`) yield mean `100.0 mg/L`, squared-deviation sum `0.10 (mg/L)²`, sample variance `0.025 (mg/L)²` and sample standard deviation approximately `0.158 mg/L`. The four calculation steps are internally consistent. The interpretation is limited to precision under the stated repeatability conditions and explicitly rejects a trueness conclusion without a reference value or recovery result.
- **Smallest bounded disposition:** none required.

## Required scientific distinctions and teaching suitability

| Topic | Re-review result |
|---|---|
| Sample vs population standard deviation | Correctly distinguished by purpose, symbols and denominator. |
| Bessel correction and degrees of freedom | Correctly tied to conventional population-variance estimation from a sample; no unbiased square-root claim remains. |
| Formula symbols and units | `s`, `σ`, `n`, `N`, `x_i`, `x̄` and `μ` remain coherent; standard deviation retains the measurement unit and variance uses the squared unit. |
| Variance vs standard deviation | Correctly separated by transformation and unit behavior. |
| Standard error | Correctly described as spread of an estimator rather than spread of individual observations. |
| Relative standard deviation | Correctly presented as normalized spread and now used in the comparability boundary. |
| Precision vs trueness/accuracy | Correctly separated; small spread does not establish absence of systematic error or trueness. |
| Measurement uncertainty | Correctly treated as distinct; standard deviation may be a component but is not the complete uncertainty. |
| Bachelor chemistry suitability | The sequence from repeated measurements through mean, deviations, variance and standard deviation is coherent; the comparison and caffeine examples connect the concepts to chemical measurement practice without excessive mathematical detail. |

## Non-blocking finding

### R-01 — claim-level source locators remain coarse

- **Severity:** minor / accepted limitation.
- **Resources:**
  - `https://w3id.org/project-chemie-digital/resource/source-openstax-statistics`
  - `https://w3id.org/project-chemie-digital/resource/source-vim`
  - `https://w3id.org/project-chemie-digital/resource/source-gum`
- **Source location:** `ontology/dataset/standard-deviation.trig`, source graph near lines 145–148.
- **Assessment:** The source classes remain appropriate, but several records identify a book or publication collection rather than a chapter, clause or page supporting each individual statement. This was already recorded as F-05 and does not invalidate the corrected calculations or distinctions.
- **Smallest bounded disposition:** retain as a separate provenance-cleanup backlog item; add claim-level chapter, section, page or clause locators when repository-authorised evidence is available. Do not delay issue #53 and do not claim formal standards compliance.

## Test evidence reviewed

`tests/test_standard_deviation_review_corrections.py` independently checks the estimator qualification, ordered comparison datasets, calculated means and sample standard deviations, precision boundary, complete caffeine example and deterministic Dataset fingerprint. These tests provide focused regression protection. Full acceptance still requires `agent-validator/project-chemie-digital: success` on the exact draft-PR head.

## Decision for issue #53

**Issue #53 may proceed using the corrected canonical TriG Dataset as pedagogically accepted input.**

This decision accepts the scientific and pedagogical content reviewed here. It does not pre-approve issue #53 implementation, browser output, migration completeness, accessibility, generated-artifact parity or removal of legacy JSON-LD/TypeScript compatibility inputs; those remain subject to issue #53 acceptance criteria, repository hygiene requirements and exact-head validation.
