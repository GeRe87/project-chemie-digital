# Environmental Health 2026: coordinator QA

Status: review candidate under local validation, 10 November 2026. This is not a
recording, conference submission, deployment or independent exact-head acceptance.

## Scope and provenance

- Repository: GeRe87/project-chemie-digital, isolated clone eh26-20261110.
- Base talks: 167abac849bce9263aa946c85c1a93923428ac42. A fresh remote read still
  returned that SHA during review.
- Feature branch: codex/talks-environmental-health-20261110.
- Authored source: ontology/dataset/talks-environmental-health-2026.trig.
- New path: https://w3id.org/project-chemie-digital/resource/path-talk-environmental-health-2026.
- Twelve new scenes, independent of the original 29-scene GERSTEL path.
- Implementation proposals were generated locally through OpenCode with explicit
  openai/gpt-6.1-sol and the existing OpenAI connection. The prior Free-provider
  request failed with 429 before producing an implementation. Successful SOL
  requests followed. No global provider, credential or security settings changed.
- Workers returned source text without tool access; the coordinator reviewed and
  applied bounded proposals. Logs and before/after artifacts are retained in the
  clone's ignored .local/eh26 directory.

The source brief was the owner's pasted Environmental Health Conference 2026
assignment. The storyboard records source files and reveal cues per scene.
Dates, conference identity, qPeaks description and current engine-development
status are owner-supplied facts, not independently established deployment claims.

## Scientific review

- The existing local SBR observations and recipe are reused. The means remain
  15.687291305338027 and 13.649277025894788 micrograms per milligram, with three
  normalized analytical replicates in each group and local 15-standard fits.
- Visible whisker descriptions distinguish descriptive standard error from total
  analytical uncertainty or confidence intervals. No significance, removal
  efficiency, health-effect or treatment-effect conclusion is inferred.
- The chromatogram is explicitly synthetic. It is neither a measured sample nor
  an actual qPeaks output; a fitted component is not proof of chemical identity.
- The apparatus depicts the supplied Twister-based configuration. Polymer-related
  mass is distinguished from particle count, shape and size. Method background:
  [author-written TED-GC-MS account](https://www.chromatographyonline.com/view/microplastic-mass-content-by-thermal-extraction-desorption-gas-chromatography-mass-spectrometry).
  Its described implementation is not evidence that every sorbent configuration
  is identical to the speaker's.
- The calibration uses the same 44 observations. Three manually selected windows
  contain standards 1..15, 2..16 and 3..17. Balanced demonstration order is not
  acquisition chronology. Neither optimal window size nor validated drift
  correction is claimed; blanks and independent QC remain necessary.
- FAIR spans data, processing decisions, identity, parameters, calibration,
  versions and provenance. RDF syntax alone is not complete FAIR compliance.
  Background: [original FAIR principles](https://pmc.ncbi.nlm.nih.gov/articles/PMC4792175/).
- The selected SHACL example actually rejects PeakVector to IntegerValue and
  accepts corrected PeakVector input. This establishes the selected structural
  constraint, not successful execution or scientific correctness. Background:
  [W3C SHACL recommendation](https://www.w3.org/TR/shacl/).
- Event integration is visibly In development. Existing engine/pipeline status
  is attributed to the speaker; the presentation does not demonstrate a deployed
  autonomous laboratory. Internal canonical source IRIs remain provenance, while
  visible slide text and narration exclude the internal product brand.

## Technical evidence

| Check | Observed result |
|---|---|
| New focused test module | Seven tests passed after semantic composition repair |
| Existing Talks checks | Passed; checks-v4/checks.json, five Python steps and one TypeScript step |
| Original scene document | Strict before/after equality, all 29 scenes preserved |
| Talks generation | npm run generate:talks exited 0 |
| Browser navigation | Two talks, 41 scenes, all advertised reveal stages, no page errors or missing assets |
| Recording browser | Installed Edge 157.0.4341.42: all twelve new scenes/stages passed, all twelve final frames visually inspected; four original chart scenes additionally inspected |
| Built recording copy | Edge: 41 scenes across both talks, all stages, zero reported errors; all twelve new final frames visually inspected and included in the storyboard |
| Normal-motion manual control | Seven staged new scenes entered at stage 1, stayed there without input, advanced to 2 and returned to 1 |
| Static reading alternative | Twelve new articles; full processing chain, provenance descriptions, three FIFO memberships and failed/corrected SHACL text present |
| Complete npm test | Initial run: 623 Python tests, one provenance failure, exit 1 after 2498.039 s; no complete green final-head npm test is claimed |
| Provenance correction | Only twelve supportsResource links added in the new source graph; original failing test and all seven new tests passed afterwards |
| Remaining npm phases | All ten later phases executed explicitly in original order and exited 0, including renderer, runtime, Pitch and self-study checks |
| Static build and artifact verification | Both commands exited 0; complete canonical SHACL conforms; 271 files verified |
| Required external status | Not obtained; agent-validator/project-chemie-digital remains an acceptance requirement |

The legacy tests previously selected collection position zero or passed the whole
collection into a one-document static renderer. They now select the exact original
path and explicitly project that document. Scientific assertions and negative
branding checks remain. The actual collection generator already renders every
document separately and required no change. An intermediate encoding mistake in
test-patch materialization was corrected using the unchanged Git originals and
explicit UTF-8; the successful checks use the corrected files.

The full local suite began while final CSS-only visual corrections were still
under review. It is diagnostic worktree evidence, not a clean, independent
exact-head validator receipt. No release acceptance is inferred from it.

That run exposed the new briefing Source's missing explicit reverse support
links. The correction adds exactly twelve source-to-Interpretation links in the
new graph/sources/eh26, with zero removed quads and unchanged scientific content.
The existing global provenance assertion was retained and passes after repair.
Raw logs: full-npm-test.log, source-support-retest.log,
new-tests-provenance.log and remaining-checks.json. The failed full run remains
preserved; targeted retests and the later phase checks do not turn its exit code
into a successful final-head npm test. Independent final-head validation remains
pending before acceptance.

A fresh Windows checkout of the first review commit exposed a second issue:
automatic Git line-ending conversion changed physical newlines inside multiline
Turtle narration literals. The new TriG now escapes literal line breaks on a
single physical line. All 1,127 quads are exactly equal before and after this
lexical repair, including under simulated CRLF conversion; seven focused tests
pass again. No Git settings, shared attributes or assertions were changed.
The assembled dataset fingerprint still matches the built artifact exactly.
The first failed checkout preflight remains in the isolated verification log.

The built artifact has dataset fingerprint
sha256:822f589e8da557f754083d757dfcb7fa441c165d85ffe3595c69c0082a61dd09.
Its validated-build.json SHA256 is
8d564fc04f8ab509773c8ea5f7bc657ad7d214b13e3f904025ee7c5ca2a6feeb.
The recording copy is served locally from dist/talks on loopback port 5197,
separately from the development preview. This build is not a publication.
The final browser receipt is browser-production/report.json. The storyboard's
twelve unchanged PNG frames come from that built-copy pass; their hashes and
artifact binding are retained in storyboard-preview-manifest-production.json.

## Visual review and necessary corrections

The actual Reveal runtime was inspected at 1440 x 810, light appearance,
background=none, reduced motion. Initial navigation used Chromium 1208. Final
recording-browser review used the installed Edge 157.0.4341.42 with a separate,
temporary browser context. Twelve initial and final screenshots are retained for
each complete new-talk pass; screenshots were visually reviewed, rather than
accepting viewport-overflow checks alone. Evidence includes browser-v5/report.json,
browser-edge/report.json, browser-edge-legacy/report.json and
navigation-static-report.json under .local/eh26.

Initial chart-plus-prose composition pushed scientific caveats out of the finite
slide canvas. New chart scenes use the existing semantic KeyPointRole footer
composition. The cover uses a short heading and retains its full scientific title
and author/event credits as visible text. No narration, measurements or caveats
were removed to make the slides fit.

Two generic rules in apps/pitch/src/visual-stage-primitives.css are the only shared
product change: bounded dot/regression captions receive additional separation from
axis labels, and bounded SVGs use a separate painting layer to avoid stale label
painting under Reveal scaling. The latter was diagnosed by comparing the single,
correct DOM text elements with duplicated/clipped painted labels. Both changes
exclude scroll mode and use composition selectors rather than subject/scene IDs.
No shared JavaScript renderer or original GERSTEL semantic resource was changed.
The caption rule was narrowed before finalization so line and timeline charts
retain their original spacing. The two affected new line-chart scenes were
rechecked and visually inspected after that narrowing. Final product/test input
hashes are retained in review-candidate-sha256-final.json; the earlier snapshot
is preserved separately.

Edge's final frames show the chart units, ticks, captions and scientific footers
without the earlier clipping/duplicate-label defect. Old Chromium 1208 still
showed intermittent stale painting in some automated captures. Use the tested
Edge configuration for the recording rehearsal; this is a documented browser
limitation, not a claim that every Chromium build is fixed. Original temperature,
schedule, running-calibration and sample-comparison scenes were also navigated
and visually inspected in Edge after the shared CSS correction.

The full pipeline and its provenance reprise are readable but intentionally dense.
The synthetic marker plots, calibration membership strip, replicate scatter and
failed/corrected interface states carry the explanation. Scientific limitations
remain visible. The local browser checks are not a low-resolution video playback,
screen-reader audit or guarantee across every browser/viewport.

The bottom slide footer contains essential text and must not be covered by
subtitles. The runbook proposes a separate lower capture band. An actual Persian
subtitle sample and final video frame have not yet been inspected. A browser
static/print-text check is not certification of a separately paginated PDF.

## Recording and acceptance still owned by the speaker

- V1 contains 1,477 whitespace-counted words. Twelve scene budgets total 870
  seconds, including intended pauses/reveals, with a hard 900-second limit.
- No stopwatch rehearsal or voice recording has occurred. The timing table is
  not measured audio alignment, SRT timing or an actual 14:30 video.
- The speaker must rehearse the real reveal sequence, record their own English
  voice, inspect the entire resulting video and confirm subtitle placement.
- No conference codec/upload specifications were supplied. Capture dimensions
  in the runbook are proposals, not verified organizer requirements.
- ANOVA and FCI briefings have since arrived. Confirmed delivery order is the
  Microplastics video on 15 November, FCI on 16 November and ANOVA on 17 November.
  Their separate briefing reviews are not part of this presentation's evidence.
- No merge, release, Pages write, deployment, hosting/security change or organizer
  submission is part of this result.
