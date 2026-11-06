# ADR-0027: Independent thematic scripts and explicit question/answer steps

- Status: Proposed; local Level 5 authoring review, not merged or deployed
- Date: 2026-11-04

## Context

The owner requests rules-led Level 5 revisions visible in the real presentation.
A script is a thematic reading document, not a longer narration for each slide.
Existing `cd:narration` remains valid for older documents but is not repurposed.

## Local implementation

- Canonical prose and order live in `chemometrics-level5-script.trig` under one
  named script graph. `ThematicScript` binds one exact path/graph pair and has
  ordered `ScriptSection` occurrences. A section is owned by one script and has
  contextual prose and a local position, not a universal chapter number.
- Each ordered `ScriptMaterial` occurrence selects a shared scientific resource
  by its RDF identity. This first version reuses the validated material available
  in the selected course content. It cannot yet introduce a script-only formula
  absent from that content. Prose order never comes from scene order.
- The Python compiler emits additive, disposable `thematicScripts` transport
  records. Core validates their independent `1.0` contract, source provenance,
  exact path binding, selected related-scene references and material blocks.
  Older canonical-runtime `1.0` artifacts without the additive field remain valid.
- Every formula attachment includes its complete authored `dct:hasPart` legend.
  The HTML adapter reuses the common self-study block/formula renderer. Inline
  prose uses the existing escaping/explicit-math helper, not arbitrary HTML.
- Materials follow each chapter's prose in this review increment. More precise
  paragraph/formula interleaving and nested chapter hierarchies remain future
  refinements; no renderer guesses insertion positions from prose.
- `relatedScene` is optional navigation orientation, not script membership or
  order. A script need not be divided at these scene references. Switching back
  restores the previously visited slide rather than guessing a new one from the
  current chapter. Contents links scroll the reading pane without changing the
  presentation's hash/navigation state.
- Course transport retains only scripts for its exact selected level binding.
  The shared graph snapshot and existing scene graph behavior are unchanged.

## Questions

`guidingQuestion` and `answersGuidingQuestion` bind an Interpretation resource
to occurrences in one selected path. `answerResource` identifies the actual
answer content. SHACL checks node types/cardinality; compilation requires the
answer immediately after its question in the exact path graph and verifies that
both contents are actually selected for display. These are immediate pairs, not
general long-range inquiry or scored exercise semantics.

The Level 5 pilot binds the interval question to `rc09` and its quantile answer to
`rc10`. The 0.95 answer is explicitly a reference example, not a claim about all
live parameter states. Existing visual/formula layouts accept one concluding
prose block as a persistent footer, keeping the full-width ribbon stage.

## Scope and remaining gates

No LaTeX build is added. Browser printing provides a local A4 review PDF from the
same thematic HTML. A future LaTeX adapter must consume the script contract and
reuse static scientific material, not establish another authored content source.
The current work is not a full editor, nested document system, external citation
manager or claim of pedagogical effectiveness.

The first application preserves 41 scenes, all 30 formula units/43 authored symbol
groups, scientific data/defaults and optional R. The independent script has ten
chapters, with a different grouping of sampling topics from the slide sequence.
The original authoring-preview digest used a heading/cue mask and yielded
`c522b232d7a6b03c8d464b6802d5c37ca5d24bb49e19080b4bc780d7f4d8ca13`.
Owner feedback subsequently approves positive explanatory wording throughout
descriptions/alternative text and actual mathematical symbols in labels. Applying
that same editorial-field mask to fetched `a07792de` gives the revised protected
scientific digest
`a7edd1c8ea6fd2f9f0d58204930a5a204f0a243c1b166c89a783616af3ffcd0c`
(including the subsequently approved nested histogram-state caption mask);
the current revision matches it. Expressions, symbol identities, observations,
parameters, units, algorithms and R code remain protected.

## Rule refinements from live review

### Captioned occurrences and explicit references

The local thematic transport advances to 1.1; the reader retains 1.0 support.
Each material carries its occurrence IRI, authored caption and graph provenance.
`dct:title` describes the occurrence, while `cd:scriptResource` continues to
identify its shared scientific resource. An authored section's `dct:references`
relations to ScriptMaterial occurrences must exactly match its explicit inline
`[[ref:ex:occurrence]]` targets (literal code and math are excluded). Targets must
belong to the same resolved script. Figures, tables and equation units require
at least one prose reference; optional code listings may also be referenced.

Renderer-neutral numbering derives separate figure/equation/table/listing
counters from script order. HTML assigns stable occurrence-based anchors and
generates linked reference text; navigation preserves the Reveal hash. Print
keeps real caption text, complete formulas/legends and link destinations. This
also feeds the local LaTeX label/ref exporter described below.
The initial Level 5 application has 49 captioned occurrences: 9 figures,
30 equation units, one reused nitrate deviation table and 9 R listings, all with
authored prose references. Scientific formulas, observations and code are reused.

### Local LaTeX/PDF artifact

The G7 editorial follow-up separates figure-specific description from independent
argument in both projections. Existing `cd:ChartDefinition/cd:body` descriptions
are displayed as chart captions. Optional `dct:description` on a `cd:MediaAsset`
projects to `MediaReferenceBlock.caption`, with named-graph provenance and through
Reveal, self-study and static fallback; `alternativeText` stays independent.
Script occurrence `dct:title` remains the authored caption for that use of a
resource. Thematic HTML suppresses an additional nested chart title/description.
Its chart controls are disabled/hidden so fixed reference captions stay true;
the slides retain their controls and use state-independent descriptive captions.
No new RDF predicate or inferred prose classification is introduced.

`packages/renderer-latex/src/index.ts` projects the same captioned script into
LaTeX, reusing Core numbering, deterministic experiment results and published
histogram bins. It includes all saved histogram states, full formula/legend units,
the authored table and literal R listings. It neither depends on Reveal nor runs
R. Unsupported material kinds and unsafe TeX/math/code constructs fail explicitly.

`scripts/build_script_pdf.mts` invokes installed LuaLaTeX without shell escape or
automatic MiKTeX package installation, checks completed references/glyphs, and
publishes content-addressed PDF/TeX plus a source-bound generated manifest only
after successful compilation. The browser checks exact script/path/graph/format
identity and PDF bytes before enabling the native PDF link. Missing or stale
artifacts never route that action to HTML printing. Static builds generate in
their staged public tree and verify hashes and regenerated TeX. The slide-PDF
action and accessible HTML script remain separate. The initial PDF is not claimed
to be fully tagged or accessibility-certified. No public deployment is authorized.

Later visual review adds content-based `visual-cards` and `worked-calculation`
renderer compositions, shared numbered-card chrome for ordinary layered flows,
and flexible plot-height allocation in single/split experiment surfaces. These
remain presentation policies: RDF resources describe teaching content rather
than Reveal layout names. The new authored nitrate-spread answer is a normal
Interpretation selected by StatementRole. A visible question/result requirement
and peer top-alignment rule are documented in the teaching authoring draft;
structural checks supplement rather than claim to automate scientific review.

- G1: explain what holds, including in diagram descriptions and experiment
  Details. Repeated rhetorical disclaimers are removed. Relevant assumptions are
  stated as the scope of an assertion; mathematical outcomes and formal testing
  decisions retain their precise meaning.
- G2: use the authored symbols in visible headings/prose. The existing shared
  safe inline-math renderer now also serves presentation headings and Markdown
  explanations. HTML/MathML retains mathematical glyphs; shared contextual CSS
  aligns heading/navigation math with text size and baseline. No new font package
  or guessed conversion of arbitrary words is introduced. Simple SVG axis labels
  use the corresponding Unicode glyph; executable R source remains unchanged.

Focused tests and local browser review are not the required complete exact-head
release gate. Nothing is committed, merged or published as part of this preview.
