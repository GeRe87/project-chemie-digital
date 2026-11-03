# B06: ten samples are not ten repeats

Local, uncommitted, unpushed and unpublished. Instructor-approved replacement of
the abstract “The sampling design limits our conclusion” case table with a picture
comparison. No deployment, new interaction, renderer or CSS change.

## Change

- Existing B06 identity and path position remain. The scene now selects an authored
  MediaAsset, using the existing media renderer and accessible alternative text.
- Left panel: ten numbered water sampling positions in a schematic water body.
  Right panel: one water sample supplies ten laboratory measurements.
- Visible text names water-body findings, conditional on a justified selection
  design, versus analytical repeatability. The illustration does not claim that
  spatially distributed dots prove representativeness or independence.
- Narration retains fixed trial count, binary outcomes, common probability and
  independence. It explains conditional binomial technical decisions, unequal
  probabilities/Poisson-binomial counts, and the limits of increasing sample size.
- Repeats neither supply environmental coverage nor establish accuracy or lack of
  bias. The comparison stays within positive-finding frequency, not concentration
  estimation, and leads into particle counts per water volume.
- The former diagram/model resources are no longer selected by the scene. They
  are retained, not deleted as an unrelated cleanup. Their standalone compiler
  validation remains covered by the out-of-range-case regression test.

Sources: `ontology/dataset/chemometrics-level5-binomial-workshop.trig` and
`apps/pitch/public/chemometrics/level5-samples-vs-repeats.svg`.

## Verification

- Seven workshop tests pass, including SVG/XML, ten distinct environmental marks,
  ten laboratory result icons plus their single parent sample, authored provenance,
  accessible alternative text and static fallback.
- Five lecture-stage tests and seven Poisson tests pass. The latter's stale stage
  assertion was updated after the first broader run exposed it.
- Edge and Firefox pass B06 layout checks at 1731 x 1006 light, 1280 x 720 dark and
  390 x 844 light. Desktop and phone screenshots were inspected. The illustration
  scales down on phone; the full alternative text remains available.
- Both engines pass native traversal of all 70 main scenes and reverse traversal
  through C14. Only four comparison advances now remain, rather than six: B06's
  two former case advances are intentionally removed by the static comparison.
- No additional scene or mandatory interaction is introduced. All 70 main and six
  reserve identities remain; this change introduces no formulas or personal data.
- The first broader run (`level5-b06-targeted.log`) found a stale Poisson test
  expecting B06's removed binary model. That assertion is corrected, not a pass.
- Fresh broader regression passes all 151 Level-5 tests:
  `level5-b06-targeted-final.log`. The unittest summary is `OK`; the redirected
  PowerShell invocation nevertheless reports exit code 1, as in earlier runs.
- Fresh authoritative `npm test` is running on unchanged final semantic/feature
  sources: `level5-b06-final-npm-test.log`. The earlier binomial-detail run and
  initial B06 full run were stopped before later edits; neither is acceptance
  evidence. Logs and browser scripts are in the approved local temporary directory.

## Preview

<http://127.0.0.1:5173/authoring.html?preview=authoring-level5-block1#/ex:l5-b06-scene--scene>
