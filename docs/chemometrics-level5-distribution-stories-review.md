# Level 5: chemistry stories before distribution formulas

Local review, 2026-11-01. No commit, push, publication or deployment.

## Increment

Six formula-free scenes are inserted into the main lecture, now 70 scenes:

| Positions | Block | Story |
| --- | --- | --- |
| 17-18 | Normal | One homogeneous nitrate sample, five UV/Vis readings; a future reading can differ |
| 29 | Lognormal | Relative concentration changes from dilution histories, illustrated by half/unchanged/double |
| 46 | Chi-square | Repeating a five-reading precision study changes the variance estimate |
| 49 | Student-t | Reporting a mean from five nitrate readings when population SD is unknown |
| 55 | F | Two methods have different observed nitrate sample SDs; a population difference is not established |

The existing Binomial and Poisson stories remain unchanged. Every original scene,
formula, symbol legend, worked calculation and comparison advance is retained.
The separate six-scene optional reserve is unchanged. The known-SD case is still
present before Student-t as an explicit contrast within the same reporting story.

New stories reuse the existing nitrate readings/mean, the first five normal
simulation variances and the two method SDs. Factor bars are deterministic
illustrations, not field observations or a distribution fit. The specified normal
population SD is not estimated from five constructed readings. No sample sizes,
raw method readings or formal F-test decisions are invented.

All text and narration are English. The existing authored topic footer remains
visible. New scenes use existing dot plots, complete bar charts and cards; chart
stories include a short visible chemical context sentence through the existing
chart-plus-explanation layout. One generic CSS rule reserves bottom space for
topic-bearing visual stages with footer text, preventing phone navigation controls
from covering that text. Accepted paths without topic metadata are not selected.
No Core/compiler/component changes are needed. No interaction, learner-data
collection or new runtime network service is introduced.

Authoring guidance: [Story-first distribution authoring](chemometrics-level5-story-first-authoring.md).
Semantic source: `ontology/dataset/chemometrics-level5-distribution-stories.trig`.
Regression tests select original scenes by identity rather than shifted positions.

## Review and evidence

- Main generation succeeds with 70 scenes; topic coverage is 70 main plus six reserve.
- All 136 targeted Level-5 tests pass, including six new story-specific tests.
  Log: `C:\Users\PCUser\AppData\Local\Temp\opencode\level5-stories-targeted-final.log`.
  This run precedes the final shortening of three chart captions; the authoritative
  suite below covers the final text. Story tests verify exact insertion order,
  formula-free initial disclosure, data/summary reuse and retained original scenes.
- Both Edge and Firefox pass all six final story scenes at 1731 x 1006 light,
  1280 x 720 dark and 390 x 844 light, including topic/control separation,
  story-text/control separation, unclipped captions and absence of formulas and
  fragments. Desktop and phone screenshots were inspected. This exposed and fixed
  two real issues: footer/control overlap and an overlong phone caption.
- Both engines pass native traversal of all 70 slides, retaining exactly six
  comparison advances. Both also pass the six-scene reserve matrix and native
  forward/reverse reserve traversal in all three configurations.
- Full main browser regression remains active. The initial Edge run timed out on
  scene activation after P07d; its retry has a longer wait and reports expected and
  actual scene identities on failure. Logs: `level5-stories-edge-final.log` and
  `level5-stories-firefox.log`. Final caption changes were checked separately above.
- Semantic validation conformed on an earlier story draft, not the final text.
  Fresh semantic/full-regression evidence is pending in the restarted authoritative
  `npm test`, which includes semantic validation. An earlier full run was explicitly
  stopped before the caption corrections and is not acceptance evidence.
  Active log: `C:\Users\PCUser\AppData\Local\Temp\opencode\level5-stories-final-npm-test.log`.
  Semantic/feature sources must remain unchanged during this run.
- `git diff --check` passes with line-ending warnings only.

The full-suite evidence in the topic-orientation review predates this increment and
must not be presented as validation of the new stories. Total lecture timing needs
a later review because six slides have been added. The blueprint's supplementary
`Eingefügtes Markdown.md` is still unavailable and has not been read.

## Local preview

Start the Normal story:
<http://127.0.0.1:5173/authoring.html?preview=authoring-level5-block1#/ex:l5-n09-story1-scene--scene>
