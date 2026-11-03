# Level 5: unobtrusive topic orientation

Local review, 2026-11-01. No commit, push, publication or deployment.
This increment responds to the user's difficulty tracking the current distribution
or subject across the lecture. No new lesson slides are added.

## Visible change

Every main and reserve slide now has one small stable topic line at the bottom left.
Examples include:

- Discrete distributions · Binomial
- Discrete distributions · Poisson
- Continuous models · Normal
- Sampling · Chi-square
- Sampling · Student-t
- Fit · Kolmogorov–Smirnov
- Fit · Pearson chi-square

Broader subjects such as distribution functions, standard error, confidence intervals
and the concluding synthesis have their own concise labels. Reserve topics are
explicitly marked as reserve. Labels stay consistent within a block, changing only
at an authored subject transition. The current slide's existing main title remains
the detailed explanation.

The line uses the bottom margin rather than another content row. Main content,
formula legends, charts, slide order and the six original comparison advances are
unchanged. It has no controls or animation and remains visible while stepping
through a comparison. Text is readable independently of the accent line's color.

## Shared implementation

See [ADR-0024](adr/0024-authored-scene-topic-context.md). The assignment is authored
as primary `dct:subject` relations and labelled SKOS resources in
`ontology/dataset/chemometrics-level5-topics.trig`. It is not inferred from IDs,
headings or a JavaScript course map. Focus concepts retain their domain meaning.

The compiler emits optional source-linked scene metadata under the unpublished
1.13 proposal. SHACL and Core validate it. Both renderer adapters preserve it;
static and self-study HTML retain escaped topic text and provenance. The pitch
component mounts a generic footer and associates it with its scene for assistive
technology. One capability-based style covers all opted-in scenes and mobile
viewports. No per-scene selectors or changes to accepted Levels 0-4 are introduced.

No learner data, persistence, runtime network service or deployment change is added.
All authored topic labels are English. No new formula is authored, and all existing
formula legends remain on their respective slides. Lecture timing is unaffected by
extra slide/reveal stages; the previously unresolved total timing remains unresolved.

## Verification

- Generation retains 64 main scenes and six separate reserve scenes. All 70 have
  authored topic labels and source provenance. Existing paths without subjects
  receive no topic metadata or footer.
- All 130 targeted Level-5 Python tests pass, including six new orientation tests.
  Tests check all assignments, within-block stability, distribution transitions,
  preserved content blocks/reading orders/narration, rejected invalid subjects,
  provenance, static alternatives and absence on accepted paths.
- All 42 focused Node tests pass across Core topic validation, pitch DOM/preview
  regression, adapter preservation and self-study HTML escaping. The new metadata
  does not create content blocks or fragments.
- Semantic validation conforms with fingerprint
  `fd9165df0f1390774ce3daf290de64fed6c19bb0156c4b306aa8597ac2d02dcc`.
  Log: `C:\Users\PCUser\AppData\Local\Temp\opencode\level5-topics-semantics.log`.
- Firefox passes the full 64-scene matrix at 1731 x 1006 light, 1280 x 720 dark and
  390 x 844 light. Topic checks cover the exact authored label, visibility, viewport
  fit and no truncation alongside the existing content/formula/fragment checks.
- Edge also passes the full 64-scene matrix in the same three configurations.
  Log: `level5-topics-edge-browser.log`. Representative desktop and phone screenshots
  reviewed.
- An additional Poisson-matrix run in both engines explicitly checks separation
  from the custom Previous/Next controls as well as Reveal's native controls in all
  three configurations; all checks pass. The footer uses the same generic reserved
  navigation margin for every authored topic.
- Both engines pass all six reserve views and native forward/reverse traversal in
  all three configurations. Native main-lecture traversal passes all 64 slides in
  both engines, retaining exactly six comparison advances and no new reveals.
- `git diff --check` passes with line-ending warnings only.
- The full `npm test` run on the unchanged current source completed successfully:
  all 686 Python tests and all Node suites pass. Log:
  `C:\Users\PCUser\AppData\Local\Temp\opencode\level5-topics-npm-test.log`.
  Semantic/feature sources remained unchanged during the run. This is current-source
  full-regression evidence for the topic-orientation capability and both Level-5 paths.

## Preview

Main lecture:
<http://127.0.0.1:5173/authoring.html?preview=authoring-level5-block1#/ex:l5-p07b-scene--scene>

Reserve:
<http://127.0.0.1:5173/authoring.html?preview=authoring-level5-reserve&viewport=native-portrait#/ex:l5-v01-scene--scene>
