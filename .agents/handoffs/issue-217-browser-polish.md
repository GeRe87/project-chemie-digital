# Issue #217 — Browser polish and local interaction

## Screenshot-driven fixes

### Measurement + UV/Vis
The global chart skin uses a 92vw window, which is correct for standalone charts but overflowed nested grid columns. The measurement/experiment layouts now explicitly own nested chart width, compact chart chrome, constrain SVG height, and set min-width:0 on grid children.

### Independent / dependent variables
The same semantic five-block structure remains. Spacing, card density, formula size and caveat width are tightened so the slide reads as one two-column composition.

### Observation bridge
The semantic content is unchanged in meaning but authored prose is shorter. The layout now reserves a fixed compact diagram band between the value formula and takeaway; the flow SVG is constrained to that band so it cannot overlap the distribution note.

### webR
The code resource is now editable. Standard course startup prepares the pinned local CodeMirror/webR cache and the Pitch app mounts local executable code blocks in normal presentation mode. External live-poll networking remains opt-in.

Controls:
- CodeMirror editor
- Run
- Reset
- accessible Output

The normal network guard now allows only same-origin /vendor/ fetches while still rejecting external requests.

### Quick check
AudiencePoll gained optional `cd:correctPollOption`. The compiler carries option identities, correct option, and ExpectedResult into PromptBlock. The local quiz runtime turns those authored choices into buttons and reveals immediate graph-backed feedback. Connected external polling skips these self-check polls.

The three questions are laid out as three compact columns rather than oversized vertical rows.

## Verify

```powershell
npm run check:semantics
python -m unittest tests.test_chemometrics_variables_constants_content tests.test_chemometrics_random_variables_path tests.test_chemometrics_random_variables_scenes -v
npm run test:core
npm run test:renderer-reveal
npm run test:pitch
npm run pitch:intro
```

No `?interactive=1` is required for the local CodeMirror/webR exercise or local self-check quiz. That query parameter remains only for connected live-poll service behavior.


## Test alignment

Before owner verification, the focused scene test was aligned with the polished authored prose: the causality/statistical-independence statement is asserted in the caveat block, and the observation bridge asserts the explicit “probability distributions belong to random-variable models” wording.
