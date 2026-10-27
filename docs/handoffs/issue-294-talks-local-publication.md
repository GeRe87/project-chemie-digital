# Talks local-check and publication preparation handoff

## Role and issue

Owner-directed build/validation follow-up to #294 and draft PR #295, targeting
`talks`. Work is isolated from every Chemometrics publication and dispatcher lane.

## Completed

- Added timed local Talks feedback and full-release commands. Existing `npm test`
  and every Chemometrics command remain unchanged. Fast tests are not acceptance.
- Corrected Talks descriptor/shape graph separation, two missing source-support
  links, SceneItem-only language metadata on FAIR cards and EIC annotation ownership.
- Added optional exact data-graph serialization to the port-contract branch of
  the compiler. Existing one-graph contracts remain supported. No general SHACL
  constraint, course resource, renderer geometry or course build path is changed.
- Fixed the Talks public-asset selection fixture to create its selected logos.
- Added fail-closed local publication staging for `gh-pages-talks`, with exact
  source/receipt/build-manifest checks and revalidation. Dry-run is the default;
  neither mode changes any Git branch, remote, Pages project, DNS or credential.
- Documented Cloudflare Git integration with an already-built static branch,
  no hosted rebuild and no changes to GitHub Pages settings.

## Verification

- [x] Focused Talks checks passed locally: 52 checks in about 31 seconds, including real
  production transport policy, exact serialized RDF graphs and missing-definition
  counterexamples, local-check failure behavior and publication safety tests.
- [ ] Complete final exact-head `npm test`: required, not yet claimed green.
  The diagnostic run on `257e0f9f` completed in 2568.602 seconds. All 600 Python
  tests passed; the renderer selection passed 96/98. One failure was the known
  Hilbert-width guard. The other was a stale source assertion expecting radius 7
  for all line traces despite Talks commit `79b61a45e` introducing radius 2.5 for
  dense chromatograms. The assertion now requires both dense/sparse branches
  and the explicit focused-series/context visibility branches. A fresh full
  renderer selection passes 97/98, leaving only the unchanged Hilbert guard;
  no runtime chart behavior or course geometry is changed. Later npm-test phases
  were not reached by that run, and it is not current-head acceptance evidence.
- [x] Complete canonical SHACL passed on source `257e0f9f`; dataset fingerprint
  `sha256:18d04ce662ec82ff8fbfd9b1bcfd1d9bb46d3ae8323fdf17a0bfc0a969d2e8dc`.
- [x] Production build and artifact verification passed on `257e0f9f`: 265 files,
  `validated-build.json` SHA-256
  `98d19e6eb039beebde6062bf4b31687577a15ff74219951901748a37673237b6`.
- [x] Talks world/title browser acceptance passed all eight desktop/mobile,
  light/dark and normal/reduced-motion combinations, including axe WCAG checks,
  keyboard theme/background controls and script-disabled static fallback.
- [x] Production-browser and automated accessibility acceptance on application
  source `fa618d3e`: all 200 scene/configuration cases (25 scenes, desktop/mobile,
  light/dark, normal/reduced motion) and all eight world/title cases pass with
  axe WCAG checks. Stage navigation, graph-dialog keyboard entry/close/focus,
  media, clipping, return controls, missing assets and static fallback are checked.
  The rebuilt 265-file artifact also passes `check:talks-build`; manifest SHA-256
  `b4d04ac2623a9af604666183662d4599d91b1fbc432167d82d809b825f6edc2b`.
  Subsequent source edits in this increment are test/runner/handoff-only, not
  application code or authored RDF. Independent review remains outstanding.
- [x] Documentation updated.

## Boundary and decisions

### Explicit follow-up approval: repeated-label geometry

After the earlier blocked handoff, the owner explicitly approved the shared
renderer correction, including a possible change to the Chemometrics roadmap
on a future rebuild. The currently published course, its RDF/build commands,
`gh-pages` and hosting remain out of scope and untouched.

The width guard failed because a Talks-introduced gutter calculation reserved
space for repeated labels which the existing renderer policy hides. The fix
uses that same suppression policy during measurement, rather than changing the
minimum-width assertion. A new regression compares short/long normalized repeated
labels and requires identical node geometry, while non-repeated visible labels
must still retain measured gutters. No resource/scene identities select layout.

A read-only comparison of all five compiled Chemometrics documents (167 scenes,
eight diagrams, eight widths, 64 comparisons) identified only the introduction
roadmap at widths 960, 1180, 1440 and 1920 as changed by this correction. That
specific future-rebuild effect was disclosed before the owner approved it.
This approval does not constitute release acceptance or permission to deploy
or otherwise modify the Chemometrics course.
The corrected shared renderer passes all 99 D3 tests, including the unchanged
minimum-width guard and the new hidden/visible-label gutter regression. Final
exact-head full-suite, production-build and browser evidence must be refreshed
after this runtime change; earlier results above are historical evidence only.
The previously unreached Pitch phase exposed one more stale Talks test: SVGs
with inspectable port controls use a group role even without node-keyboard
navigation. Its assertion now requires that existing compound accessibility
condition, without changing renderer behavior. Those four Talks layout tests
are included in the fast lane. The isolated self-study renderer (24 tests) and
self-study app/static generator (29 tests) pass. These focused diagnostics do
not substitute for the final complete release command.

`gh-pages` was observed at `d1edb925904b019d662f155976b454dd4eb3f7ca` before any
publication work. It must remain untouched. `talks` was at `026b489a`;
`gh-pages-talks` did not exist. Source integration, publication and Cloudflare
configuration are not implied by local staging. No GitHub Actions workflow is
added, invoked or accepted as validation evidence.

The original GitHub log reports 590 Python tests in 3069.972 seconds and 20
failures plus one error, rather than a timeout. Most failures report the same
invalid dataset. Fixes belong in Talks source, not weaker global assertions.
The pre-existing Hilbert-width renderer failure remains out of this Talks-only
increment. The locked dependency installation also reports npm advisories;
no dependency upgrade or automatic audit fix is included.
An explicit comparison against `7cefac37` confirms no changed Chemometrics RDF
files and unchanged `npm test`, `build:chemometrics` and
`check:chemometrics-build` commands. No publication branch or hosting setting
was touched. Release staging must remain blocked by the failing full-suite gate.

The production build was performed in a separate isolated checkout while the
complete suite ran, so family generators could not overwrite each other's
runtime files. Browser checks exposed stale Talks smoke assumptions: layer
geometry must compare pre-transform dimensions while separately ensuring viewport
coverage (the foreground intentionally scales); background controls use Alt+B;
SVG illustrations are enhanced inline; and a semantic graph can be opened in
a dialog beside a code representation. The smoke scripts now exercise those
supported interfaces instead of failing on obsolete selectors. The talk smoke
uses the real production branding policy and checks lazy/full transport equality,
not a blanket regular expression over machine-readable provenance.
The full slide audit then found a real `aria-prohibited-attr` violation on the
new part-reference arrow. Its authored accessible label now has an explicit
image role. Thirteen focused diagram/state regression checks pass after that
single-attribute correction; a rebuilt artifact must be audited again.
The next mobile audit found an unfocusable scrollable static TriG code block.
Non-executable code fallbacks now receive `tabindex=0`. A dedicated regression
also verifies that executable-code fallback focus remains unchanged. Existing
Chemometrics resources contain no `cd:executable false` code examples; no course
content or layout is changed by this static-code accessibility correction.

## Recommended manager action

Review the isolated increment and final local evidence. Keep PR #295 draft and
do not publish or configure Cloudflare while any release gate is failing or
missing. Request a fresh independent exact-head review before integration.
