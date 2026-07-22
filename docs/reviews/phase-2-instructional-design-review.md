# Phase 2 pitch review — Instructional Designer

## Verdict

**Accepted with non-blocking findings.**

The accepted nine-step Studiendekanat pitch is internally coherent as an institutional decision narrative: it establishes the platform proposition, unfolds the separation of semantic content, path, scene composition and renderer, grounds that architecture in the standard-deviation demonstrator, and returns to the intended vertical slice. The sequence is suitable for a bounded presentation, but it does not yet constitute a self-contained student learning path. The main pedagogical weaknesses are the late chemistry anchor, several consecutive architecture abstractions without a stable teaching-facing consequence, implicit prerequisites before the demonstrator, and insufficiently explicit separation between canonical presentation flow, optional presenter details and any future self-study pathway.

This review assesses design coherence from repository evidence only. It does not claim pedagogical effectiveness, scientific approval, accessibility conformance, privacy compliance, institutional endorsement or publication readiness.

## Repository evidence reviewed

- `docs/reviews/phase-2-chemistry-lecturer-review.md`
- `docs/reviews/phase-2-student-review.md`
- `content/resources/pitch-content.jsonld`
- `content/paths/studiendekanat-pitch.jsonld`
- `content/concepts/standard-deviation.jsonld`
- `content/resources/standard-deviation-resources.jsonld`
- `docs/pitch-content.md`
- `docs/pitch-narrative-path.md`
- `docs/product-vision.md`
- accepted theme/component and presenter-mode documentation under `packages/renderer-reveal/`
- accepted handoffs for issues #26, #28, #30, #32, #34 and #36

No external research or GitHub Actions evidence was used.

## Alignment across the canonical path

The pitch has one dominant decision purpose: demonstrate that semantically modelled chemistry knowledge can be selected through an explicit path and rendered into multiple usable outputs. Steps 2–7 form a coherent architecture explanation, step 8 supplies the concrete proof of concept, and step 9 reconnects the architecture to the Studiendekanat decision context.

The nine steps are therefore aligned as a presentation narrative, but not all are learning objectives in the student-facing sense. The audience should leave able to distinguish four practical decisions: what knowledge is reusable, how it is selected and ordered, how it is composed independently of a renderer, and how one knowledge base supports several outputs. The standard-deviation demonstrator then serves as evidence for those decisions rather than as a complete statistics lesson.

## Cognitive-load and scaffolding assessment

One principal message per canonical step is a sound baseline. The remaining load problem is cumulative: semantic resource, path, scene composition, renderer and output channel are introduced consecutively before the audience sees the chemistry case. This creates intrinsic and vocabulary load without an early organising example.

The accepted canonical order need not change. A bounded presentation refinement can add a brief chemistry preview within the opening context, then use the same preview as a recurring worked example while each architecture layer is explained. This creates advance organisation without adding a tenth canonical step or changing semantic content.

For every architecture term, the presentation should use the same three-part micro-scaffold:

1. one plain-language question;
2. one teaching-facing consequence;
3. one reference to the repeated-measurement example.

Suggested stable mappings are:

- semantic resource — “What can be reused?” — definitions, formulae, examples and exercises remain addressable;
- path — “What is selected and in which order?” — different audiences can receive different sequences;
- scene composition — “What belongs together in one communicative step?” — one scene carries one principal message;
- renderer — “How is the selected content shown?” — presentation technology does not define the knowledge model;
- output channel — “Where can the same knowledge be used?” — presentation, static view or later learning interface can share the source.

## Standard-deviation demonstrator

The demonstrator is appropriately bounded for the pitch when interpretation leads and notation supports it. Before the formula is shown, the audience should receive a compact prerequisite cue: repeated measurements, arithmetic mean, units and squared deviations. Summation notation may be named as optional prior knowledge rather than explained in full.

The presenter-facing explanation should preserve the accepted chemistry boundaries: the expression is the sample standard deviation, low dispersion supports a precision statement but not accuracy, and observed minireactor variability cannot be attributed uniquely to the sensor without further evidence. These are content refinements owned by a separately governed chemistry task; this review does not alter the semantic resources.

## Optional detail paths

Optional detail paths are pedagogically appropriate only when they remain visibly subordinate to the canonical sequence. Their best use is to adapt depth without changing the pitch argument:

- after the semantic-resource step: provenance or SHACL detail for a technically experienced audience;
- after the path/scene steps: deterministic ordering or composition detail;
- at the demonstrator: notation, sample-versus-population distinction or interpretation boundary;
- near the output-channel step: accessibility or renderer lifecycle detail.

Each optional path should state why it is optional, preserve a visible return point and avoid introducing a new prerequisite required by later canonical steps. Presenter-only notes may guide selection, but audience output must remain understandable when every optional path is skipped.

## Presentation versus future self-study

The current artifact is a decision-oriented presentation. It may preview learning-resource reuse, but it should not be described as a complete self-study unit. A later self-study path would require separately governed additions: explicit learner objectives, prerequisite resources, guided practice, feedback, assessment criteria, accessible mathematical explanation and source verification. Presenter notes, optional technical details and institutional decision prompts are not transferable as learner activities by default.

## Findings

### ID-01 — Add an early chemistry advance organiser

- **Severity:** important
- **Ownership:** presentation wording and later scene assembly
- **Evidence:** `docs/pitch-narrative-path.md`; CL-01; SR-01
- **Disposition:** Preserve the nine-step order; add one brief repeated-measurement preview in the opening context and reuse it as the example through steps 2–7.

### ID-02 — Bind every architecture term to one stable teaching consequence

- **Severity:** important
- **Ownership:** instructional design and presentation wording
- **Evidence:** steps 3–7 in `docs/pitch-narrative-path.md`; CL-07; SR-04
- **Disposition:** Apply the question–consequence–chemistry-example scaffold consistently; do not add further architecture vocabulary.

### ID-03 — Signal demonstrator prerequisites immediately before use

- **Severity:** important
- **Ownership:** instructional design plus later semantic-content refinement
- **Evidence:** CL-02; SR-02; standard-deviation resources
- **Disposition:** Add a compact presenter cue or separately modelled prerequisite resource naming repeated measurements, mean, units and squared deviations.

### ID-04 — Lead with interpretation, then formula

- **Severity:** minor
- **Ownership:** chemistry teaching and scene composition
- **Evidence:** CL-04; SR-05
- **Disposition:** Introduce the laboratory question and dispersion interpretation before or alongside the sample-standard-deviation expression; keep derivation optional.

### ID-05 — Make optional paths explicitly subordinate

- **Severity:** minor
- **Ownership:** presenter-mode wording and later usability/accessibility review
- **Evidence:** SR-07 and accepted presenter-mode contracts
- **Disposition:** Label optional depth, preserve the canonical position and return point, and ensure the canonical audience view is complete without optional material.

### ID-06 — Keep presentation and self-study contracts separate

- **Severity:** important
- **Ownership:** product and instructional design
- **Evidence:** `docs/product-vision.md`; current pitch and presenter-mode boundaries
- **Disposition:** Describe the present artifact as a pitch vertical slice. Create any self-study path only through a separate issue with objectives, prerequisites, practice, feedback and assessment.

### ID-07 — Preserve chemistry interpretation boundaries

- **Severity:** important
- **Ownership:** later chemistry-content refinement
- **Evidence:** CL-03, CL-05, SR-03 and SR-06
- **Disposition:** In a separate content task, state precision-versus-accuracy and observed-variability boundaries without expanding this review PR.

### ID-08 — Treat placeholder provenance as a publication gate, not a pitch blocker

- **Severity:** accepted limitation
- **Ownership:** bibliographic verification and human publication approval
- **Evidence:** CL-06; SR-08
- **Disposition:** Retain for Phase 2 architecture review; replace the placeholder source before teaching publication or OER release.

## Disposition of accepted Chemistry Lecturer findings

| Finding | Instructional-design disposition |
|---|---|
| CL-01 | **Confirmed and operationalised** as ID-01: early preview without changing canonical order. |
| CL-02 | **Confirmed** as ID-03: prerequisite cue immediately before the demonstrator. |
| CL-03 | **Confirmed; chemistry-owned** under ID-07. It is required before final student-facing content. |
| CL-04 | **Confirmed as optional depth** under ID-04; full population treatment is not required for the pitch. |
| CL-05 | **Confirmed; chemistry-owned** under ID-07. Present only observed variability. |
| CL-06 | **Confirmed as accepted Phase 2 limitation** under ID-08 and publication gate. |
| CL-07 | **Confirmed and strengthened** as ID-02 with a stable teaching-facing scaffold. |

## Disposition of accepted Student Reviewer findings

| Finding | Instructional-design disposition |
|---|---|
| SR-01 | **Confirmed and operationalised** through the early chemistry advance organiser. |
| SR-02 | **Confirmed** through just-in-time prerequisite signalling. |
| SR-03 | **Confirmed; deferred to chemistry refinement** before student-facing finalisation. |
| SR-04 | **Confirmed and prioritised** through the question–consequence–example scaffold. |
| SR-05 | **Confirmed**: interpretation precedes notation; derivation remains optional. |
| SR-06 | **Confirmed; deferred to chemistry refinement** with bounded attribution language. |
| SR-07 | **Confirmed as a later rendered-review item**; optionality and return orientation must be visible. |
| SR-08 | **Confirmed as a publication-readiness limitation**, not a blocker for this review increment. |

## Boundary of this verdict

No blocking pedagogical-coherence defect requires changing the accepted semantic resources, canonical path or renderer implementation in this review. ID-01, ID-02, ID-03, ID-06 and ID-07 should be resolved through separately governed refinement tasks before the pitch is treated as final student-facing or self-study material. Chemistry correctness, runtime behaviour, accessibility, privacy, institutional approval, branding and publication remain under their respective owners.

## Recommended manager action

Accept this review as the instructional-design evidence for Phase 2 backlog item 19, subject to successful exact-head local validation. Preserve ID-01 through ID-08 and all explicit CL/SR dispositions as inputs for later bounded refinement and specialist reviews.
