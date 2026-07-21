# Studiendekanat pitch narrative path

The versioned path `ex:studiendekanat-pitch-path-v1` orders the accepted semantic pitch resources without defining slides, layouts or renderer components.

## Narrative order

1. **Context and opportunity** — establish the pitch as the first end-to-end platform application.
2. **Knowledge-first proposition** — explain that knowledge and reusable resources are primary, while presentation views are generated outputs.
3. **Semantic resource layer** — show what becomes reusable and addressable.
4. **Didactic and narrative paths** — explain how resources are selected and ordered for a purpose.
5. **Scene-composition boundary** — introduce the deterministic transformation into renderer-neutral presentation states.
6. **Renderer separation** — make the technology boundary explicit.
7. **Multiple output channels** — show how the same knowledge base supports several use contexts.
8. **Standard-deviation proof of concept** — ground the architecture in the implemented demonstrator.
9. **Purpose and next step** — return to the Studiendekanat vertical slice as the concrete next application.

Each step carries one semantic `viewType` describing its communicative purpose. The values contain no Reveal.js, D3, slide, component or layout terminology.

## Determinism and validation

Every step has one unique positive integer position. `cd:hasStep` remains an unordered RDF relation; the resolver derives the reading order exclusively from `cd:position`. Tests reverse the JSON-LD graph order and assert the same nine-step result. A separate in-memory mutation gives two steps position `1` and must fail with the stable duplicate-position diagnostic.

The path references only resource identities accepted in `content/resources/pitch-content.jsonld`. The first and final steps intentionally reuse `ex:pitch-vertical-slice-purpose`: first as context, then as the closing purpose and next-step frame. No resource body or provenance is changed.

## Accessibility and cognitive load

The explicit positions provide a stable reading order for later accessible scene and renderer outputs. One principal message is assigned to each step. Architecture is unfolded progressively before the proof of concept, limiting simultaneous conceptual load. The final step reconnects the technical explanation to the institutional purpose.

## Privacy and downstream boundary

The path contains no personal data, learner state, analytics or network references. Scene composition, visual theme, presenter mode, optional detail paths and renderer behavior remain later bounded increments.

## Validation command

From the repository root:

```text
npm test
```
