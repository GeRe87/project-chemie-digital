# Teaching terminology: linear interpolation

The lecture now calls its sample-quantile calculation **linear interpolation**,
not a numbered software method. Labels, cards, table headings, script prose,
diagram fallbacks, accessible descriptions and the four moment-matrix headings
use the same terminology. The inverse ECDF comparison remains explicit: the
50-value example still gives 6.5 mg/L by inverse ECDF and 6.625 mg/L by linear
interpolation.

The rank formula, interpolation weights, endpoint/singleton rules, datasets,
quartiles, fences and whisker calculations are unchanged. The redundant method
index on the displayed sample-quantile/IQR notation is removed. The corresponding
same-slide authored symbol legends remain linked by `dct:hasPart` and explain
the simplified notation, operators, units and endpoint conditions.

Stable RDF resource identifiers and the internal `quantileMethod: "type7"`
contract are preserved, avoiding an unrelated identity or API migration. In R,
`type=7` remains the exact executable argument selecting linear interpolation.
It is explained as a software argument, not taught as a separate concept. The
moment-lab helper and printed column/plot labels are renamed without changing
the calculation; all used functions remain explained beneath the output.

Checks: `apps/pitch/test/level4-linear-interpolation.test.ts` covers visible
terminology, unchanged numerical examples and formula/legend linkage.
`scripts/check_level4_linear_interpolation.cjs` compares numerical parameters,
formula bodies and R computation with a pre-edit local baseline, checks all
rendered slide/script text, and captures the formula, ECDF, Boxplot and matrix
examples in both themes at 16:9.

Artifacts: `C:/Users/PCUser/AppData/Local/Temp/opencode/level4-linear-interpolation/`.
No scene restructuring, commit, PR, external overall validation, merge or
deployment is included. Older review documents and screenshots are historical.

Verification results: 19 selected Node tests and 41 bounded Python checks
passed. The browser check passed for all 65 slide/script sections and captured
the three changed formula/legend units, ECDF comparison, Boxplot and matrix in
both themes. Numerical baseline comparison passed, as did real execution of
the renamed moment-lab helper with unchanged variance/moment values and a
complete nine-panel R graphic. Formula legends and the actual R plot were also
visually inspected.

The compact Firefox PDF check passed independently: 59 portrait pages,
2,358,553 bytes, all pages raster-checked, no embedded images and four complete
rotated matrix plates. `git diff --check` passed for the changed tracked sources.
Existing Desktop PDFs were not overwritten.
