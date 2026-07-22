# Phase 2 pitch review — Chemistry Lecturer and Subject-Matter Expert

## Verdict

**Accepted with non-blocking findings.**

The accepted Phase 2 vertical slice is scientifically defensible at Bachelor level and uses a recognisably chemical measurement context. No blocking scientific error was identified in the repository-backed pitch content. The main weaknesses are proportionality and framing: the nine-step pitch devotes most of its canonical sequence to software-architecture layers before reaching the chemical proof of concept, and the standard-deviation demonstrator does not yet make all prerequisite and interpretation boundaries explicit.

This verdict does not claim pedagogical effectiveness, institutional approval, visual quality, runtime correctness, privacy compliance or accessibility conformance.

## Reviewed repository evidence

The review used only current repository material:

- `content/resources/pitch-content.jsonld`
- `content/concepts/standard-deviation.jsonld`
- `content/resources/standard-deviation-resources.jsonld`
- `content/paths/studiendekanat-pitch.jsonld`
- `docs/pitch-content.md`
- `docs/pitch-narrative-path.md`
- `docs/product-vision.md`
- `docs/architecture.md`
- `docs/adr/0001-reveal-as-renderer.md`
- `docs/adr/0002-semantic-learning-compiler-layers.md`
- accepted renderer-neutral scene and knowledge-network contracts under `packages/core/` and `docs/examples/`
- accepted Reveal pitch-theme/component and presenter-mode material under `packages/renderer-reveal/`
- `.agents/handoffs/issue-26-semantic-web-engineer.md`
- `.agents/handoffs/issue-28-instructional-designer.md`
- `.agents/handoffs/issue-30-frontend-engineer.md`
- `.agents/handoffs/issue-32-frontend-engineer.md`

No external source, network lookup or GitHub Actions evidence was used.

## Review method

1. Trace each pitch statement to its declared repository source and inspect whether the wording remains within that evidence.
2. Review the nine-step canonical narrative separately for chemistry relevance, curriculum fit and vocabulary load.
3. Inspect the standard-deviation concept, formula, symbols, examples and exercise for Bachelor-level correctness and authentic chemical measurement relevance.
4. Separate content findings from concerns owned by later student, instructional-design, technical, privacy and accessibility reviews.
5. Classify every finding as `blocking`, `important`, `minor` or `accepted limitation` and prescribe a bounded disposition.

## Scope-by-scope assessment

### Scientific correctness

The standard-deviation definition, the sample-standard-deviation expression with denominator `n-1`, the symbol set and the numerical exercise are consistent at introductory Bachelor level. The calibration-solution replicate example is authentic to analytical chemistry, and the minireactor sensor example is plausible laboratory-data practice. The pitch does not make an unsupported claim about improved learning outcomes.

### Chemistry relevance

The proof of concept is grounded in repeated measurements, precision and sensor stability rather than a generic business-data example. This is a suitable bridge between chemistry, laboratory work and analytical data science. However, chemistry appears explicitly only near the end of the canonical pitch path; the earlier architecture sequence can therefore be perceived as a software project with a chemistry example attached.

### Curriculum fit

Standard deviation is appropriate foundational content for Bachelor chemistry, especially in analytical chemistry, physical chemistry laboratories and general measurement evaluation. The current resources assume familiarity with arithmetic mean, repeated measurements, units and the distinction between measurement value and measurement series, but these prerequisites are not stated in the pitch resources.

### Terminology

The German terms `Standardabweichung`, `Stichprobenstandardabweichung`, `Wiederholmessungen`, `Präzision`, `Kalibrierlösung` and `Sensorstabilität` are suitable. The architecture vocabulary — semantic resource, path, scene composition, renderer and output channel — is internally coherent but dense for a Studiendekanat audience unless each term is immediately tied to a teaching action or chemistry example.

### Prerequisite assumptions

The repository contains the required mathematical symbols and formula but does not explicitly state that learners should already understand arithmetic mean, summation notation, squared deviations and measurement units. The pitch also leaves implicit that standard deviation describes dispersion and does not by itself establish accuracy or absence of systematic error.

### Mathematical proportionality

One sample-standard-deviation formula is proportionate for the demonstrator. A derivation, population-variance treatment or inferential-statistics extension would be disproportionate for this pitch. The formula should remain subordinate to interpretation in a chemical measurement context.

## Findings

### CL-01 — Chemistry appears too late in the canonical pitch sequence

- **Severity:** important
- **Type:** content/narrative framing
- **Evidence:** `docs/pitch-narrative-path.md`; `content/paths/studiendekanat-pitch.jsonld`; `content/resources/pitch-content.jsonld`
- **Rationale:** Steps 2–7 unfold platform layers before step 8 introduces the standard-deviation demonstrator. For a chemistry Studiendekanat, this risks foregrounding software architecture for its own sake rather than a concrete teaching problem and its solution.
- **Recommended disposition:** Preserve the accepted canonical path, but in the later pitch assembly or optional-detail design add an early, brief chemistry anchor that previews repeated measurements or laboratory-data interpretation, then return to the full demonstrator at step 8. Do not add new scientific claims.

### CL-02 — Prerequisites for the standard-deviation demonstrator are implicit

- **Severity:** important
- **Type:** curriculum fit
- **Evidence:** `content/concepts/standard-deviation.jsonld`; `content/resources/standard-deviation-resources.jsonld`
- **Rationale:** The formula and exercise assume arithmetic mean, summation notation, squared deviations, units and a measurement-series concept. Without an explicit prerequisite boundary, the demonstrator can appear either more elementary or more mathematically abrupt than intended.
- **Recommended disposition:** Add a later bounded prerequisite-map or presenter-note refinement naming these prerequisites. Keep it outside this review PR and avoid changing the accepted semantic resources without a separately governed issue.

### CL-03 — Precision must not be conflated with accuracy

- **Severity:** important
- **Type:** scientific interpretation
- **Evidence:** `content/resources/standard-deviation-resources.jsonld`, especially `ex:standard-deviation-example-replicates`
- **Rationale:** The replicate example correctly connects standard deviation with precision, but the current short wording does not explicitly guard against interpreting low standard deviation as evidence of trueness or absence of systematic error.
- **Recommended disposition:** In a later content-refinement issue, add a concise interpretation note stating that standard deviation characterises dispersion/precision and does not independently establish accuracy or systematic-error freedom.

### CL-04 — The sample/population boundary is not stated

- **Severity:** minor
- **Type:** terminology and mathematics
- **Evidence:** `content/resources/standard-deviation-resources.jsonld`, `ex:sample-standard-deviation-expression`
- **Rationale:** The expression uses `n-1`, so it is specifically a sample-standard-deviation convention. The exercise names the sample standard deviation, but the definition itself says only `Standardabweichung`.
- **Recommended disposition:** Keep the current concise definition, but ensure the rendered formula or presenter explanation labels it consistently as the sample standard deviation and does not imply that all standard-deviation conventions use the same denominator.

### CL-05 — The sensor example needs an interpretation boundary

- **Severity:** minor
- **Type:** chemical/laboratory relevance
- **Evidence:** `content/resources/standard-deviation-resources.jsonld`, `ex:standard-deviation-example-sensor`
- **Rationale:** Temperature fluctuations in a minireactor may reflect sensor noise, process variability or both. The current wording says the measurements are examined for random fluctuations and sensor stability but does not distinguish these possible sources.
- **Recommended disposition:** Treat this as an example of observed variability. A later refinement may state that additional experimental evidence is required to attribute variability specifically to the sensor.

### CL-06 — The statistics source is a placeholder, not authoritative teaching provenance

- **Severity:** accepted limitation
- **Type:** provenance
- **Evidence:** `content/resources/standard-deviation-resources.jsonld`, `ex:reference-statistics-01` with an `example.org` URL
- **Rationale:** The repository explicitly models a source, but it is not yet a usable authoritative statistics reference. This does not invalidate the bounded architecture demonstrator, but it is insufficient for release as teaching material.
- **Recommended disposition:** Retain as a Phase 2 limitation. Before publication or OER release, replace it through a separately governed bibliographic/content-verification task with an appropriate authoritative source and provenance.

### CL-07 — Architecture vocabulary should remain subordinate to teaching decisions

- **Severity:** minor
- **Type:** audience proportionality
- **Evidence:** `content/resources/pitch-content.jsonld`; `docs/pitch-narrative-path.md`
- **Rationale:** Terms such as semantic resource layer, scene composition and renderer separation are relevant to the platform proposition, but several consecutive technical abstractions may exceed what the Studiendekanat needs to decide.
- **Recommended disposition:** For each architecture term, use one explicit teaching-facing consequence, such as reuse, adaptable learning paths or multiple accessible outputs. Defer wording and visual execution to the instructional-design and audience reviews.

## Blocking-content determination

No blocking content defect was found. The accepted resources do not contain a mathematically incorrect formula, chemically implausible core example or unsupported effectiveness claim. Findings CL-01 to CL-03 should be resolved before the pitch is treated as final or publication-ready, but they do not prevent continued Phase 2 integration and review.

## Items deferred to later bounded reviews

### Student review

- Whether students understand the architecture vocabulary and see personal learning value.
- Whether the standard-deviation example feels authentic and appropriately difficult.
- Whether the sequence supports orientation without prior platform knowledge.

### Instructional-design review

- Cognitive-load distribution across the nine steps.
- Whether an early chemistry anchor and later return to the demonstrator create a coherent narrative.
- Learning-objective alignment, optional-detail placement and prerequisite signalling.

### Technical review

- Correctness of scene projection, renderer contracts, presenter-state transitions and deterministic fallbacks.
- Build, test, lifecycle and no-network behaviour.

### Privacy review

- Separation of presenter-only state, notes, timing and audience output.
- Absence of learner tracking, analytics and unintended personal-data flow.

### Accessibility review

- Reading and focus order, contrast, keyboard operation, reduced motion and static fallbacks.
- Accessibility of mathematical notation and chemistry-specific terminology in rendered outputs.

## Recommended next manager action

Accept this review as the chemistry-lecturer evidence for Phase 2 backlog item 19, subject to exact-head local validation. Preserve CL-01 to CL-07 as explicit inputs for the later bounded review and refinement tasks rather than modifying accepted semantic or implementation files in this turn.
