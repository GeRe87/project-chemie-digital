# Level 4: expectation formulas, reading script and PDF review

Local authoring follow-up, 2026-10-24. All changes remain uncommitted; no PR,
merge, deployment, full test suite or external validator was requested or run.

## Content and shared projection

- The 65-scene path now presents mean → variance → skewness → kurtosis.
- The four moment lessons show population E[ ] formulas above explicitly
  distinguished empirical counterparts. Authored legends explain population and
  sample symbols, units, existence conditions and excess-kurtosis conventions.
- `ontology/dataset/chemometrics-level4-script-narration.trig` authors continuous
  prose independently for every selected scene. Earlier resources remain intact.
- The existing Variance script toggle and self-study renderer are reused. The
  script retains 44 scientific diagrams, 14 linked formula/legend units and four
  empirical moment tables. No authored semantic JSON source was introduced.
- The PDF button appears in script mode only and invokes native browser printing,
  including Save as PDF. No server, upload or external conversion is involved.
- Print CSS uses portrait A4 for reading and one landscape page per moment
  comparison, including its compact numerical table. The keyboard focus outline
  is suppressed only in print, not during ordinary keyboard use.

## Local review artifacts

Directory outside the repository:
`C:/Users/PCUser/AppData/Local/Temp/opencode/level4-script-review/`.

- `chemometrics-level4-script.pdf`: actual browser-generated script PDF.
- `script/light/` and `script/dark/`: all 65 complete sections in each theme,
  plus one overview per theme. Tall sections are not truncated to viewport height.
- `slides/`: all 65 slide views in each theme, including the accepted opening.
- `review-manifest.json`: scene identities, screenshot paths, PDF page inventory,
  byte count and SHA-256 checksum.
- `pdf-review-sample.pdf`: bounded selection for visual inspection.

Reproduce with `PLAYWRIGHT_MODULE` set to the local Playwright installation,
`REVIEW_DIR` set to that approved external directory and
`node scripts/check_level4_script_review.cjs`. Set `REVIEW_SLIDES=0` only for
script/PDF iterations. Do not regenerate transports during capture.

## Verification

- 390 selected Node tests passed after the final semantic change.
- 41 selected Python tests passed again after the final semantic change.
- Normal-course smoke check: Level 4 exposes 65 script sections; the existing
  Variance module still exposes 48. Both expose the print button in script mode.
- Browser capture checks cover complete visible legends, individual symbol
  colors, grid observation/count consistency, theme switching, script toggling,
  print invocation and absence of browser errors.
- Final capture passed all 65 slides and all 65 script sections in both themes
  (260 content screenshots, plus two script overviews). The PDF has 46 pages,
  including exactly four complete landscape moment comparisons.
- Final PDF: 3,458,450 bytes; SHA-256
  `3cf51ae673a7a1d776a4ee1a2fb6b1ffaf834e6899121c59956427d48a804b70`.
  Sample pages 1, 38, 41, 44 and 46 were visually inspected, including a complete
  expectation formula/legend and complete table/matrix pages. The output has no
  blank/nearly blank pages or printed focus frame.
- The PDF is tagged and includes an outline. Semantic headings, tables, legends
  and data disclosures remain available; color is not the sole identifier.
  Synthetic data introduce no personal-data processing. No claim of complete
  PDF accessibility certification or pedagogical effectiveness is made.

Preview: <http://127.0.0.1:5173/authoring.html?theme=light&background=none>.
Direct script: append `&mode=script`.
