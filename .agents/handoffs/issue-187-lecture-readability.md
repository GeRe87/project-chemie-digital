# Issue #187 handoff — lecture readability mode and content budgets

## Role

`Frontend and Reveal Renderer Engineer`

## Motivation

Browser review against established Chemometrics lecture slides showed that fit/overflow handling alone was insufficient. The core problem was projection readability: the Reveal app imports core Reveal CSS but no theme-level presentation font scale, so many relative sizes were effectively based on normal browser typography.

For university teaching, typography must win over density.

## Principle

**Do not shrink content until it fits. Split or simplify the slide.**

Lecture mode therefore establishes readable floors and treats content density as an authoring diagnostic rather than a reason to keep reducing font size.

## Profile-driven readability

`PresentationProfile` now has:

- `defaultReadability: "lecture" | "standard"`

Defaults:

- Chemometrics: `lecture`
- CogniFlow: `standard`

An explicit URL override is supported:

- `?readability=lecture`
- `?readability=standard`

The resolved mode is exposed on:

`body[data-presentation-readability]`

## Lecture typography

New stylesheet:

`apps/pitch/src/lecture-readability.css`

At the 1440×900 fixed lecture canvas:

- Reveal base font: **30 px**
- secondary/table floor: **24 px**
- captions/supporting text: **22 px**
- chart ticks/categories: **22 px**
- chart axes/value labels: **26 px**
- normal slide headings: approximately **54–66 px** via clamp
- code-output floor: 24 px

Existing hero/closing scenes retain their larger dedicated typography.

The mode is profile-scoped, so non-lecture presentation profiles are not globally enlarged.

## Dense/compact semantics

In lecture mode, `dense` / `compact` remain layout-geometry signals only.

They may:
- reduce gaps;
- reduce margins;
- choose a stacked variant;
- resize chart chrome.

They may **not** reduce the key lecture text below the readability floor.

## Generic content budget

New pure policy:

`packages/renderer-reveal/src/lecture-readability.ts`

It evaluates every SceneDocument from structure/footprint only.

Current initial limits:

- maximum footprint score: 40
- maximum primary regions: 4

Output:

- `within-budget`
- `over-budget`

The renderer emits for every slide:

- `data-lecture-budget`
- `data-lecture-budget-score`
- `data-lecture-primary-regions`

When the active presentation profile is `lecture`, over-budget slides emit a developer console warning telling the author to split/simplify rather than shrink typography.

No visible warning is added to the projected slide.

## Nitrate case-study follow-up

The worked example was simplified to match lecture-scale information density.

Previous visible structure:

- problem/image
- table
- chart
- 3 discussion micro-cards
- takeaway footer

New visible structure:

- heading
- problem + illustration
- raw-data table
- analysis chart
- **2** concise discussion points

The separate footer/takeaway micro-region was removed.

Lecture case-study presentation uses two major columns:

- left: analytical question + illustration + compact raw-data table
- right: large chart
- bottom: two readable interpretation blocks

This retains **problem + data + analysis + discussion on one slide** while reducing the number of visual regions.

## Generic case-study contract

`case-study` now accepts either:

- five blocks: heading/problem/data/analysis/discussion
- six blocks: same + optional takeaway

Discussion lists may contain 2–3 items.

No semantic identity is inspected.

## Tests

Added/updated coverage for:

- Chemometrics resolves to lecture mode;
- CogniFlow stays standard;
- readability URL override and invalid fallback;
- lecture typography CSS token contract;
- budget within/over classification;
- max-score and max-region behavior;
- identity-independent budget classification;
- lecture-scale five-block case-study inference;
- DOM budget markers;
- simplified two-point nitrate discussion;
- full SHACL remains in the Introduction suite.

## Identity boundary

Static review confirms no occurrence of Chemometrics/Nitrate/scene/resource identity in:

- layout-fit policy;
- lecture budget policy;
- case-study layout inference;
- lecture readability CSS;
- chart-density behavior.

## Local verification required

Focused:

```powershell
npm run test:renderer-reveal
npm run test:renderer-d3
npm run test:pitch
python -m unittest tests.test_chemometrics_introduction -v
```

Then:

```powershell
npm run pitch:intro
```

At normal lecture view verify:

- normal body text is room-readable;
- raw table values are clearly readable;
- chart ticks/axis labels are visibly larger;
- only two major columns are perceived;
- no micro-card footer;
- the two discussion points are readable without leaning toward the screen;
- no overflow.

Finally run full `npm test`.
