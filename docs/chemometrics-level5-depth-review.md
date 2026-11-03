# Level 5: distribution origins, applications and reporting ranges

Historical 51-scene review. The main preview now selects the
[55-scene storyline revision](chemometrics-level5-storyline-review.md); validation
below belongs to this earlier increment, not the new storyline sources.

This local revision supersedes the 41-scene main preview with a **51-scene**
curated path, `ex:path-level5-analytical-distributions-depth`, in its own named
path graph. The previous main path, 70-scene support and reserve remain intact.
Nothing is committed, pushed, published or deployed.

## Instructor feedback addressed

- **PDF, CDF and inverse CDF:** start with three pipette-volume questions. Teach
  the operations on the same Uniform(0,1) input, then show linked PDF/CDF panels.
  The CDF formula explicitly integrates the PDF. A selected area of 0.50 matches
  the CDF difference 0.75 minus 0.25. Mapping to 9.98-10.02 mL gives an interval
  9.99-10.01 mL, cumulative probability 0.75 at 10.01 mL, and the inverse answer
  10.01 mL at probability 0.75. Equal plausibility within bounds is an assumed
  uncertainty model, not a guaranteed tolerance or fitted repeatability model.
- **Normal title:** “The normal model for repeated analytical results”.
- **Normal sigma ranges:** after standardization, show the 1/2/3-SD ranges for
  mean 10.00 mg/L and SD 0.30 mg/L. Bounds are 9.70-10.30, 9.40-10.60 and
  9.10-10.90 mg/L. Coverage is 68.27%, 95.45% and 99.73%, not 68.4% or exactly
  95% at two SDs. These concern individual results, not mean confidence intervals.
- **Lognormal process and substantive usecase:** six stages follow a hypothetical
  number-weighted aerosol microscopy case: question, relative-growth schematic,
  model, fraction above 5 µm, multiplicative sigma ranges and a central 95% report.
  Natural log size is normal with reference 1 µm, log mean ln(2) and log SD 0.75.
  These are specified teaching parameters, not fitted observations. Suitable log
  contributions motivate normal log size; positivity alone does not establish it.
- **Lognormal intervals:** geometric SD is exp(0.75), approximately 2.117. Divide
  and multiply the 2 µm centre by that factor raised to 1, 2 or 3. Ranges are
  0.9447-4.2340, 0.4463-8.9634 and 0.2108-18.9755 µm with the corresponding normal
  coverages. The diagram uses a clearly labelled logarithmic diameter axis. An
  exactly central 95% range is 0.4599-8.6982 µm, not the two-log-SD range. The
  modeled fraction above 5 µm is 11.09%. These are individual-size model statements,
  not confidence intervals for the mean, median or estimated tail fraction.
- **Chi-square, Student-t and F:** an origin overview distinguishes raw results
  from calculated statistics. Each illustrated analytical usecase now precedes
  a construction, the existing sample-statistic formula and a numerical application.
  Chi-square sums independent squared normal coordinates; fitting one mean leaves
  n-1 such coordinates, not independent raw centered residuals. Student-t divides
  a normal numerator by an independent estimated scale. F divides two independent
  scaled chi-squares, becoming the sample-variance ratio under equal population
  variances. Exactness depends on the stated normality and independence assumptions.

The final eight-scene live dilution Monte Carlo case is reused unchanged.
Environmental sampling, laboratory repeats, individual model ranges, inferential
confidence intervals and conditional propagated uncertainty remain distinct.
No safety, legal or pedagogical-effectiveness claim is introduced.

## Authoring and rendering

All new scientific content, assumptions, executable selections, narrative and
path order are authored in TriG. New sources are the `process-depth`,
`sampling-constructions`, `log-size-data`, `depth-scenes` and `depth-path` TriG
files under `ontology/dataset/`. Five linked SVG illustrations have accessible
titles, descriptions, authored text alternatives and self-contained theme palettes.
They contain no scripts or external requests.

Every displayed formula selects its authored symbol legend through `dct:hasPart`.
The existing shared formula/legend renderer is retained. The existing generic
`visual-formula` composition now also accepts a media illustration, just as it
already accepts a chart or diagram. This prevents stacking a large illustration
above a formula and pushing its legend off-screen. No scene-specific CSS, identity
lookup, new layout type or domain dependency on Reveal.js is introduced.

## Verification

- Preview generation succeeds with 51 scenes.
- Eight new focused Python tests pass: path sequence, same-scene legend ownership,
  function links, numerical normal/lognormal coverage and intervals, all 15 diameter
  density coordinates, threshold and quantile values, construction arithmetic,
  accessible SVG assets and preview selection.
- All 57 composition-policy Node tests pass, including the generic media/formula
  composition test.
- All **169 Level-5 Python tests pass**, including the new eight tests. The log
  `level5-depth-targeted.log` ends with `Ran 169 tests` and `OK`; redirected
  PowerShell reports exit 1 for this command, so the actual unittest summary is
  recorded rather than treating that wrapper status as proof of a test failure.
- Native forward and reverse navigation passes all 51 scenes in Edge and Firefox,
  without required reveals or mandatory opening of the live code editor.
- The actual browser-R Monte Carlo case also passes again in Edge and Firefox:
  plots, deterministic repeated default runs, 50,000 trials, doubled signal SD
  and reset. Log: `level5-depth-live-r.log`.
- The initial browser pass was diagnostic, not final evidence. It exposed the
  stacked media/formula layout, a long product/log formula and a LaTeX line break
  immediately before a bracket (misread as optional spacing). All were revised.
  The focused Edge matrix then passed the new scenes in all three configurations.
- The linked-function and normal/lognormal range SVGs were subsequently made
  taller with larger labels for readability in standard two-column layouts. The
  normal curve's drawing coordinates follow the same SD scale as its range bars.
- Final full Edge and Firefox matrices are running on the stabilized sources:
  `level5-depth-edge-final.log` and `level5-depth-firefox-final.log`, in the approved
  local temporary directory. Each tests all 51 scenes at 1731×1006 light,
  1280×720 dark and 390×844 light. Each navigation gets a unique audit parameter
  to avoid accidentally retaining an older render of the same scene.
  Firefox has now completed successfully: all 51 scenes pass in all three
  configurations on the stabilized sources.
  Edge has also completed successfully for all 51 scenes in those three
  configurations. Both final browser matrices pass.
- The fresh authoritative `npm test` completed successfully on unchanged semantic/
  feature sources: **725 Python tests and all Node suites pass**.
  Log: `level5-depth-final-npm-test.log`. Final dataset fingerprint:
  `edc469d7b6f0ff115c678d566f25d49c24928e2f93564313ce0fa71c4f9fac71`.
  No semantic or feature sources were edited during the run. The previous
  717-test passing run belongs to the 41-scene revision, not this increment.
  The separate earlier SHACL diagnostic completed with `Conforms: True`
  on fingerprint `01600e22f2cbee82b5678a724bed9f4c88974fd9c216a09f2ebd12571c364f72`.
  That check began before final formula/legend shortening and is not exact-final
  evidence; the completed full test run validates the stabilized sources again.

No learner data is collected. Thumbnails are decorative; scene text and media
alternatives carry meaning. Instructor rehearsal is still required for timing.

## Preview

<http://127.0.0.1:5173/authoring.html?preview=authoring-level5-block1#/ex:al-opening--scene>

New scenes begin at `ex:dep-functions--scene`; the lognormal case begins at
`ex:dep-log-story--scene`. The full revised sequence is authored in the depth path,
not inferred from file order or encoded in application code.
