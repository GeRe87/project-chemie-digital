# Phase 2e end-to-end acceptance — Interactive Demonstrator v0.1

This document is the reproducible release-readiness choreography for the graph-backed Standardabweichung demonstrator. It does not replace the canonical semantic sources or automated tests. The authored content remains the TriG dataset under `ontology/dataset/`.

The accepted end-to-end path is:

`TriG → validated Dataset → SceneDocument → Reveal.js / scene-context graph → mathematics → executable R → audience interaction`

## 1. Preconditions

Use the exact pull-request head under acceptance. Do not reuse browser evidence after the head changes.

Required local software follows the repository README: Node.js 22+, npm, Python 3.11+ and the Python packages from `requirements-dev.txt`.

Install dependencies and run the authoritative project test:

```powershell
npm ci
npm test
```

The exact PR head must also receive GitHub commit status:

```text
agent-validator/project-chemie-digital = success
```

The local validator status and the owner-reported Firefox evidence are independent gates.

## 2. Prepare the connected runtime while online

The ordinary/static pitch needs no interactive runtime preparation. For connected and offline acceptance, prepare the pinned local CodeMirror/webR assets once while public Internet is available:

```powershell
npm run prepare:interactive-runtime -- --force
npm run check:interactive-runtime
```

Expected pre-flight result:

```text
Interactive runtime vendor cache is complete.
```

The generated cache is under `apps/pitch/public/vendor/` and is intentionally not committed.

## 3. Start the local services

Terminal 1 — deterministic credential-free audience-poll provider:

```powershell
npm run poll:demo
```

Terminal 2 — Reveal pitch:

```powershell
npm run pitch:dev
```

Use Firefox for the manual browser gate.

## 4. Normal/static mode

Open:

```text
http://127.0.0.1:5173/
```

Verify:

- all nine Standardabweichung scenes are readable and Reveal navigation works;
- graph/summary/presentation switching and return-to-presentation behavior work;
- the sample standard-deviation formula is typeset by local KaTeX and retains an accessible spoken alternative;
- the audience-poll prompt/options and the R example remain readable as static authored content;
- no CodeMirror/webR enhancement is mounted;
- no request to the poll service at `127.0.0.1:8787` is required;
- no public CodeMirror/webR CDN request occurs.

The normal mode intentionally installs the presentation network guard and is the default safe/offline teaching path.

## 5. Connected-interactive mode

Open:

```text
http://127.0.0.1:5173/?interactive=1
```

On scene 9 verify the graph-backed audience poll appears before the executable R editor. The prompt and option labels must be the authored graph content; the provider supplies only aggregate response metadata.

Verify CodeMirror and Reveal keyboard isolation: typing, cursor keys and Space while interacting with the editor/button must not accidentally navigate the deck.

Run:

```r
x <- c(6, 8, 10)
sd(x)
```

Expected output:

```text
[1] 2
```

Then run:

```r
x <- c(9, 10, 11)
sd(x)
```

Expected output:

```text
[1] 1
```

Verify that R output is exposed through the labelled polite live region and that the poll demo aggregates update without exposing individual responses.

## 6. Public-Internet-offline mode

After the vendor cache was prepared successfully, disconnect public Internet access. Keep localhost networking available.

Re-run the network-free pre-flight:

```powershell
npm run check:interactive-runtime
```

It must still succeed.

Reload connected mode in Firefox and execute both R examples again. In the Network panel, CodeMirror/webR resources must be served from local paths such as:

```text
127.0.0.1:5173/vendor/codemirror/...
127.0.0.1:5173/vendor/webr/v0.6.0/webr.js
127.0.0.1:5173/vendor/webr/v0.6.0/...
```

The deterministic poll provider may continue to use the explicit localhost service boundary:

```text
127.0.0.1:8787
```

No presentation-time request may appear for:

```text
cdn.jsdelivr.net
webr.r-wasm.org
registry.npmjs.org
```

## 7. Fail-closed: unavailable poll provider

Keep the pitch running and stop only `npm run poll:demo`.

Connected mode must retain:

- the authored question and both authored options;
- the executable/static R exercise;
- Reveal navigation and graph/presentation switching.

The live aggregate area may report that live results are unavailable. Poll-service failure must not remove graph-authored content or crash the presentation.

Restart the demo provider before the next check if required.

## 8. Fail-closed: unavailable local interactive runtime

Stop the pitch server. Temporarily rename the generated vendor directory; do not delete it:

```powershell
Rename-Item "apps\pitch\public\vendor" "vendor-disabled"
```

Restart the pitch:

```powershell
npm run pitch:dev
```

Open connected mode again. Verify:

- the presentation remains readable and navigable;
- authored static R code remains visible/readable if CodeMirror cannot mount;
- failure does not trigger a fallback to a public CDN;
- the poll boundary remains independent.

Restore the cache afterwards:

```powershell
Rename-Item "apps\pitch\public\vendor-disabled" "vendor"
npm run check:interactive-runtime
```

The final check must succeed.

## 9. Accessibility and privacy gate

In Firefox confirm:

- the mathematical alternative is available to accessibility APIs/static fallback;
- editor/button keyboard interaction does not leak into Reveal navigation;
- the R output region remains labelled `R-Ausgabe` and uses `aria-live="polite"`;
- no unexpected browser exceptions occur during normal navigation, graph switching, poll use or R execution.

Privacy boundaries to preserve:

- the browser receives only poll identity, participant/deployment metadata, aggregate total and canonical option IDs/counts;
- browser code contains no LimeSurvey username/password, session key or RemoteControl administrative method;
- the server-side proxy exports only the configured question field and maps answer codes to canonical option identities;
- real UDE LimeSurvey credentials and production configuration are outside Phase 2e v0.1 acceptance.

## 10. Evidence record and release rule

Record manual Firefox acceptance on the pull request against the exact validated head. A head change invalidates that browser evidence and requires a fresh validator result plus a fresh manual browser gate.

Phase 2e is complete only when all of the following hold on one unchanged exact head:

1. authoritative `npm test` / exact-head validator succeeds;
2. the acceptance PR contains this deterministic choreography and its structured handoff;
3. normal/static, connected-interactive, public-Internet-offline and both fail-closed checks pass in Firefox;
4. accessibility/privacy boundaries above are accepted;
5. the manager independently verifies the gates and merges the acceptance PR.

Phase 3 platform work is explicitly outside this acceptance.
