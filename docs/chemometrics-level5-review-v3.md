# Level 5: Theoretical Distribution Models

The course contains **41 authored scenes plus its title**, in Region 3.
The cleanup keeps the exact selected scene documents: text, order, mathematics,
symbol legends, datasets, numerical defaults and optional R source are unchanged.

## Source cleanup

The owner's cleanup request supersedes the earlier decision to retain unselected
drafts in the shipped Dataset. Retired drafts, their dedicated tests, review notes,
preview commands and unused illustrations are removed; their history remains in Git.
Generic numerical algorithms, renderer contracts and tests remain reusable.

Level 5 is authored in four TriG files, not generated JSON:

- `chemometrics-level5-knowledge.trig`: models, expressions, symbols and sources;
- `chemometrics-level5-data.trig`: the required observations and model parameters;
- `chemometrics-level5-scenes.trig`: the selected scene definitions and items;
- `chemometrics-level5-review-complete.trig`: the sole selected learning path.

Original resource IRIs and named-graph identities are preserved. Reachability was
computed from the selected path and all resources outside the Level 5 draft files.
Historical `dct:references` links to retired scene/path drafts were excluded from
the retained graph. A detached before/after comparison verified identical compiled
Level 5 content and unchanged other compilable learning paths before any deletion.
Level 5 shrank from 31,610 to 5,629 RDF statements (about 82% fewer).

## Shared presentation surfaces

`apps/pitch/src/teaching-surfaces.css` owns one common content panel, an unboxed
nested-content variant and the shared workspace treatment. Composition styles
retain only their geometry, sizing and overflow responsibilities. They no longer
invent different card gradients, shadows or frame widths for each layout.
Decorative card counters are removed. Card headings use the common bold typeface;
body text uses normal weight, with authored emphasis retained.

Layout selection remains structural and identity-independent. Cards, a chart with
interpretation, a formula with illustration and a code/output workspace may require
different arrangements, but reuse the same surface system. Broad illustrations
still stack above equations according to intrinsic image geometry. No Level 5 or
scene-ID selector is introduced.

The native Symbols control, complete static/script/PDF legends, independently
scrollable code/output panes, keyboard handling and light/dark graphics remain.
For paper, a table and its formula/complete legend use one reusable two-column
arrangement. This fixes the earlier descriptive-spread page-width warning without
a scene-specific selector or changing scientific content.

## Preview and verification

Run `npm run preview:level5:generate`, then open
`http://127.0.0.1:5173/authoring.html?preview=authoring-level5-review-complete`.
Run `npm run pitch:intro` for the full course overworld.

Authoritative regression gate: `npm test`. Browser, PDF and deterministic content
checks supplement rather than replace it. Cleanup validation evidence is recorded
in the follow-up pull request; a pending test run is not a successful gate.

Local cleanup checks so far: unchanged 41-scene compiled content; 16 retained
scientific tests plus four cleanup tests; Pitch and 29 Self-Study app tests;
Edge deck/scroll audits without clipping or scrolling content; R workspace checks;
and all 42 PDF pages in both themes without errors or page-width warnings.
