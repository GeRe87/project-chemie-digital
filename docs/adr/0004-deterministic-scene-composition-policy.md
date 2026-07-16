# ADR-0004: Deterministic resolved-path to scene-document composition

- Status: Proposed
- Date: 2026-07-16

## Context

ADR-0002 separates path resolution, scene composition, and renderer adapters. ADR-0003 defines `SceneDocument` 1.0. The current standard-deviation path resolves five ordered steps whose `viewType` values are didactic composition intents, not renderer component names. A normative policy is required before production composition code is introduced.

## Decision

Composition is a pure, offline operation over one `ResolvedLearningPath` and an immutable, already-resolved resource index. RDF source-file boundaries have no semantic effect.

### Minimal future boundary

```ts
interface CompositionInput {
  readonly path: ResolvedLearningPath;
  readonly resources: ReadonlyMap<string, ResolvedResource>;
}

interface CompositionResult {
  readonly document?: SceneDocument;
  readonly diagnostics: readonly CompositionDiagnostic[];
}

function composeSceneDocument(input: CompositionInput): CompositionResult;
```

The composer validates all inputs before returning a document, never fetches network content, and returns either one valid `SceneDocument` or diagnostics without a partial document. `ResolvedResource` is a future additive normalized-resource boundary; it must expose identity, resource kind, payload, language, and provenance without renderer concepts.

### Deterministic identity and ordering

1. Process `path.steps` in their resolved order.
2. Produce exactly one scene per current standard-deviation step. Scene id is `${step.id}--scene`.
3. Sort resource identities lexicographically exactly as supplied by the resolved-path contract; this order determines blocks within a scene.
4. Block id is `${step.id}--block-${one-based-index}`.
5. `Scene.source` contains one entry per resource in block order. Each block contains exactly its own source resource.
6. Copy available provenance identifiers to `SourceReference.provenanceIds`, sorted lexicographically and deduplicated. Do not infer provenance.
7. `readingOrder` is the block-id array in block order.
8. Initial content uses disclosure orders `0..n-1` and mode `initial`. Progressive or optional disclosure may only be emitted when explicitly requested by didactic input; sibling orders remain unique.
9. Narration is emitted only from an explicit narration payload. It is never synthesized from prose.
10. Run `validateSceneDocument` before success.

### Current viewType mappings

| `viewType` | Didactic interpretation | Required resource kind | Scene primitive |
|---|---|---|---|
| `concept-introduction` | Introduce the concept | exactly one `Definition` with non-empty body | primary `prose`, intent `introduce` |
| `formula-introduction` | Introduce and explain a formula | exactly one `MathExpression` with non-empty LaTeX and an explicit or policy-approved deterministic spoken form | primary `math`, intent `explain` |
| `symbol-explanation` | Explain each symbol independently | one or more `MathSymbol` resources with non-empty symbol | one `math` block per resource, intent `explain` |
| `worked-examples` | Present ordered worked-example contexts | one or more `WorkedExample` resources with non-empty body | one `prose` block per resource, intent `explain` |
| `exercise` | Prompt retrieval/application practice | exactly one `Exercise` with non-empty body | `prompt`, intent `practice`, response mode `free-text`; fallback repeats the prompt as a static task |

The names above remain upstream didactic intents. They do not select slides, fragments, components, widgets, tags, classes, or layouts.

### Accessibility and fallback rules

- Every scene receives an accessibility label derived from explicit topic/resource labels when available; absence is diagnosed rather than guessed when the output would otherwise be unlabeled.
- Every math block requires `spokenText`. For the bounded fixture, the spoken forms are normative fixture data. Production composition must obtain them from normalized resource data or an explicitly versioned deterministic policy input.
- Prompts always include a static fallback that preserves the complete task.
- Unsupported interaction intent may degrade only to a semantically equivalent static block; otherwise composition fails.
- External media remains a versioned reference with alternative text. No remote execution or implicit retrieval occurs.

### Diagnostics

Composition fails atomically with stable diagnostic codes:

- `UNSUPPORTED_VIEW_TYPE`
- `MISSING_RESOURCE`
- `UNSUPPORTED_RESOURCE_KIND`
- `MISSING_REQUIRED_PAYLOAD`
- `INCOMPATIBLE_RESOURCE_CARDINALITY`
- `MISSING_ACCESSIBLE_ALTERNATIVE`
- `MISSING_NARRATION_PAYLOAD` when narration is explicitly required
- `SCENE_CONTRACT_VIOLATION`

Diagnostics identify path id, step id, resource id when applicable, and the violated rule. No placeholder content, inferred resource relation, renderer-specific guess, or partial scene document is returned.

## Normative bounded example

`docs/examples/standard-deviation-scene-document-1.0.json` is the golden architecture example for the current five-step path. It is normative for scene boundaries, identities, ordering, source/provenance propagation, intents, disclosures, accessible math alternatives, and prompt fallback. It is not a renderer fixture.

## Compatibility

This decision changes neither `ResolvedLearningPath` nor `SceneDocument` 1.0. It requires no ontology or SHACL change. Future mappings are additive and versioned; incompatible contract changes require a separate migration decision and human approval where applicable.

## Consequences

- The bounded composer can be implemented and tested without coupling to a renderer.
- Reveal.js remains encapsulated downstream.
- The same logical RDF dataset produces the same scene document regardless of source-file split.
- Missing semantic or accessibility data fails visibly instead of being invented.
