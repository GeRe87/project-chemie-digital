# Issue #292 — Talks platform integration handoff

## Role and boundary

Owner-requested architecture, semantic and frontend implementation on the Talks
branch, independent of both dispatcher lanes. Base:
`eecd210a2288385fe2ec77613084fc5a235e3dfd` (`origin/talks`). Feature branch:
`agent/292-talks-platform-integration`. Review targets **talks**, not main or
chemometrics. No state/lease, GitHub Actions, Pages/DNS, source lecture dataset,
other worktree, deployment, merge or release changes are part of this increment.

## Phase record

| Phase | Implemented result | Verification |
|---|---|---|
| A | Read repository rules, README, compiler/runtime/build and relevant ADRs; inspected ZIP docs and prototype; fetched exact Talks base; isolated worktree | Git base and branch recorded above; no edits in other worktrees |
| B | Canonical collection, scientific work, event, ordered author role, organization hierarchy, logo placeholder, exact path and title scene; additive vocabulary/SHACL | Focused semantic tests, full build SHACL gate, exact named-graph and immutable-source tests |
| C | Renderer-neutral title metadata projection/contract and reusable renderer; existing scene mount selects the layout; full static fallback | Core, Pitch and metadata tests; production-browser author/event/affiliation checks |
| D | Collection in the existing lazy world manifest and entry; exact path/graph bindings; no synthetic teaching offering | Exactly one talk, keyboard activation, return control, duplicate/wrong-graph rejection; second-talk compiler fixture |
| E | Existing background runtime extended for x tiling/height coverage, shared interpolation, absolute progress and reduced motion; profile-scoped choices | Eight production-browser combinations; idle and resize drift assertions; same-sized layers and inactive-theme loading checks |
| F | Existing static builder gains collection mode and scoped asset staging; build:talks outputs dist/talks | 251-file hash/transport/asset validation, successful SHACL; hosting instructions only |
| G | Regression tests, optional production-browser/WCAG script, reviewable issue and draft PR | Exact-head full-suite outcome belongs in the PR verification record, not a predicted status here |

## Semantic boundaries

Reused: schema.org Collection/hasPart, CreativeWork, Role/position/author,
Person/name/affiliation, Organization/parentOrganization, Event/recordedAt,
ImageObject/logo/contentUrl; SKOS prefLabel and DCT alternative; existing CD paths,
ordered steps, scenes/items, concepts/resources, selectors and authored evidence.

New: `cd:ScientificTalk`, `cd:presentationPath`, `cd:presentationTitleOf`.
Presentation collection, work, author-role, person, organization, event, logo and
title-scene SHACL shapes enforce required values, types/cardinalities, local logo
paths and unique positive author/logo positions. The existing SceneItem selector
union admits ScientificTalk additively. Compilation rejects ambiguous path graph
identity, duplicate paths/positions and cyclic affiliation hierarchies.

The authored title exists only in TriG. Manifest, canonical runtime and static HTML
are generated representations. Public export scopes the semantic snapshot and
asset tree to avoid unrelated internal presentation metadata. The requested
restricted project name is absent from the presentation transport and visible
content; established internal resources are not renamed or removed.

## Changed/new files and purposes

- `ontology/dataset/talks.trig`: collection and initial scientific content, path and scene.
- `ontology/dataset/talks-vocabulary.trig`: minimal scientific-work boundary.
- `ontology/dataset/talks-shapes.trig`: presentation SHACL constraints.
- `ontology/dataset/shapes.trig`: one additive SceneItem selector alternative.
- `scripts/presentation_metadata.py`: canonical work-to-title projection and static alternative.
- `scripts/presentation_collection.py`: exact collection/path compilation and scoped snapshot.
- `scripts/generate_canonical_runtime.py`: optional title metadata and static rendering.
- `apps/pitch/scripts/generate-course-runtime.py`: reuse manifest/lazy/static generation for collections.
- `packages/core/src/presentation-metadata.ts`: versioned renderer-neutral title contract/validation.
- `packages/core/src/presentation-collection.ts`: versioned collection contract and exact binding resolution.
- `packages/core/src/scene-document.ts`: additive optional title metadata.
- `packages/core/src/canonical-runtime.ts`: additive collection contract validation.
- `packages/renderer-reveal/src/scientific-title.ts`: escaped reusable title layout, ordered authors, affiliations and local logos/placeholders.
- `packages/renderer-reveal/src/background/background-pack.ts`: horizontal repeat and height sizing.
- `packages/renderer-reveal/src/background/background-runtime.ts`: horizontal transform/measurement and redundant-pack guard.
- `apps/pitch/src/preview.ts`: title layout through the existing semantic scene mount.
- `apps/pitch/src/main.ts`: collection-aware existing bootstrap, lazy selection, theme and world shell.
- `apps/pitch/src/presentation-main.ts`: configurable profile, return label and horizontal absolute progress.
- `apps/pitch/src/presentation-profile.ts`: Talks deck profile and paired laboratory pack; course choices remain unchanged.
- `apps/pitch/src/presentation-background.css`: shared horizontal layer geometry.
- `apps/pitch/src/scientific-title.css`: reusable responsive title/author/logo layout.
- `apps/pitch/src/talks-world.ts`: metadata-derived collection cards using the shared binding contract.
- `apps/pitch/src/talks-world.css`: responsive collection styling using existing world design tokens.
- `apps/pitch/public/talks-assets/{back,middle,front}_layer_{dark,light}.webp`: six original assets, unchanged bytes; 1,273,502 bytes total; all 2048×682; alpha retained on middle/front.
- `apps/pitch/vite.config.ts`: optional bounded public directory for the shared static builder.
- `scripts/build_static_course.py`: collection selection and temporary bounded public staging.
- `scripts/static_course_artifact.py`: validate collection transport, lazy output and selected assets without changing course behavior.
- `scripts/validate_presentation_transport.mts`: reuse core contracts for public presentation transport verification.
- `package.json`: independently callable generate/dev/build/check commands; dependencies and lockfile unchanged.
- `tests/test_presentation_collection.py`: nine semantic/projection/staging regression tests.
- `packages/core/test/presentation-metadata.test.ts`: core collection/title contract tests.
- `apps/pitch/test/talks-world.test.ts`: collection, layout, scene mount and profile tests.
- `scripts/smoke_talks.mjs`: optional real-static-output Playwright test, optional axe WCAG checks.
- `docs/adr/0020-scientific-presentation-collections.md`: architectural decision and boundary.
- `docs/talks-deployment.md`: authoring, build, dependencies and exact remaining Cloudflare owner steps.
- `README.md`: entry points and documentation links.
- This handoff: implementation and review record.

The tracked Pitch HTML shell is restored to the base after generator verification;
generated Talks output is in dist/talks, not committed as new authored HTML.

## Executed verification

Host: Node.js 25.6.1, npm 11.9.0, Python 3.14.3; pinned production semantic
dependencies verified by the builder. These are observed local versions, distinct
from the documented supported Cloudflare environment.

| Command/check | Observed outcome |
|---|---|
| `npm ci --ignore-scripts` | Exit 0; locked dependencies installed in isolated worktree |
| `python -m unittest discover -s tests -p test_presentation_collection.py -v` | Exit 0; 9 tests |
| `python -m unittest discover -s tests -p test_static_course_build.py -v` | Exit 0; 15 tests |
| `node --experimental-strip-types --test apps/pitch/test/talks-world.test.ts apps/pitch/test/presentation-profile.test.ts packages/core/test/presentation-metadata.test.ts` | Exit 0; 22 tests |
| `npm run test:core` | Exit 0; 128 existing tests at that stage; three added contract tests also executed in the focused command above |
| `npm run test:renderer-reveal` | Exit 0; 122 tests |
| `npm run test:pitch` | Exit 0; 238 tests |
| `npm run build:talks` | Exit 0; SHACL Conforms True and 251-file verified production artifact |
| `npm run check:talks-build` | Exit 0; exact artifact inventory, lazy transport and asset checks |
| Production browser command below | Exit 0; eight combinations, static fallback, no console errors or missing assets, WCAG tags checked |
| ZIP byte comparison and WebP header inspection | Exit 0; six unchanged assets, dimensions and alpha as specified above |
| `git diff --check` | Exit 0 |
| `npm audit --json` | Exit 1; existing advisories listed below; no unreviewed dependency updates |

The successful build's dataset fingerprint is
`sha256:8d39f697524beaaf0a88ad449eccbb16ec556471d70b2b637b259b023ece73a4`.
It runs `python scripts/validate_semantics.py` as a mandatory subprocess. An earlier
attempt failed missing authored-resource evidence; that was fixed before the
successful build. Two full-suite runs started during editing were explicitly
cancelled as superseded; they are **not** passing-test evidence. Before opening the
PR, run `npm test` once on the frozen implementation head and record its exact
exit code/head and final counts in the PR body/comment.

Production smoke command (external tools intentionally not production dependencies):

```text
python -m http.server 4186 --bind 127.0.0.1 --directory dist/talks
node scripts/smoke_talks.mjs http://127.0.0.1:4186 <temporary-tools>/node_modules/playwright/index.mjs <Edge-executable> <screenshots-directory> <temporary-tools>/node_modules/axe-core/axe.min.js
```

Playwright 1.58.2 and axe-core 4.11.1 were installed outside the repository. Actual
production output, not Vite dev, was checked at 1440×900 and 390×844 in both themes
with reduced motion on/off. Tests cover focus/Enter, Arrow keys on the single-scene
deck, return navigation, theme shortcuts, background off/on, supported choices,
resize/idle drift, body overflow, same-sized compositing, lazy theme assets and
no-JavaScript fallback. Automated WCAG 2/2.1 A/AA rules reported no violations in
these tested states. Screenshots in the approved temporary Talks production
screenshots folder were inspected for desktop/mobile and both themes. This is not
a screen-reader audit or a multi-slide scientific-content acceptance claim.

## Risks, deferred work and owner actions

- Only the title scene is authored. All eight scientific chapters remain deferred.
- Approved institutional/project logo assets, event date/location and additional
  authors may be added through canonical RDF; none was invented.
- Cloudflare account configuration, Git integration, DNS and actual deployment
  remain owner actions. No hosting or existing Chemometrics setting was changed.
- Existing npm audit findings: KaTeX low; Vite, nanoid and source-map-js high in
  the dependency tree. Lockfile updates/security review are a separate task.
- Vite warns about the inherited presentation chunk exceeding 500 kB. The world
  still loads presentation code lazily; broader bundle splitting is deferred.
- Browser checks used Chromium-based Edge, not Safari/Firefox or assistive hardware.
- The usual external exact-head validator status and human review are still
  required. Do not merge this PR automatically.

## Recommended action

Review the minimal ontology boundary, public-export scope, shared renderer changes
and exact-head test evidence; then let the owner integrate into **talks** and
configure Cloudflare Pages separately. Neither dispatcher lane is transitioned.
