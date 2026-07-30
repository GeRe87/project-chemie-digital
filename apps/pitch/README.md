# Standardabweichung pitch preview

This app is the browser-visible Reveal.js renderer for the canonical Standardabweichung learning path. Audience-visible semantic content is authored only in the TriG Dataset under `ontology/dataset/`.

## Start locally

```bash
npm install
npm run pitch:dev
```

The development command first regenerates `apps/pitch/src/generated/canonical-runtime.json` from the canonical TriG Dataset and then starts Vite. The generated JSON is disposable, ignored by Git and checked for deterministic freshness during validation; it is not an authored content source.

Open the local URL printed by Vite. The runtime installs a no-network guard before Reveal.js initialisation, so all dependencies and assets must be available from the local workspace.

## Runtime boundary

The canonical flow is:

```text
ontology/dataset/*.trig
        ↓
deterministic Dataset assembly and SHACL validation
        ↓
path, scene and knowledge-network compilation
        ↓
disposable canonical-runtime.json
        ↓
application shell
        ├── Reveal.js presentation
        └── accessible textual graph summary
```

The app renders the ordered nine-scene Standardabweichung sequence while preserving RDF identities, named-graph provenance and authored relation paths. Reveal.js owns presentation mechanics and layout only; the application shell owns ephemeral switching state, and the core domain model and authored scientific content remain renderer-independent.

## Accessible graph summary

The keyboard-accessible **Wissenskontext anzeigen** control projects the current scene through the accepted deterministic one-hop core boundary. The textual summary separates resources used in the current scene from directly related resources that have not been presented, follows the projection document reading orders, exposes semantic identities and available provenance, and returns focus to the invoking control when the presentation is restored.

A projection or scene-state failure leaves the current presentation visible and reports a bounded accessible error. The summary does not query RDF or Fuseki directly, does not persist exploration state, and is not a second semantic content source. A visual D3 graph remains a separate later stage.

## Accessibility and lifecycle

Sections receive stable headings, source identities and readable DOM order. Reveal.js keyboard navigation remains enabled, reduced-motion preferences disable transitions, the summary heading receives focus on entry, and page teardown destroys Reveal.js, unmounts both views and restores guarded browser APIs.

## Static fallback

`index.html` contains a complete audience-facing `<noscript>` fallback. Automated tests must keep its scene order and audience-visible wording aligned with the generated canonical runtime. Manual browser inspection remains part of manager acceptance.

The preview does not include analytics, telemetry, learner persistence, Fuseki deployment or Presenter Mode window integration.
