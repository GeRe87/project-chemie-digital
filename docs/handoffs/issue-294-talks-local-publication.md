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

- [x] Focused Talks checks passed locally in about 27 seconds, including real
  production transport policy, exact serialized RDF graphs and missing-definition
  counterexamples, local-check failure behavior and publication safety tests.
- [ ] Complete final exact-head `npm test`: required, not yet claimed green.
- [ ] Complete canonical SHACL: running separately, not yet claimed green.
- [ ] Final production build and artifact verification.
- [ ] Production-browser and accessibility acceptance in both themes/viewports.
- [x] Documentation updated.

## Boundary and decisions

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

## Recommended manager action

Review the isolated increment and final local evidence. Keep PR #295 draft and
do not publish or configure Cloudflare while any release gate is failing or
missing. Request a fresh independent exact-head review before integration.
