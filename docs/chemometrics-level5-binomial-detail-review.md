# Optional background: meaning of n choose k

Local, uncommitted, unpushed and unpublished. No deployment is authorized.

## Content and implementation

`ontology/dataset/chemometrics-level5-binomial-detail.trig` links the existing
binomial probability expression to an authored mathematical detail through
`cd:hasDerivationDetail`. The existing shared formula-detail button, dialog,
derivation sections and static alternative render it without application or CSS
changes. The main formula and its same-slide symbol legend remain unchanged.

The English background explains unordered selection of distinct positive trial
positions, rather than division or ordered draws. It introduces the factorial
formula and works through ten choose two: 90 ordered pairs, each counted twice,
giving 45 binary arrangements. It distinguishes selection order from distinct
binary sequences, the dimensionless count from probability, and the pure counting
identity from the independent/common-probability assumptions of the binomial model.
The legend explains all symbols, operators, numbers, factorials and boundary
conventions, including zero factorial and choosing none or all positions.

The detail has two connected steps in one authored section and a complete shared
symbol legend. Every formula links the authored legend. No path, scene, mandatory
reveal stage or reserve content is added. The main path remains 70 scenes and the
separate reserve remains six. There is no data collection or new network service.

## Evidence

- Three focused compilation/content/static-alternative tests pass in
  `tests/test_level5_binomial_detail.py`.
- Playwright passes in Edge and Firefox at 1731 x 1006 light, 1280 x 720 dark and
  390 x 844 light: keyboard Enter and mouse opening, explanatory step expansion,
  expected content, no KaTeX errors, no horizontal dialog overflow, symbol legend,
  Escape closing, opener focus return and unchanged active scene. The mobile
  screenshot was inspected. The existing vertically scrolling dialog is reused.
- Local browser evidence/script: temporary directory
  `C:\Users\PCUser\AppData\Local\Temp\opencode`,
  `check-level5-choose.cjs` and `choose-{engine}-{width}.png`.
- The temporary whole-lecture audit now permits only explicitly authored optional
  mathematical-detail buttons, rather than prohibiting all slide buttons. Other
  on-slide controls remain prohibited by that audit.
- Full Level-5 regression passes all 150 tests: `level5-choose-targeted.log`.
  The unittest summary is `OK`; the redirected PowerShell invocation reports
  exit code 1 despite that passing summary, as in earlier local runs.
- The authoritative run `level5-choose-npm-test.log` was stopped before the
  instructor-requested B06 visual replacement. It is not passing full-suite
  evidence. The replacement's review document records the fresh combined run:
  [B06 comparison](chemometrics-level5-samples-vs-repeats-review.md).

## Local preview

<http://127.0.0.1:5173/authoring.html?preview=authoring-level5-block1#/ex:l5-b03b-scene--scene>

Use **Explore: Meaning of n choose k** beneath the existing formula. Opening the
background is optional; normal presentation navigation does not require it.
