# Studiendekanat pitch preview

This app is the first browser-visible vertical slice of the accepted nine-step Studiendekanat pitch. It uses a repository-local Reveal.js dependency and a deterministic preview fixture derived from `content/resources/pitch-content.jsonld` and `content/paths/studiendekanat-pitch.jsonld`.

## Start locally

```bash
npm install
npm run pitch:dev
```

Open the local URL printed by Vite. The runtime installs a no-network guard before Reveal.js initialisation; all dependencies and assets must therefore be available from the local workspace.

## Preview integration boundary

The fixture preserves the accepted resource identities, German wording and canonical nine-step order. It is intentionally renderer-owned and does not claim to be the final SPARQL/Fuseki-to-scene composition pipeline. Four deterministic layouts are included: opening, focused statement, process/architecture and split proof-of-concept.

The visual treatment uses the accepted local chemistry theme direction, system fonts and no downloaded UDE assets. It is not an officially approved UDE corporate design.

## Accessibility and lifecycle

Sections receive stable headings, source identities and readable DOM order. Reveal.js keyboard navigation remains enabled, reduced-motion preferences disable transitions, visual sequences include text alternatives, and page teardown destroys Reveal.js, unmounts the generated sections and restores guarded browser APIs.

## Static fallback

The accepted wording is stored directly in `src/preview.ts` and remains inspectable without the running application. The preview does not include analytics, telemetry, learner persistence or Presenter Mode window integration.
