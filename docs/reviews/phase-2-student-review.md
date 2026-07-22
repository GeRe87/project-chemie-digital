# Phase 2 pitch review — Bachelor chemistry student perspective

## Verdict

**Accepted with non-blocking findings.**

From the perspective of a Bachelor chemistry student with limited programming and semantic-web background, the accepted vertical slice has a credible learning example and a clear overall proposition once the standard-deviation demonstrator appears. The main orientation problem is that the canonical nine-step path introduces several architecture layers before making the chemistry use case and personal learning value concrete. The mathematical depth of the demonstrator is appropriate, but prerequisites and the interpretation boundary between precision and accuracy remain too implicit for a self-contained student-facing sequence.

This verdict does not claim pedagogical effectiveness, accessibility conformance, privacy compliance, technical correctness, institutional approval or publication readiness.

## Repository evidence reviewed

The review used repository evidence only:

- `docs/reviews/phase-2-chemistry-lecturer-review.md`
- `content/resources/pitch-content.jsonld`
- `content/paths/studiendekanat-pitch.jsonld`
- `content/concepts/standard-deviation.jsonld`
- `content/resources/standard-deviation-resources.jsonld`
- `docs/pitch-content.md`
- `docs/pitch-narrative-path.md`
- accepted theme/component and presenter-mode documentation under `packages/renderer-reveal/`
- `.agents/handoffs/issue-26-semantic-web-engineer.md`
- `.agents/handoffs/issue-28-instructional-designer.md`
- `.agents/handoffs/issue-30-frontend-engineer.md`
- `.agents/handoffs/issue-32-frontend-engineer.md`
- `.agents/handoffs/issue-34-chemistry-lecturer.md`

No external research or GitHub Actions evidence was used.

## What is immediately understandable?

The knowledge-first proposition is understandable at a high level: teaching content is stored once, selected for a purpose and rendered into different outputs. The phrases “reusable resources”, “learning paths” and “multiple output channels” communicate practical value when they are tied to examples such as definitions, formulas, exercises and presentations.

The standard-deviation proof of concept is the strongest student-facing part. Repeated measurements of a calibration solution are recognisable laboratory practice, and the sample-standard-deviation formula is familiar or plausibly learnable at Bachelor level. The closing return to the Studiendekanat purpose also helps explain why the platform is being demonstrated.

## Where is prior knowledge assumed but not supplied?

The statistical resources assume that the learner already understands the arithmetic mean, summation notation, squared deviations, units, repeated measurements and the idea of a measurement series. These assumptions are not made explicit before the formula and exercise.

The platform sequence assumes familiarity with distinctions among semantic resources, paths, scene composition, renderers and output channels. A student can follow each term individually when explained, but several consecutive abstractions create a vocabulary burden before there is a concrete chemistry problem to organise them.

## Which terms or interactions are confusing?

“Semantic resource layer” and “scene-composition boundary” are the least intuitive phrases. They describe valid architecture boundaries, but they do not immediately answer a student’s question: “What becomes easier for me or my lecturer?” “Renderer separation” is clearer only after it is translated into a visible consequence such as the same content becoming a presentation, exercise view or accessible static output.

Optional detail paths and presenter mode are acceptable as supporting interactions, provided the audience view clearly distinguishes the canonical sequence from optional material. Their repository contracts address deterministic navigation and focus restoration, but a rendered student review would still be needed to judge actual labels, discoverability and cognitive interruption.

## Can the learner explain the concept after the sequence?

After the standard-deviation sequence, a prepared Bachelor chemistry student should be able to say that standard deviation describes how strongly repeated values scatter around their mean and that a smaller value indicates greater repeatability or precision under the observed conditions. The current short sequence does not sufficiently ensure that the learner can also explain that low standard deviation does not prove accuracy or exclude systematic error.

After the complete pitch, a student can probably explain the platform proposition as “content is stored semantically, selected through a path and rendered into different learning views”. That explanation is more likely if every architecture term is paired immediately with one teaching-facing consequence.

## Findings

### SR-01 — Chemistry and personal learning value appear too late

- **Severity:** important
- **Ownership:** student orientation and instructional design
- **Evidence:** `docs/pitch-narrative-path.md`; `content/paths/studiendekanat-pitch.jsonld`; `content/resources/pitch-content.jsonld`
- **Student impact:** Steps 2–7 can feel like a software-architecture explanation before the sequence demonstrates why a chemistry learner or lecturer should care.
- **Smallest concrete improvement:** Add a brief early preview sentence or static visual using repeated laboratory measurements, then retain the full standard-deviation proof of concept at step 8. This confirms and sharpens CL-01 without changing the accepted path in this review.

### SR-02 — Standard-deviation prerequisites are not signposted

- **Severity:** important
- **Ownership:** instructional design and later semantic-content refinement
- **Evidence:** `content/concepts/standard-deviation.jsonld`; `content/resources/standard-deviation-resources.jsonld`
- **Student impact:** The formula can feel abrupt to students who know the arithmetic mean but are not fluent in summation notation or squared deviations.
- **Smallest concrete improvement:** Add a compact prerequisite cue naming mean, repeated measurements, units and squared deviations, preferably in presenter notes or a bounded prerequisite resource. This confirms CL-02.

### SR-03 — Precision can be mistaken for accuracy

- **Severity:** important
- **Ownership:** chemistry content refinement
- **Evidence:** `content/resources/standard-deviation-resources.jsonld`; `docs/reviews/phase-2-chemistry-lecturer-review.md`
- **Student impact:** A learner may infer that closely grouped measurements are necessarily correct.
- **Smallest concrete improvement:** Add one sentence: standard deviation characterises dispersion and precision, but does not by itself establish accuracy or rule out systematic error. This confirms CL-03.

### SR-04 — Architecture vocabulary is too dense in consecutive steps

- **Severity:** important
- **Ownership:** instructional design and presentation wording
- **Evidence:** `docs/pitch-narrative-path.md`; `docs/pitch-content.md`; `content/resources/pitch-content.jsonld`
- **Student impact:** “Semantic resource”, “path”, “scene composition”, “renderer” and “output channel” can blend together, especially for students without programming experience.
- **Smallest concrete improvement:** Pair each term with one stable plain-language question and consequence, for example: resource = “what can be reused?”, path = “what is selected and ordered?”, renderer = “how is it shown?”. This strengthens CL-07.

### SR-05 — The mathematical level is appropriate but interpretation should lead

- **Severity:** minor
- **Ownership:** chemistry teaching and instructional design
- **Evidence:** `content/resources/standard-deviation-resources.jsonld`; `docs/reviews/phase-2-chemistry-lecturer-review.md`
- **Student impact:** The sample formula is appropriate for Bachelor chemistry, but the denominator and notation can distract from why dispersion matters in laboratory work.
- **Smallest concrete improvement:** Present the laboratory question and interpretation before or alongside the formula; retain derivation and population-versus-sample detail as optional explanation. This is consistent with CL-04 and does not challenge the current mathematical scope.

### SR-06 — The laboratory examples feel authentic but need bounded attribution

- **Severity:** minor
- **Ownership:** chemistry content refinement
- **Evidence:** `content/resources/standard-deviation-resources.jsonld`
- **Student impact:** Calibration-solution replicates are immediately credible. The minireactor example is also plausible, but students may over-attribute observed variability to sensor instability rather than process variation or measurement noise.
- **Smallest concrete improvement:** Label the example as observed variability and state that additional evidence is needed to identify its source. This confirms CL-05.

### SR-07 — Optional interactions require explicit orientation in the rendered pitch

- **Severity:** accepted limitation
- **Ownership:** later usability and accessibility review
- **Evidence:** accepted presenter-mode and component documentation under `packages/renderer-reveal/`
- **Student impact:** Optional detail paths can support different prior-knowledge levels, but only if students can tell what is optional, how to return and whether the main sequence has changed.
- **Smallest concrete improvement:** In a later rendered review, verify visible optional labels, predictable return behaviour, focus restoration and a persistent indication of the canonical sequence. No implementation change is authorised here.

### SR-08 — Placeholder provenance limits trust for teaching use

- **Severity:** accepted limitation
- **Ownership:** later bibliographic/content verification
- **Evidence:** `content/resources/standard-deviation-resources.jsonld`; CL-06
- **Student impact:** Students may not notice source quality during a pitch, but an `example.org` reference is not sufficient when the material becomes a real learning resource.
- **Smallest concrete improvement:** Replace the placeholder through a separately governed verification task before publication. This confirms CL-06 without making a release decision.

## Assessment of Chemistry Lecturer findings

| Lecturer finding | Student-perspective disposition |
|---|---|
| CL-01 — chemistry appears too late | **Confirmed and strengthened.** The late chemistry anchor also delays personal learning value and orientation. |
| CL-02 — prerequisites are implicit | **Confirmed.** Mean and units may be familiar, but summation notation and squared deviations should be signposted. |
| CL-03 — precision versus accuracy | **Confirmed and student-critical.** The misconception is plausible without an explicit boundary sentence. |
| CL-04 — sample/population boundary | **Confirmed as minor.** The sample label should be consistent, but a full population treatment would overload the pitch. |
| CL-05 — sensor interpretation boundary | **Confirmed.** Observed variability should not be attributed to one source without evidence. |
| CL-06 — placeholder source | **Confirmed as an accepted Phase 2 limitation.** It blocks publication quality, not this architecture review. |
| CL-07 — architecture vocabulary | **Confirmed and strengthened.** The consecutive terms are the largest non-mathematical cognitive-load risk. |

## Deferred ownership

- **Instructional design:** early chemistry preview, prerequisite signalling, vocabulary pacing, optional-detail placement and cognitive-load distribution.
- **Chemistry content:** precision-versus-accuracy sentence, sample-standard-deviation labelling and bounded interpretation of observed variability.
- **Technical review:** deterministic projection, runtime behaviour and build/test correctness.
- **Accessibility review:** mathematical notation, reading/focus order, keyboard behaviour, reduced motion and static fallbacks.
- **Privacy review:** presenter-only information and absence of unintended learner data flow.
- **Institutional owner:** approval of the pitch, branding and publication decisions.

## Recommended next manager action

Accept this review as the bounded Bachelor chemistry student-perspective input for Phase 2 backlog item 19, subject to exact-head local validation. Preserve SR-01 through SR-08 and CL-01 through CL-07 for separately governed refinement and review tasks; do not modify semantic or renderer implementation in this review increment.