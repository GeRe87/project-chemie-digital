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
Reveal.js renderer
```

The app renders the ordered nine-scene Standardabweichung sequence while preserving RDF identities, named-graph provenance and authored relation paths. Reveal.js owns presentation mechanics and layout only; the core domain model and authored scientific content remain renderer-independent.

## Accessibility and lifecycle

Sections receive stable headings, source identities and readable DOM order. Reveal.js keyboard navigation remains enabled, reduced-motion preferences disable transitions, and page teardown destroys Reveal.js, unmounts generated sections and restores guarded browser APIs.

## Static fallback

`index.html` contains a complete audience-facing `<noscript>` fallback. Automated tests must keep its scene order and audience-visible wording aligned with the generated canonical runtime. Manual browser inspection remains part of manager acceptance for this migration.

The preview does not include analytics, telemetry, learner persistence, Fuseki deployment or Presenter Mode window integration.
