# ADR-0012: Deterministic responsive layout inference inside renderer adapters

- Status: Proposed
- Date: 2026-09-07

## Context

The project now compiles canonical semantic content into validated renderer-neutral `SceneDocument 1.0` values and can preview a generic valid scene document without requiring the historical Standard Deviation path identity. The next platform gap is presentation layout.

The current pitch implementation contains four useful but historical renderer-local layouts — `opening`, `statement`, `process`, and `split-proof` — and chooses among them through `apps/pitch/src/preview.ts::layoutByScene`, a map from concrete scene ids to layout names. This proved the visual vertical slice, but scene identity is not layout semantics. A course-scale renderer must be able to receive a previously unseen valid scene and choose a suitable presentation structure from the scene's actual content and didactic structure.

The existing architecture already fixes the most important ownership boundaries:

- ADR-0002 defines the one-way dependency direction from semantic graph through scene documents to renderer adapters and assigns framework-specific component selection, layout constraints, and fallbacks to renderer adapters.
- ADR-0003 makes `SceneDocument 1.0` renderer-neutral. It explicitly excludes pixel coordinates, responsive breakpoints, CSS classes, HTML/React/Reveal concepts, and renderer lifecycle state while preserving semantic `readingOrder`, source identity, accessibility metadata, grouping, disclosure, emphasis, and didactic intent.
- ADR-0004 states that didactic `viewType`/intent values do not select slides, fragments, components, widgets, tags, classes, or layouts.
- ADR-0005 makes the Reveal render plan adapter-owned, requires deterministic mapping, and requires semantic `readingOrder` to remain authoritative even when visual placement differs.

`SceneDocument 1.0` now provides the following block kinds:

- `prose`;
- `math`;
- `code`;
- `media-reference`;
- `list`;
- `group`;
- `prompt`.

Blocks may additionally carry `DidacticIntent`, `emphasis`, `disclosure`, accessibility metadata, source references, and nested reading order. This is enough evidence to begin deterministic layout selection without introducing presentation mechanics into RDF or the scene contract.

The architecture therefore needs to answer four questions before more templates are implemented:

1. who owns layout inference;
2. which semantic and measurable inputs may influence it;
3. how the same logical scene is realized under different available presentation spaces;
4. how selection, fallback, overflow recovery, accessibility, and debugging remain deterministic and testable.

## Decision summary

Adopt a **hybrid boundary: renderer-neutral evidence, renderer-owned inference and realization**.

`SceneDocument 1.0` remains unchanged and contains no layout intent, layout family, viewport, breakpoint, column ratio, template name, or physical-frame metadata.

Each renderer adapter may derive an **ephemeral layout analysis** from a validated scene, combine it with an explicit **layout environment** and a versioned **renderer-local layout policy**, generate compatible renderer-owned layout candidates, and select one deterministic layout decision.

Conceptually:

```text
canonical RDF / graph-backed SceneDefinition
        ↓
resolved path / scene composition
        ↓
validated SceneDocument 1.0
        │
        │ semantic evidence only
        ▼
┌──────────────────────────────────────────┐
│ renderer adapter                         │
│                                          │
│  scene analysis                          │
│       +                                  │
│  LayoutEnvironment                       │
│       +                                  │
│  versioned LayoutPolicy                  │
│       ↓                                  │
│  candidate families / variants           │
│       ↓                                  │
│  hard-constraint filtering               │
│       ↓                                  │
│  deterministic ranking + stable tie-break│
│       ↓                                  │
│  LayoutDecision + diagnostics            │
│       ↓                                  │
│  responsive visual realization           │
└──────────────────────────────────────────┘
        ↓
Reveal / self-study / print / future renderer
```

The terms `LayoutAnalysis`, `LayoutEnvironment`, `LayoutPolicy`, `LayoutCandidate`, and `LayoutDecision` in this ADR describe responsibilities. They are not new `packages/core` or RDF contracts in this increment.

If two or more renderer adapters later demonstrate substantial identical pure logic, that logic may be extracted into a downstream renderer-support package through a separate architecture decision. Such a package must depend on renderer-neutral core contracts and may be depended on by renderers; core, scene composition, canonical RDF, and ontology code must never depend on it.

## Why inference is renderer-owned

A scene's semantic structure is stable across output channels, but the cost and validity of a visual arrangement are not.

For example, `prose + media-reference` can mean the same thing in all renderers while suitable realization differs:

- a presentation renderer may prefer a 40/60 or 50/50 side-by-side frame;
- a narrow self-study view may stack prose and media;
- print may place the media below the prose or move it to the next page;
- an accessibility-oriented static view may ignore spatial juxtaposition entirely while retaining the semantic relation and reading order.

Therefore a cross-renderer persisted value such as `layout: "two-column"` would encode a downstream implementation choice as if it were authored meaning. A cross-renderer persisted value such as `layoutIntent: "text-media"` would be less specific but would still create a new upstream contract whose necessity has not yet been demonstrated. The existing block kinds, intents, grouping, emphasis, and reading order already expose the evidence from which a renderer can derive the same classification when appropriate.

The first implementation must consequently keep structural family classification ephemeral and renderer-owned.

## Permitted inference inputs

A layout resolver may inspect only evidence that is already available through the validated scene and explicitly supplied deterministic renderer inputs.

### Scene-document evidence

Permitted evidence includes:

- block kinds and their counts;
- `DidacticIntent.kind`;
- `emphasis`;
- direct and nested `group` structure;
- scene and group `readingOrder`;
- disclosure mode and order;
- accessibility labels/descriptions/non-visual alternatives;
- prompt response mode and whether options exist;
- list style and list-item count;
- code language, line count, editability/executability flags, and fallback presence;
- media type and other already-authored media-reference metadata;
- deterministic payload measurements such as prose length, paragraph/newline count, list length, code line count, math-expression length, block count, and group depth.

Measurements are descriptive signals, not semantic interpretation. Implementations must define their measurement functions as part of the versioned layout policy so that the same input is measured identically across runs.

### Explicit renderer inputs

A resolver may additionally receive deterministic renderer-local inputs such as:

- available logical width and height;
- interaction capability relevant to layout, such as whether a view is static or interactive;
- reduced-motion/static mode when it changes the number of simultaneously visible states;
- a versioned local theme/readability policy;
- explicitly supplied local asset metadata, for example intrinsic media width/height already known by an asset resolver.

A renderer must not perform an implicit network fetch to discover image dimensions or other layout metadata. If intrinsic media geometry is unavailable, the analysis records it as unknown and the candidate policy must remain deterministic under that uncertainty.

### Prohibited inputs and inference

A resolver must not:

- use scene ids, path ids, resource ids, filenames, or URI lexical forms as layout semantics;
- infer scientific relationships not present in the scene;
- rewrite, summarize, shorten, translate, or otherwise change authored content to make a layout fit;
- use labels as hidden template selectors;
- depend on an LLM, remote service, telemetry, learner history, or network lookup;
- treat renderer-local historical mappings as semantic truth;
- mutate the source `SceneDocument`.

Identifiers may be copied for traceability and deterministic generated-id construction, but their lexical values do not contribute to layout ranking.

## Structural family classification

A renderer may classify analyzed scenes into one or more **layout families**. A layout family is a renderer-owned structural hypothesis, not authored semantic state.

Illustrative family names are:

- `single-focus`;
- `text-media`;
- `media-focus`;
- `comparison`;
- `sequence` or `process`;
- `formula-explanation`;
- `data-explanation`;
- `concept-grid`;
- `practice`;
- `semantic-stack`.

These names are not a normative cross-renderer vocabulary. A renderer may expose different family names or combine/split these families provided it preserves semantics, source identity, accessibility, and deterministic behavior.

A family describes structural suitability. A **variant** is the concrete renderer-owned visual strategy. For example, a Reveal renderer might have variants such as:

```text
family: text-media
  ├── media-right-balanced
  ├── media-left-balanced
  ├── media-right-prominent
  └── stacked
```

A future CSS realization may implement those variants with grid columns or other layout primitives, but column percentages and CSS selectors are not part of the family classification and never leave the renderer boundary.

`semantic-stack` is the conceptual safe fallback: preserve all content in semantic reading order using the renderer's normal sequential flow. A concrete renderer may need pagination or physical frames to make that flow legible within a bounded canvas.

## LayoutEnvironment

Responsive selection must depend on available presentation space, not device names or browser-product detection.

An illustrative renderer-local boundary is:

```ts
interface LayoutEnvironment {
  readonly availableWidth: number;
  readonly availableHeight: number;
  readonly interactionMode: "interactive" | "static";
  readonly reducedMotion: boolean;
}
```

`availableWidth` and `availableHeight` are normalized logical presentation units defined by the renderer policy. For a browser renderer these may be integer CSS-pixel dimensions of the actual presentation container after deterministic normalization. The exact unit and normalization rule belong to the renderer policy and must be tested.

Aspect ratio is derived from width and height; it need not be supplied redundantly.

A renderer may map the continuous environment into coarse profiles such as:

- `wide`;
- `compact`;
- `narrow`.

Profiles are renderer-policy outputs, not device categories. The policy may define exact thresholds, but those thresholds remain renderer-local and versioned. Canonical RDF, `SceneDocument`, and a shared course runtime must never say `mobile`, `tablet`, `desktop`, `iPhone`, or a CSS breakpoint value as semantic presentation state.

Two environments that normalize to the same values under the same policy version must produce the same candidate order and decision.

## Deterministic analysis and candidate selection

Selection follows a pure staged pipeline:

```text
validated scene
   ↓
scene analysis
   ↓
structurally compatible candidate families
   ↓
renderer-local variants for current environment
   ↓
hard-constraint filtering
   ↓
deterministic score/rank vector
   ↓
stable tie-break
   ↓
selected LayoutDecision
```

### Hard constraints first

A candidate is rejected before scoring when it cannot satisfy a mandatory invariant. Examples include:

- a candidate requires media but the scene has none;
- a comparison variant requires two compatible sibling groups but only one exists;
- a candidate would violate semantic reading-order traversal in its accessible DOM realization;
- required content would be omitted;
- a candidate cannot represent a mandatory prompt fallback in static mode;
- a candidate requires a minimum media or code viewport that cannot be met under the current theme/readability policy;
- a physical split would break a renderer-local unsplittable unit without an allowed recursive fallback.

Hard constraints must have stable machine-readable rejection codes.

### Ranking dimensions

Remaining candidates are ranked from deterministic dimensions such as:

- structural/semantic fit to block kinds and didactic intents;
- content-density fit;
- preservation of meaningful grouping;
- support for `primary` versus `supporting` prominence;
- suitability for known media geometry;
- suitability for the current layout profile;
- estimated overflow risk;
- amount of unnecessary fragmentation;
- static/reduced-motion compatibility.

The first implementation should prefer an ordered integer score/rank vector or another representation with stable comparison semantics. It must not rely on platform-dependent floating-point behavior when a simpler stable representation is sufficient.

The exact weights or rank rules are implementation policy, not fixed by this architecture-only ADR. They must be versioned and regression-tested when introduced.

### Stable tie-break

When two candidates have equal ranking, selection uses an explicit stable renderer-policy order or stable candidate id. Iteration order of object properties, hash maps, DOM discovery order, filesystem order, or random choice must never decide the winner.

The determinism invariant is:

```text
identical validated SceneDocument
+ identical normalized LayoutEnvironment
+ identical asset metadata input
+ identical layout-policy version
= identical LayoutDecision and diagnostic codes
```

## LayoutDecision ownership

A `LayoutDecision` is ephemeral or adapter-owned generated state. It may be serialized inside a renderer-owned render plan when that renderer needs deterministic review/debug output, but it is never written back to canonical RDF or `SceneDocument`.

An illustrative adapter-local decision may contain:

```ts
interface LayoutDecision {
  readonly policyVersion: string;
  readonly sourceSceneId: string;
  readonly profile: "wide" | "compact" | "narrow";
  readonly family: string;
  readonly variant: string;
  readonly visualOrder: readonly string[];
  readonly framePlan?: readonly PhysicalFramePlan[];
  readonly diagnostics: readonly LayoutDiagnostic[];
}
```

This sketch is not a production API. In particular, `family`, `variant`, profile thresholds, and `PhysicalFramePlan` belong to the renderer adapter.

`sourceSceneId` exists only for traceability. Its value does not influence family or variant selection.

## Visual order versus semantic reading order

A renderer may place content visually in a different spatial order from semantic `readingOrder`. For example, a media block that is second in reading order may appear visually on the left while explanatory prose that is first in reading order appears on the right.

The semantic order remains authoritative for:

- accessible DOM/source order where applicable;
- keyboard traversal of content controls;
- static fallback;
- linear export;
- physical-frame partitioning;
- reconstruction of a logical scene from multiple physical frames.

Visual placement must therefore be expressible independently from semantic traversal. CSS grid/flex ordering, absolute positioning, or equivalent renderer mechanisms may not change the semantic source order exposed to assistive technology.

## Responsive realization

Responsive behavior is a transformation of **renderer-owned layout realization**, not authored content.

A renderer may choose different variants for the same analyzed scene under different normalized environments. For example:

```text
same SceneDocument scene
        │
        ├── wide
        │     text-media / side-by-side
        │
        ├── compact
        │     text-media / balanced-or-stacked
        │
        └── narrow
              text-media / stacked
```

The source scene id, source block ids, complete content, semantic reading order, alternatives, disclosure semantics, and source/provenance references remain unchanged.

A profile transition must not require a second authored scene, duplicate RDF content, or a mobile-specific content source.

## Overflow and recovery hierarchy

Pre-layout estimates cannot guarantee fit because actual rendering depends on fonts, KaTeX output, SVG/media geometry, browser shaping, and other renderer-local facts. Layout selection therefore uses a two-stage architecture.

### Stage 1: deterministic preflight

Before DOM/materialized rendering, analysis estimates density and rejects obviously incompatible candidates. The resolver returns an ordered primary decision and deterministic fallback chain.

### Stage 2: measured renderer feedback

A later implementation may materialize the selected variant and measure bounded fit conditions. Measurement belongs to the renderer runtime. It must not mutate scene semantics or invent a new candidate outside the policy.

Measured feedback may report stable conditions such as:

- content overflow in the available block dimension;
- media below its minimum legible size;
- code/math clipping;
- required control below minimum target size;
- text exceeding the renderer's allowed readable region.

The resolver then advances through the predeclared deterministic recovery hierarchy:

1. alternate variant in the same family;
2. compatible lower-risk family, commonly a stacked representation;
3. semantic sequential fallback;
4. bounded physical-frame/page splitting when supported;
5. complete static/print fallback.

No retry loop may change policy weights dynamically or repeatedly resize until something happens to fit.

### Typography is not an overflow escape hatch

A renderer may use normal responsive typography within a versioned theme range, but a candidate becomes invalid once fitting it would require text, equations, code, media, or controls below configured readability/accessibility minima.

The architecture explicitly rejects unbounded automatic font shrinking as a universal fit strategy.

## Physical frames and mobile semantics

A constrained renderer may represent one logical scene through multiple **physical frames** when stacking alone still cannot present the complete scene legibly.

Physical frames are renderer-owned. They are not new `Scene` values and are never written upstream.

A valid physical-frame plan must satisfy all of the following:

1. the logical `sourceSceneId` remains unchanged;
2. every source block is represented completely;
3. source blocks are assigned according to semantic `readingOrder`;
4. the frame sequence is deterministic;
5. the ordered frame sequence reconstructs the original logical scene without semantic loss;
6. no source block is silently duplicated or omitted;
7. generated frame identities are deterministic adapter identities, not canonical RDF identities;
8. static export retains complete content even if the interactive renderer uses frame navigation.

A simple implementation may partition direct blocks into contiguous ranges of semantic `readingOrder`.

Nested groups should normally remain together when they fit. If a group itself exceeds the available physical frame, a renderer may recursively partition its children only in the group's explicit `readingOrder`. A later implementation must define exact group-splitting rules before enabling this behavior.

A renderer may repeat derived chrome such as the scene label on subsequent frames for orientation. Repeated chrome is renderer-generated and must not masquerade as a duplicated authored source block.

Physical-frame position is presentation runtime state. It is not learner progress and must not be written to the learner-state bounded context unless a separate future product requirement explicitly establishes that meaning.

ADR-0005 currently maps one logical scene to one top-level Reveal section in `RevealRenderPlan 1.0`. Physical-frame support therefore requires an explicit adapter-local render-plan evolution in the later implementation increment. It does not require a `SceneDocument` change.

## Static and print behavior

Static mode is not allowed to lose content merely because an interactive layout family is unavailable.

A static or print renderer must preserve:

- all authored blocks;
- semantic reading order;
- source/provenance traceability where the output channel supports it;
- math spoken/non-visual alternatives in an appropriate accessible representation;
- media alternative text;
- prompt fallback content;
- disclosure content, including progressive and optional material.

Print pagination and static stacking are renderer-local realizations. They may differ spatially from the live presentation while remaining semantically equivalent.

## Accessibility invariants

Layout inference and realization must preserve the accessibility obligations already established by ADR-0003 and ADR-0005.

In particular:

- visual placement does not redefine semantic reading order;
- no candidate may omit source content solely because it does not fit;
- inaccessible candidates are rejected rather than selected with a warning;
- media and mathematics retain their required alternatives;
- prompt fallbacks remain available regardless of interaction support;
- reduced-motion mode preserves the same content and logical sequence;
- controls introduced by a renderer remain keyboard-operable and focus-visible;
- a narrow/mobile realization may not require pointer-only gestures to reach a physical frame;
- focus order follows semantic traversal and deterministic frame order, not visual coordinates.

## Author hints and overrides

This ADR adds **no new author hint** to RDF or `SceneDocument 1.0`.

The current evidence (`DidacticIntent`, `emphasis`, semantic groups, disclosure, block kinds, and reading order) should first be used to implement and evaluate deterministic layout inference. This avoids adding presentation preferences before a concrete insufficiency is demonstrated.

If later evidence shows that generic semantics are insufficient, a separate reviewed increment may consider renderer-neutral soft constraints such as `preferTogether`, `avoidSplit`, or `preferProminent`. Such a constraint must:

- describe a presentation preference without naming CSS, columns, components, or renderer templates;
- remain advisory when legibility/accessibility requires override;
- have explicit precedence relative to semantic order and hard accessibility constraints;
- be versioned if it changes a shared contract;
- not automatically become RDF vocabulary.

Any canonical RDF/ontology vocabulary for presentation hints requires a separate semantic-governance decision and is outside this ADR.

## Diagnostics and explainability

Smart selection must be inspectable. Every resolver implementation must expose stable structured diagnostics sufficient to explain why a candidate was selected or rejected.

Illustrative reason codes include:

- `SELECTED_STRUCTURAL_FIT`;
- `REJECTED_REQUIRED_BLOCK_KIND`;
- `REJECTED_READING_ORDER_CONSTRAINT`;
- `REJECTED_READABILITY_CONSTRAINT`;
- `MEDIA_GEOMETRY_UNKNOWN`;
- `DENSITY_OVERFLOW_RISK`;
- `FALLBACK_ALTERNATE_VARIANT`;
- `FALLBACK_STACKED`;
- `FALLBACK_PHYSICAL_FRAME_SPLIT`;
- `FALLBACK_STATIC_SEQUENCE`;
- `NO_COMPATIBLE_PRIMARY_CANDIDATE`.

Exact production codes are defined by the implementation issue and versioned with the policy contract.

A development/debug overlay may show:

```text
policy: reveal-layout/1
profile: wide
selected: text-media / media-right-prominent

accepted because:
  + prose + primary media
  + low prose density
  + wide available region

rejected:
  text-media / balanced
    - media below preferred prominence
  semantic-stack
    - valid but lower structural fit
```

Human-readable text is explanatory only. Program behavior and tests must depend on structured codes and stable fields, never free-text wording.

## Representative architecture evidence

The examples below classify structural behavior only. They do not add scientific content or prescribe final visual design.

### 1. Heading plus explanatory prose

Current scenes often express a heading as a `prose` block with `intent: introduce`, followed by explanatory `prose`.

Analysis:

```text
prose[introduce]
prose[explain]
```

Likely candidates:

- `single-focus`;
- `semantic-stack`.

The exact visual hierarchy is renderer-owned. The scene id does not influence selection.

### 2. Heading plus prose plus media reference

Analysis:

```text
prose[introduce]
prose[explain]
media-reference[primary]
readingOrder = heading → prose → media
```

A wide environment may select:

```text
┌─────────────────────────────────────────┐
│ heading                                 │
├──────────────────┬──────────────────────┤
│ prose            │ media                │
│                  │                      │
└──────────────────┴──────────────────────┘
```

The DOM/source traversal can remain heading → prose → media even if the renderer visually places media on the left or gives it more width.

A narrow environment may deterministically select:

```text
┌──────────────────────┐
│ heading              │
├──────────────────────┤
│ prose                │
├──────────────────────┤
│ media                │
└──────────────────────┘
```

Both are realizations of the same logical scene with the same source identities and semantic reading order.

### 3. Heading plus math plus explanatory prose

Analysis may classify `math + prose[explain|derive]` as a `formula-explanation` family candidate.

Wide variants may juxtapose the formula and explanation; compact/narrow variants may stack them. `spokenText` remains available independently of visual position.

If the expression is too wide at the minimum permitted math scale, the side-by-side variant is invalid and fallback occurs. The resolver does not rewrite the expression or make it microscopically small.

### 4. Heading plus KeyPoint list

A `list` block exposes list style and deterministic item count. A small list may fit a focused statement/list family; a dense list receives a higher density risk and may select a more sequential representation.

List-item identities and their source references are preserved. Visual multi-column list rendering, if later supported, must not alter semantic item order.

### 5. Heading plus prompt/exercise

A `prompt` with `intent: practice` makes a `practice` family structurally suitable. Response mode may influence available renderer controls, but static mode always retains the authored prompt fallback.

Layout selection does not depend on whether the learner previously answered the prompt.

### 6. Grouped or comparison-like scene

A scene containing two sibling semantic groups and `intent: contrast` may make a `comparison` family a strong candidate. Without structural evidence such as grouping/contrast, the resolver must not infer that arbitrary adjacent prose blocks are conceptually opposing claims.

On narrow views the two groups may stack while maintaining the group's semantic order.

### 7. High-density case

Consider a scene with a heading, long prose, a multi-item list, a math block, and a large media reference.

A wide two-column candidate may pass structural compatibility but receive high estimated overflow risk. If measured rendering confirms overflow, recovery proceeds through a lower-risk variant, stacking, then physical-frame/page splitting.

At no point may the renderer silently drop the list/media, abbreviate prose, or shrink typography below the configured minimum merely to preserve one physical slide.

## Historical pitch layouts

`apps/pitch/src/preview.ts::layoutByScene` and the matching `data-layout` CSS rules for `opening`, `statement`, `process`, and `split-proof` are classified as **renderer-owned legacy implementation evidence**.

They are not semantic authority and must not be copied into RDF, scene definitions, path metadata, or `SceneDocument`.

A later renderer implementation may retain visual ideas from these layouts as named renderer-local variants, but selection must become scene-structure-based rather than scene-id-based.

Until that migration is implemented, the existing mapping remains an explicit technical-debt boundary; this ADR does not remove or modify it.

## Testing obligations for implementation

The first implementation increment must add deterministic tests that cover at least:

1. repeated resolution from the same scene/environment/policy yields the same decision and diagnostic structure;
2. changing scene ids alone does not change the selected family/variant;
3. prose + media selects compatible side-by-side candidates in an appropriate wide environment and a stacked candidate in an appropriate narrow environment;
4. semantic `readingOrder` is unchanged by visual order;
5. intent/group evidence influences comparison/practice/formula candidates only when that evidence exists;
6. density changes can change candidate ranking without rewriting content;
7. unknown media geometry is handled deterministically and without network access;
8. stable tie-breaking is independent of candidate enumeration order;
9. no candidate may violate configured readability minima;
10. static/reduced-motion selection preserves complete content;
11. the historical scene-id mapping is not consulted by the generic resolver;
12. all diagnostic outcomes use stable codes.

DOM measurement and physical-frame tests belong to their later implementation increments.

## Compatibility

This decision changes no authored semantic content and requires no immediate code contract change.

Specifically, ADR-0012 does not modify:

- ontology vocabulary;
- SHACL;
- canonical TriG;
- `ResolvedLearningPath`;
- scene composition semantics;
- `SceneDocument 1.0`;
- `TeachingOfferingRuntimeDocument 1.0`;
- learner-state;
- navigation/LMS contracts.

The current `RevealRenderPlan 1.0` may later need an adapter-local additive or versioned extension to carry a layout decision or multiple physical frames. That decision is downstream of `SceneDocument` and must be handled in the relevant implementation issue with compatibility tests.

## Consequences

### Positive

- previously unseen valid scenes can be laid out from their structure rather than hard-coded ids;
- mobile/narrow rendering becomes a different realization of the same semantic scene rather than a duplicate authored content path;
- renderer adapters remain replaceable;
- layout choice is deterministic, offline, testable, and explainable;
- existing semantic and accessibility contracts remain authoritative;
- overflow recovery becomes policy-driven instead of accidental CSS behavior;
- visual families can evolve without ontology churn.

### Cost

- each renderer needs an explicit versioned layout policy rather than relying on ad-hoc CSS;
- accurate fit ultimately requires a second measured renderer pass;
- physical-frame splitting requires additional adapter-local identity and navigation rules;
- different renderers may initially duplicate some analysis logic until commonality is demonstrated.

That duplication is preferable to prematurely moving renderer policy upstream into the semantic model.

## Rejected alternatives

### Encode layout names in canonical RDF or scene definitions

Rejected because `two-column`, `media-right-60`, CSS classes, or Reveal layout names are renderer mechanics and violate ADR-0002/0003.

### Add a mandatory renderer-neutral `LayoutIntent` field to `SceneDocument 1.0`

Rejected for the first implementation because the existing generic semantics already provide sufficient evidence and no demonstrated cross-renderer need justifies a new shared contract. The question may be revisited only with implementation evidence.

### Let an LLM choose the best layout

Rejected because normal rendering must be deterministic, offline, reproducible, explainable, fast, and testable. An LLM would also risk inventing semantic interpretation not represented in the scene.

### Detect specific devices

Rejected because device names are unstable proxies for actual available space and interaction constraints. Layout depends on normalized presentation environment, not product identity.

### Solve overflow by shrinking until it fits

Rejected because it sacrifices readability/accessibility and makes output quality depend on accidental content density rather than explicit policy.

### Author separate mobile scenes

Rejected because duplicated authored content creates divergence and makes viewport a semantic-authoring concern. Mobile is a renderer realization of the same logical scene.

## Bounded follow-up increments

After this ADR is accepted, implementation should proceed in separate System issues in this order:

1. **Deterministic layout analysis and resolver contract** — implement a pure adapter-owned analyzer/resolver and policy versioning with stable diagnostics and tests; no DOM measurement and no CSS redesign.
2. **Reusable Reveal layout families and legacy-map migration** — move/define the initial reusable Reveal variants, connect them to the resolver, and remove scene-id-based `layoutByScene` selection while preserving useful historical visual behavior.
3. **Responsive environment realization** — implement normalized wide/compact/narrow handling and responsive variant realization with accessibility/regression tests.
4. **Measured overflow recovery and physical-frame splitting** — add bounded measurement feedback, deterministic fallback progression, and adapter-local multi-frame/page planning if still required by real course scenes.

A self-study renderer may later adopt its own policy using the same `SceneDocument` evidence. It is not required to share Reveal's families, variant names, breakpoints, or score weights.
