# project-chemie-digital

Private development project for the FCI-funded module **Digitalisierung in der Chemie: Datenmanagement, Prozesse, KI**.

The project follows a knowledge-first architecture:

1. Educational knowledge and resources are authored in canonical TriG datasets.
2. Learning and narrative paths select and order relevant resources.
3. A scene composer transforms a resolved path into renderer-neutral presentation states.
4. Scene-to-RDF bindings support deterministic scene-context graph projections.
5. Reveal.js renders live presentations as one output channel; additional adapters may provide self-study, knowledge-network, print and OER views.

## Talks checkout

This branch contains the scientific presentation collection and the shared renderer and semantic tooling. Chemometrics course content and its course-specific preview and tests live on the `chemometrics` branch.

## Connected interactive runtime

The ordinary pitch remains static and does not prepare or fetch CodeMirror/webR assets. Connected mode (`?interactive=1`) uses a local vendor cache under `apps/pitch/public/vendor/`; that generated cache is intentionally not committed.

Prepare the pinned runtime **while public Internet access is available and before presentation time**:

```bash
npm run prepare:interactive-runtime
npm run check:interactive-runtime
```

The preparation command mirrors the pinned CodeMirror `@codemirror/view` 6.43.6 ESM dependency graph into local modules and extracts the complete `webr` 0.6.0 npm `dist/` runtime (including R WebAssembly binaries and VFS) into the local Vite public tree. A generated manifest records the versions, local destinations and downloaded webR archive digest.

`npm run check:interactive-runtime` performs no network access. It is the pre-flight check to run after disconnecting from public Internet. `npm run pitch:dev` never invokes the preparation command automatically; if the local vendor cache is absent or damaged, connected CodeMirror/webR enhancement fails closed and the canonical static code remains available instead of silently fetching from a CDN.

The audience-poll provider remains a separate service boundary. The deterministic local demo proxy or an explicitly configured LimeSurvey proxy may be used in connected mode, but poll-service failure must not remove the graph-authored prompt/options or the code exercise.

## Semantic validation

The complete semantic slice is assembled exclusively from canonical TriG files under `ontology/dataset/`. SHACL validation reads the named `graph/shapes/*` graphs from the assembled logical RDF Dataset. Retired JSON-LD and flat Turtle compatibility sources are not active inputs and must not be restored.

```bash
python -m pip install -r requirements-dev.txt
npm run check:semantics
npm run test:semantics
```

Path order is represented by each `cd:PathStep` integer `cd:position`; `cd:hasStep` is an unordered RDF relation and does not create an RDF list node.

## Talks presentation family

Talks reuses Pitch's semantic path compiler, Reveal renderer and themed background
engine for independent scientific presentations. Author the collection and title
metadata in `ontology/dataset/talks.trig`, not in HTML or JSON.

```bash
npm run talks:dev
npm run build:talks
npm run check:talks-build
```

The production artifact is `dist/talks`.
See [Talks build and Cloudflare Pages preparation](docs/talks-deployment.md) and
[ADR-0020](docs/adr/0020-scientific-presentation-collections.md). Hosting configuration
is an owner action; these commands do not deploy either site.

The current TED-GC-MS talk contains 29 scenes. Its
knowledge, diagrams, synthetic chromatogram and scene selection are authored in
`ontology/dataset/talks-ted-*.trig`; see the [content and scientific review record](docs/handoffs/issue-294-ted-introduction.md).
Time-saving comparisons use the reusable [semantic timeline-chart standard](docs/timeline-charts.md),
not slide-specific HTML or CSS.
Calibration windows use the shared [regression-chart standard](docs/regression-charts.md).

## Repository principles

- `main` remains reviewable and stable.
- Agents work through issues, `agent/*` branches and draft pull requests.
- Workers never merge their own work.
- Architectural decisions are recorded as ADRs.
- Semantic content is validated with SHACL.
- Domain knowledge, reusable resources, paths, scenes, view documents and renderer adapters remain separate layers.
- Reveal.js, React and D3 are adapter dependencies, not the platform domain model.
- Generated JSON is disposable transport, never an authored semantic source.
- GitHub Actions workflows must not be added or restored.

See `AGENTS.md` and `docs/agent-operating-model.md`.
