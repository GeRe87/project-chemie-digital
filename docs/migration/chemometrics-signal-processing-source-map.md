# Chemometrics Signal Processing source reconciliation

## Status

This document is the source-reconciliation result for Issue #180 under roadmap/controller #169.

It is **migration planning evidence only**. It does not authorize RDF, LearningUnit,
UnitPlacement, LearningPath, Scene, renderer or generated-artifact changes.

Canonical authored semantics remain in `ontology/dataset/*.trig`.

## Source authority and pin

There is no dedicated Signal Processing file in the retained 17-file 2026 Markdown inventory.
For this topic, the available source-complete migration evidence is therefore the pinned public
lecture source:

- repository: `GeRe87/chemometrics_lecture`
- commit: `db2c5ef266641399c2b495646064e16cfdd473e4`
- commit date: 2025-01-21
- file: `topics/09_SignalProcessing.html`
- blob SHA: `1ac2cee2ea96d42c077fff12901f9783ff6efc7c`
- source footer: last updated 2024-12-10

The file is authoritative **only as migration evidence for this source-complete wave**. Scientific
claims still require reconciliation before they become canonical. Legacy HTML, CSS, JavaScript,
charts, tabs, sliders and slide boundaries are presentation evidence, not semantic authority.

## Source structure

The pinned file contains 33 slide sections in total: one title section and 32 substantive content sections. The content headings cluster
into four coherent scientific/didactic scopes:

| Source sections | Legacy headings / scope | Recommended unit |
| --- | --- | --- |
| 2–5 | What is Signal Processing; preprocessing for comparability; normalization; standardization; harmonization | Signal Processing Foundations and Preprocessing |
| 6–13 | Convolution; smoothing kernels; smoothing trade-off; elbow heuristic; Savitzky-Golay smoothing/derivatives/coefficient construction | Convolution, Smoothing and Savitzky-Golay |
| 14–23 | Fourier denoising; systematic frequency analysis; frequency filtering; Fourier summary | Fourier Filtering |
| 24–33 | DWT introduction; Haar wavelet; step-by-step transform; approximation/detail; multiresolution analysis; DWT summary | Wavelet Analysis |

This split follows conceptual prerequisites and reusable semantic identities rather than source
slide count. The four units belong to the existing OfferingSection
`ex:offering-section-chemometrics-signal-processing`.

There is **no separate within-section ordering property**. Later UnitPlacements must encode the
global course order. The intended relative order is:

1. Signal Processing Foundations and Preprocessing
2. Convolution, Smoothing and Savitzky-Golay
3. Fourier Filtering
4. Wavelet Analysis

Numeric UnitPlacement positions must be allocated only when the preceding Data Characterization,
Similarity Analysis and Data Modeling migrations have established their own global positions.

## Canonical reuse audit

An exact search of `ontology/dataset/` on the #180 planning baseline found the following reusable
scientific identities:

| Candidate | Decision | Evidence / boundary |
| --- | --- | --- |
| `ex:arithmetic-mean` | **REUSE** | Existing canonical concept in `standard-deviation.trig`; suitable for z-score centering and later smoothing/statistical explanations where the arithmetic mean is actually meant. |
| `ex:standard-deviation` | **REUSE** | Existing canonical concept in `standard-deviation.trig`; suitable for z-score scaling when the population/sample choice is stated explicitly. |
| `ex:variance`, `ex:sample-variance`, `ex:population-variance` | **REUSE when needed** | Existing canonical dispersion concepts; do not duplicate them merely to explain scale. |
| `ex:random-measurement-model-interpretation` | **REUSE as a guard/cross-reference only** | Existing canonical interpretation explicitly states that measurement noise must not be identified with measurement uncertainty. It is not a general signal-processing/noise ontology. |
| CogniFlow baseline-correction KeyPoints/diagram nodes | **DO NOT REUSE as the scientific concept** | They are presentation/pipeline-specific authored resources. Their wording is useful evidence that baseline correction exists as a processing intent, but they are not an exact reusable Signal Processing domain identity. |
| CogniFlow SNR presentation resources | **DO NOT REUSE as a generic SNR concept** | Presentation-specific DefinitionList/KeyPoint resources are not a canonical general SNR scientific concept. |

No exact canonical scientific resources were found for:

- min-max normalization;
- z-score standardization as a transformation;
- unit/label harmonization;
- analytical signal component decomposition;
- convolution;
- boxcar/moving-average smoothing;
- Gaussian smoothing;
- Savitzky-Golay filtering or derivative filters;
- root-mean-square smoothing error / smoothing-span selection;
- Fourier/DFT concepts or frequency filtering;
- wavelets, Haar wavelet or DWT;
- generic baseline drift or signal drift concepts;
- generic unit conversion.

Those scopes are therefore **CREATE candidates**, subject to normal implementation-time identity
review and scientific review. Absence of an exact label is not permission to duplicate a concept;
the implementation issue must repeat the reuse check against then-current `main`.

## Reconciliation by recommended LearningUnit

### 1. Signal Processing Foundations and Preprocessing

#### Source evidence

- analytical signal described as contributions from analyte, matrix and system;
- interference/suppression/enhancement, noise, drift and baseline as examples;
- min-max normalization;
- z-score standardization;
- unit harmonization and label harmonization.

#### Classification

| Source element | Classification | Migration disposition |
| --- | --- | --- |
| analyte / matrix / system contribution narrative | **CREATE + PATH** | Create conservative reusable concepts/interpretations for signal contributions only where definitions can be stated generally; keep the progressive “build the full signal” sequence in the path. Do not claim every analytical signal admits exactly three additive components. |
| min-max normalization | **CREATE + REUSE** | Create transformation definition/formula; reuse existing statistical concepts where applicable. Include the constant-vector edge case `max(x)=min(x)`. |
| z-score standardization | **CREATE + REUSE** | Create transformation definition/formula; reuse `ex:arithmetic-mean` and the appropriate standard-deviation identity. Make sample/population convention explicit. |
| unit harmonization | **CREATE + PATH** | Create only a conservative unit-conversion/harmonization interpretation if it adds reusable value. Require dimensional compatibility and explicit conversion factors. |
| label harmonization | **CREATE + PATH** | Treat renaming/semantic alignment as metadata/data-management interpretation, not as numerical signal processing. |
| progressive signal-composition chart/tabs | **RENDERER** | Candidate generic layered-signal demonstration; no chart state in RDF. |
| before/after normalization and standardization tabs | **RENDERER** | Candidate generic transformation comparison. |
| harmonization table toggle | **PATH / RENDERER** | Static worked examples are sufficient initially; interactive toggle is optional. |

#### Scientific corrections required before canonicalization

1. **Z-score robustness claim is wrong.** The legacy statement says z-score standardization is
   “robust to outliers”. Ordinary mean/standard-deviation standardization is itself sensitive to
   outliers. Canonical wording must say so.
2. **“Sensitive to scale” is misleading for z-score standardization.** The transformation is used
   specifically to remove location/scale differences. Its result depends on the estimated mean and
   standard deviation and on the population/sample convention, not on the original unit scale in
   the sense implied by the slide.
3. **The harmonization example contains a unit error.** In Table A, Fe is already labelled
   `µg/L` with values 0.1, 0.2, 0.3, yet the “harmonized” table changes them to 100, 200, 300
   `µg/L`. Those Fe values must remain 0.1, 0.2, 0.3 unless the source unit label itself was
   erroneous. Cu values 0.2, 0.3, 0.4 mg/L correctly become 200, 300, 400 µg/L.
4. Min-max normalization is undefined for a constant vector without an explicit convention.
5. “Signal consists of analyte, matrix and system signal” is useful pedagogy but should not become
   an exhaustive ontological decomposition without assumptions. Interference, suppression and
   enhancement may act through different physical mechanisms rather than simple additive signal
   components.

### 2. Convolution, Smoothing and Savitzky-Golay

#### Source evidence

- continuous convolution expression;
- moving boxcar example;
- boxcar and Gaussian kernels;
- Savitzky-Golay smoothing;
- smoothing/noise-vs-distortion trade-off;
- an elbow heuristic for span choice;
- Savitzky-Golay first derivative;
- Vandermonde/pseudoinverse coefficient construction.

#### Classification

| Source element | Classification | Migration disposition |
| --- | --- | --- |
| convolution | **CREATE** | Create a generic convolution concept plus distinct continuous/discrete mathematical expressions where both are taught. |
| kernel / smoothing kernel | **CREATE** | Create reusable kernel/smoothing interpretation; do not universalize properties that apply only to normalized smoothing kernels. |
| boxcar moving average | **CREATE** | Reusable smoothing method; distinguish window/boundary handling from the core method. |
| Gaussian smoothing | **CREATE** | Reusable weighted smoothing method; discrete weights must be normalized for the chosen window when DC preservation is intended. |
| Savitzky-Golay smoothing | **CREATE** | Reusable local-polynomial least-squares filtering concept. |
| Savitzky-Golay derivatives | **CREATE** | Separate derivative-filter interpretation/expression with derivative order and sample spacing. |
| smoothing trade-off | **CREATE / PATH** | Canonical interpretation may state bias/distortion vs noise suppression qualitatively; concrete slider experiment belongs to path/renderer. |
| elbow criterion for smoothing span | **PATH** | Keep as a heuristic exercise/selection narrative, not a universal optimality rule. |
| moving-window sliders/kernel toggles | **RENDERER** | Candidate generic smoothing explorer. |
| polynomial-order/window/derivative controls | **RENDERER** | Candidate generic Savitzky-Golay explorer. |

#### Scientific corrections required before canonicalization

1. The source pairs a **continuous convolution integral** with a discrete moving-window example.
   Canonical resources must distinguish continuous convolution from discrete convolution/filtering.
2. “The sum of the kernel should be 1” applies to normalized smoothing filters intended to preserve
   a constant/DC level, not to every convolution kernel.
3. Savitzky-Golay weights are not simply “polynomial coefficients”. They are convolution/filter
   coefficients derived from a local least-squares polynomial fit and depend on window length,
   polynomial order, derivative order, evaluation location and sample spacing.
4. “Ideal for preserving peak shapes” is too strong. Savitzky-Golay filtering can preserve low-order
   polynomial features better than a simple moving average under suitable choices, but it can still
   distort peaks and edges.
5. The smoothing “elbow criterion” is a heuristic whose result depends on the chosen error metric and
   reference/ground-truth definition. It is not a general estimator of an optimal smoothing span.
6. The source says a first derivative provides “baseline correction” and removes constant or linear
   trends by zeroing their derivative. A first derivative removes a constant offset, but a linear
   baseline becomes a non-zero constant. Canonical wording must not claim automatic removal of linear
   drift.
7. The displayed Savitzky-Golay pseudoinverse/coefficient derivation is pedagogically compressed.
   Canonical formulas must include the required full-rank/least-squares assumptions and the proper
   derivative scaling (including sample interval and derivative-order factors).

### 3. Fourier Filtering

#### Source evidence

- intuitive rotating-complex-exponential visualization;
- DFT expression;
- systematic frequency analysis;
- threshold/high-frequency filtering;
- sharp vs broad peak discussion;
- inverse transform;
- global-frequency / no-location limitation.

#### Classification

| Source element | Classification | Migration disposition |
| --- | --- | --- |
| discrete Fourier transform | **CREATE** | Create a DFT concept/expression with explicit discrete indices and normalization convention. |
| frequency spectrum / coefficient magnitude | **CREATE** | Reusable interpretation; distinguish complex coefficient, magnitude/power and frequency axis. |
| frequency-domain filtering | **CREATE** | Reusable filtering concept with assumptions about signal/noise spectral separation. |
| inverse DFT / reconstruction | **CREATE** | Reusable inverse-transform expression tied to the same normalization convention. |
| sharp-peak spectral bandwidth interpretation | **CREATE + PATH** | Keep as reviewed interpretation/example; avoid universal “broad vs sharp” denoising rules. |
| rotating-circle / complex-exponential animation | **RENDERER** | Candidate generic complex-basis projection visualization. |
| frequency sliders and spectrum build-up | **RENDERER** | Candidate generic Fourier exploration component. |
| threshold filtering slider | **RENDERER** | Candidate generic frequency-filter demonstration. |

#### Scientific corrections required before canonicalization

1. The legacy “axial frequency → radial frequency” explanation is not standard Fourier terminology.
   Replace it with projection/decomposition of a signal onto sinusoidal/complex-exponential basis
   functions in the frequency domain.
2. “Interference = combining axial and radial frequencies” must not be canonicalized.
3. The statement that the Fourier result is the distance from the **geometric mean** of the dataset
   to the origin is incorrect. A DFT coefficient is a complex weighted sum/inner product with a
   complex exponential; its magnitude can be visualized as the length of that resultant vector.
4. High-frequency thresholding is valid only when unwanted components are sufficiently separated
   spectrally from the signal. Noise is not universally high-frequency.
5. Sharp features generally require broad spectral support, so aggressive low-pass filtering can
   distort them; this source insight is retained with that qualification.
6. The global DFT does not localize a frequency in time/sample position. This limitation is retained,
   while later wavelet wording should use **position/time and scale localization**, not claim exact
   simultaneous time and frequency coordinates.

### 4. Wavelet Analysis

#### Source evidence

- DWT motivation relative to FFT;
- localized wavelets;
- Haar scaling and wavelet functions;
- approximation/detail decomposition;
- recursive/multiresolution analysis;
- denoising and reconstruction;
- alternative wavelet families.

#### Classification

| Source element | Classification | Migration disposition |
| --- | --- | --- |
| wavelet / scaling function | **CREATE** | Create reviewed concepts/definitions with zero-mean/admissibility wording appropriate to the taught level. |
| Haar wavelet | **CREATE** | Reusable specific wavelet example. |
| discrete wavelet transform | **CREATE** | Create transform/coefficient definition using discrete inner products/filter-bank formulation appropriate to the selected convention. |
| approximation/detail coefficients | **CREATE** | Reusable concepts tied to decomposition scale. |
| multiresolution analysis | **CREATE** | Reusable interpretation/concept; keep scale hierarchy explicit. |
| threshold/filtering of detail coefficients | **CREATE + PATH** | Reusable denoising interpretation plus worked example/path narrative. |
| Haar scale animation | **RENDERER** | Candidate generic wavelet/scaling-function visualization. |
| multiresolution decomposition/reconstruction figures | **PATH / RENDERER** | Static reviewed figures can be used initially; interactive decomposition is optional System work. |

#### Scientific corrections required before canonicalization

1. The source DWT expression is schematic rather than a complete coefficient definition. Canonical
   mathematics should express coefficients as discrete inner products/sums (or an explicit filter
   bank) at scale/shift indices.
2. DWT offers localization in sample/time and **scale**. Calling scale directly “frequency” is a
   useful intuition but not an exact one-to-one frequency coordinate for all wavelets.
3. The source block-average vectors using factors of `1/4` are a pedagogical averaging/difference
   construction, not the standard orthonormal Haar DWT normalization. If retained, they must be
   labelled as an intuition/example rather than the canonical Haar transform.
4. “Father wavelet” / “mother wavelet” terminology may be mentioned as informal legacy vocabulary;
   canonical definitions should prefer scaling function and wavelet function.
5. Reconstruction is performed by the corresponding inverse/synthesis transform. “Sum of
   approximations and filtered details” is only safe when stated within the exact multiresolution
   synthesis convention, not as an unrestricted literal sum across all displayed scales.
6. A zero-mean wavelet is an important property, but finite discrete filters and continuous wavelet
   definitions must not be conflated by one oversimplified “sum equals zero” rule.

## Final recommended migration boundary

Issue #180 recommends **four LearningUnits**, not one monolithic Signal Processing unit.

### Unit A — Signal Processing Foundations and Preprocessing

Primary reusable resources:
- `ex:arithmetic-mean`
- `ex:standard-deviation`

Expected CREATE scope:
- analytical signal contribution interpretation;
- min-max normalization;
- z-score standardization;
- unit/label harmonization interpretations and worked examples.

Path shape:
1. why signal processing;
2. signal contributions/interferences;
3. min-max normalization;
4. z-score standardization;
5. unit and label harmonization;
6. reviewed worked comparison.

### Unit B — Convolution, Smoothing and Savitzky-Golay

Expected CREATE scope:
- discrete/continuous convolution distinction;
- smoothing kernels;
- boxcar and Gaussian smoothing;
- smoothing trade-off;
- Savitzky-Golay smoothing;
- Savitzky-Golay derivative filters;
- reviewed coefficient construction.

Path shape:
1. convolution intuition and formal distinction;
2. boxcar;
3. Gaussian weighting;
4. smoothing trade-off;
5. Savitzky-Golay smoothing;
6. derivative filter;
7. coefficient/least-squares construction;
8. parameter-selection exercise/heuristic.

### Unit C — Fourier Filtering

Expected CREATE scope:
- DFT / inverse DFT;
- complex exponential basis;
- frequency spectrum;
- frequency-domain filtering;
- spectral bandwidth and peak-shape interpretation.

Path shape:
1. periodic components and complex exponential intuition;
2. DFT definition;
3. spectrum interpretation;
4. filtering;
5. spectral overlap / sharp-feature limitation;
6. inverse transform;
7. global-localization limitation.

### Unit D — Wavelet Analysis

Expected CREATE scope:
- wavelet and scaling function;
- Haar wavelet;
- DWT;
- approximation/detail coefficients;
- multiresolution analysis;
- wavelet-domain denoising and reconstruction.

Path shape:
1. motivation from Fourier localization limitation;
2. wavelet/scale/shift;
3. Haar example;
4. approximation/detail decomposition;
5. multiresolution hierarchy;
6. coefficient filtering;
7. synthesis/reconstruction;
8. alternative wavelet families and trade-offs.

## Renderer follow-up candidates

No renderer work is required to begin semantic migration. The source contains several interactions
worth preserving later as generic System components:

1. **Layered analytical-signal explorer**
   - progressively combine analyte, interference/suppression, noise and drift/baseline examples.

2. **Preprocessing transformation comparator**
   - original vs min-max vs z-score and optional harmonization examples.

3. **Kernel/Savitzky-Golay smoothing explorer**
   - kernel type, window/span, polynomial order and derivative order.

4. **Fourier projection and filtering explorer**
   - complex-exponential projection, frequency sliders, spectrum and filter threshold.

5. **Wavelet multiresolution explorer**
   - wavelet/scale choice, approximation/detail decomposition and reconstruction.

These should become separate bounded System issues only when a migrated path needs them. Static
worked examples and generic existing renderer primitives are acceptable first-pass presentation.

## Implementation sequencing

Recommended semantic implementation sequence:

1. Unit A — Foundations and Preprocessing
2. Unit B — Convolution, Smoothing and Savitzky-Golay
3. Unit C — Fourier Filtering
4. Unit D — Wavelet Analysis

Each implementation issue must:

- pin the same source commit/blob;
- repeat the current-main reuse audit before creating new identities;
- implement one bounded LearningUnit at a time unless the manager explicitly approves a smaller
  resource-only prerequisite issue;
- create exactly one UnitPlacement for the unit and group it under the existing Signal Processing
  OfferingSection;
- assign global UnitPlacement positions only against the then-current complete preceding course
  order;
- author one bounded LearningPath only after its reusable scientific resources are reviewed;
- keep interactive legacy behavior out of RDF;
- add provenance that distinguishes this pinned public source from the unavailable 2026 Markdown
  source set.

## Non-goals confirmed

This reconciliation does not:

- import legacy HTML or JavaScript;
- preserve slide count one-to-one;
- create prerequisite RDF from legacy ordering;
- create renderer coordinates/state in RDF;
- claim presentation-specific CogniFlow baseline/SNR resources as generic signal-processing
  identities;
- silently retain scientifically questionable legacy wording;
- change the source precedence established by #169.
