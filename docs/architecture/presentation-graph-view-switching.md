# Presentation and knowledge-graph view switching

Status: proposed architecture specification for issue #46

## 1. Purpose and scope

The application shall let a user move between a compiled presentation scene and a knowledge-graph projection of the semantic resources behind that scene without changing canonical knowledge or losing presentation position.

This specification defines product states, ownership boundaries, deterministic identity and provenance mapping, accessibility and privacy behavior, failure handling, and a staged implementation plan. It does not implement a toggle, React or D3 components, force layout, Fuseki access, a browser editor, ontology changes, or new scientific content.

The design preserves the accepted dependency direction:

```text
canonical RDF knowledge + graph-backed scene definitions
                         |
                         v
              deterministic compiler
                         |
                         v
                SceneDocument 1.0
                    /         \
                   v           v
       presentation adapter   graph projection input
          (Reveal.js)          (renderer-neutral)
```

Reveal.js, D3, React, DOM, force-layout coordinates, and browser storage concepts remain outside the semantic core and outside `SceneDocument`.

## 2. Product interaction model

### 2.1 User-visible modes

The shell owns a finite view state with three user-visible modes:

1. **Presentation** — the current compiled scene is rendered through the presentation adapter.
2. **Graph exploration** — a renderer-neutral graph projection is shown with the resources used by the current scene highlighted.
3. **Accessible graph summary** — a structured, non-visual list/tree representation of the same projection, available by explicit choice and as the fallback when the graphical projection cannot be used.

A transient error panel may overlay any mode, but it is not a fourth navigation destination and must not discard the last valid mode state.

### 2.2 Shell state

The minimum shell-owned state is:

```ts
type ViewMode = "presentation" | "graph" | "graph-summary";

type ViewSwitchState = {
  mode: ViewMode;
  sceneId: string;
  sceneRevision: string;
  presentationCursor: {
    blockId: string | null;
    fragmentId: string | null;
  };
  graphCursor: {
    focusedResourceId: string | null;
    expandedResourceIds: readonly string[];
    visitedResourceIds: readonly string[];
  };
  returnFocus: {
    controlId: string;
    blockId: string | null;
  };
};
```

`sceneRevision` is a deterministic fingerprint of the compiled `SceneDocument` input, not a mutable RDF revision counter. Arrays are stored in canonical lexical order when serialized.

### 2.3 Transitions

| From | Trigger | To | Required behavior |
| --- | --- | --- | --- |
| Presentation | Open graph | Graph exploration | Preserve presentation cursor; derive projection from the current scene; focus the graph heading, then the highlighted node corresponding to the active block when available. |
| Presentation | Open accessible graph | Accessible graph summary | Preserve presentation cursor; focus the summary heading and announce the current scene context. |
| Graph exploration | Return to scene | Presentation | Restore the same scene and presentation cursor; restore focus to the invoking control or the active scene block. |
| Accessible graph summary | Return to scene | Presentation | Same restoration contract as graphical exploration. |
| Graph exploration | Use summary fallback | Accessible graph summary | Preserve focused and expanded resource identities; represent them as selected/expanded entries. |
| Accessible graph summary | Use visual graph | Graph exploration | Preserve identity-based focus where the graphical renderer supports it. |
| Any mode | Scene changes externally | Same mode if compatible; otherwise Presentation | Reconcile by identity and revision; never silently attach old exploration state to a different scene snapshot. |

Switching is permitted at any time after a valid `SceneDocument` and projection input are available. During compilation or projection, the current valid view remains visible with a non-blocking busy indication. A failed transition leaves the user in the previous valid mode.

### 2.4 Current-scene highlighting and related resources

The graph projection has two bounded sets:

- **selected resources**: RDF resources explicitly referenced by the current `SceneDocument` blocks or their provenance records;
- **related resources**: direct one-hop neighbors selected through an explicit relation allowlist and not already selected.

Selected resources are visually and semantically distinguished from related resources. Related resources must be labelled as “related, not presented in this scene” and must never be implied to have been taught or shown.

No recursive expansion is automatic. A user may request another one-hop expansion for a focused resource; each expansion is local exploration state and does not alter scene definitions or canonical RDF.

## 3. Ownership and lifecycle boundaries

| Layer | Owner | Mutable during viewing? | Persistence | Prohibited responsibility |
| --- | --- | --- | --- | --- |
| Canonical RDF knowledge | Semantic content layer | No | Repository/Fuseki in later phases | UI state, layout coordinates, visited/open flags |
| Graph-backed scene definition | Semantic authoring layer | No during viewing | Canonical RDF | Reveal.js HTML, D3 nodes, browser focus state |
| Compiled `SceneDocument 1.0` | Deterministic compiler | Immutable snapshot | Rebuildable/discardable | Canonical editing, renderer layout, learner state |
| Knowledge-network projection document | Deterministic projector | Immutable snapshot | Rebuildable/discardable | Force coordinates, DOM handles, canonical mutations |
| Presentation renderer state | Reveal adapter | Yes | Ephemeral by default | Semantic truth or graph authoring |
| Graph renderer state | Graph adapter | Yes | Ephemeral by default | Semantic truth, relation inference, scene edits |
| Local exploration state | Application shell | Yes | Session-local; optional explicit export | Silent write-back to canonical RDF |
| Future semantic scene-editor draft | Dedicated authoring boundary | Yes, explicitly | Separate draft graph or explicit local export | Second content store, direct Reveal.js HTML editing |

Compiled documents are cacheable outputs but never authoritative authoring sources. A cache key includes the canonical input fingerprint, compiler/projector contract version, requested language, scene identifier, and relation allowlist version.

## 4. Deterministic identity and provenance mapping

### 4.1 Identity rules

Every graph-addressable scene block must expose a stable `blockId` and at least one RDF identity in its compiler-produced metadata.

The mapping contract is:

```ts
type SceneResourceBinding = {
  blockId: string;
  resourceIds: readonly string[];
  provenanceResourceIds: readonly string[];
  relationPath: readonly string[];
};
```

Rules:

1. RDF identities are absolute IRIs after JSON-LD expansion.
2. Blank nodes are not valid cross-view identities. A compiler must either skolemize them deterministically under a project-owned namespace or reject them for cross-view navigation.
3. `resourceIds` and `provenanceResourceIds` are unique and lexically sorted.
4. `relationPath` records the authored predicates used to resolve a displayed value, for example scene element → selected definition → source.
5. Renderer-generated DOM identifiers, array indices, slide numbers, force-layout node indices, and localized labels are never identity keys.
6. One block may map to multiple resources. One resource may map to multiple blocks. The graph highlights the set union while preserving the originating block bindings for return navigation.
7. If a block has no RDF binding, it may render as generic UI chrome but it cannot participate in graph highlighting.

### 4.2 Projection input

The semantic core/projector accepts only renderer-neutral input:

```ts
type SceneGraphProjectionRequest = {
  sceneId: string;
  sceneRevision: string;
  bindings: readonly SceneResourceBinding[];
  directRelationAllowlist: readonly string[];
  language: string;
};
```

The projector resolves selected nodes from binding identities, then resolves direct outgoing and incoming neighbors for allowlisted predicates. Results are canonicalized by expanded IRI, direction, predicate IRI, and target/source IRI. Presentation order is not reused as graph topology.

The allowlist is versioned configuration. Unsupported or unknown relations are excluded with bounded diagnostics; they are never guessed from labels.

### 4.3 Provenance presentation

A graph node may expose provenance only when the underlying compiled binding or projected RDF statements contain it. The UI distinguishes:

- the resource represented by the node;
- sources that support a displayed definition or statement;
- the authored relation path connecting the scene block to that source.

The graph view must not collapse a source node into the resource node or imply that provenance establishes scientific validity beyond the authored relationship.

## 5. Local exploration state

Exploration state consists only of view mechanics and user navigation choices:

- focused resource;
- expanded resources;
- visited resources;
- selected relation filters;
- optional viewport transform;
- chosen graph representation (`graph` or `graph-summary`).

This state is keyed by `{sceneId, sceneRevision}`. On revision mismatch, the shell performs identity reconciliation:

1. retain identities still present in the new projection;
2. discard identities absent from it;
3. report a concise “scene updated” notice;
4. never apply stale expansion state to a different scene ID.

Default retention is the current browser session only. Persistent local retention, when later implemented, must be opt-in and separately clearable. Canonical RDF and scene definitions cannot be modified through this state model.

A future multi-user or server-backed profile is outside this specification and would require privacy and governance review.

## 6. Accessibility contract

### 6.1 Keyboard and focus

- The view switch is a native button or equivalent accessible control with an explicit current-state label.
- Enter and Space activate the control. No graph operation requires pointer input.
- Opening a graph moves focus to a mode heading, then optionally to the node/list item bound to the active scene block.
- Returning restores focus to the initiating switch control or, when available, the active scene block.
- Escape may return to the presentation only when it does not conflict with an open modal/dialog; this precedence must be tested.
- Graph nodes are traversable in deterministic lexical or authored-neighborhood order, not force-layout screen order.
- Relation expansion, collapse, and return actions are exposed as controls with state (`aria-expanded` where applicable).

### 6.2 Screen readers and non-graph fallback

The graphical view is never the sole representation. The accessible graph summary provides:

- scene title and revision status;
- a “used in current scene” section;
- a “directly related, not yet presented” section;
- resource labels plus stable type and relation descriptions;
- provenance/source links where present;
- deterministic nested or tabular ordering;
- controls for one-hop expansion and return.

The summary uses the same projection document and identity bindings as the visual graph; it is not separately authored content.

### 6.3 Reduced motion and visual semantics

With reduced motion enabled, view transitions and graph rearrangement are immediate or use non-spatial fades. Highlighting cannot depend on color alone; selected versus related status also uses text, shape/border, and accessible names. Zoom level and force motion never alter keyboard order or semantic reading order.

### 6.4 Testable accessibility acceptance points

A first implementation must include automated and manual checks for:

- full keyboard switching and return;
- focus restoration to the original scene context;
- accessible names and current-mode state;
- deterministic summary ordering;
- no pointer-only expansion;
- reduced-motion behavior;
- selected/related distinction without color;
- recovery through the summary when graphical rendering fails.

## 7. Privacy, retention, export, and clear boundaries

No mandatory account, telemetry, analytics, or network service is introduced.

Default behavior:

- exploration state lives in memory for the current tab/session;
- no resource-visitation history is sent to a server;
- no canonical RDF write occurs;
- closing the session discards state.

A later explicit local-persistence option may store only the state fields defined in section 5. It must show its retention scope, provide “clear current scene” and “clear all local exploration data,” and avoid storing rendered prose when stable resource identities suffice.

Export, if implemented, is an explicit user action producing a versioned local JSON document containing contract version, scene ID/revision, resource identities, relation-filter identifiers, and exploration state. It must not claim to be canonical RDF, a scene definition, or evidence of learning. Import must validate version, scene identity, and all resource identities before applying anything; invalid or foreign entries are ignored with diagnostics.

A future semantic scene editor requires a distinct export/write path and explicit authoring confirmation. Exploration export can never be promoted automatically into an authored scene definition.

## 8. Failure modes and recovery

| Failure | Detection | Required behavior |
| --- | --- | --- |
| Scene block lacks RDF identity | Binding validation before projection | Render presentation normally; exclude the block from highlighting; surface bounded diagnostics to developers, not a fabricated mapping. |
| Binding references missing resource | Projection validation | Reject the new projection atomically and keep the prior valid view. |
| Ambiguous or duplicate identity | Canonicalization/uniqueness validation | Reject atomically; do not pick the first label or node. |
| Blank-node identity without deterministic skolem IRI | Binding validation | Reject cross-view mapping for that block. |
| Scene snapshot is stale | `sceneRevision` mismatch | Recompile/reproject, reconcile by identity, announce update, discard incompatible local state. |
| Unsupported relation | Allowlist validation | Omit relation with bounded diagnostic; do not infer a substitute. |
| Missing localized label | Projection validation | Use an explicit stable IRI/type fallback in the summary; do not silently choose another language unless the language policy authorizes it. |
| Graph projection error | Projector result | Keep presentation visible; offer accessible summary only if a valid projection document exists. |
| Visual graph adapter error | Adapter boundary | Switch to the accessible summary using the same valid projection document. |
| Local state cannot be parsed/imported | Versioned schema validation | Ignore invalid state, start clean, and offer a clear-data action. |
| Focus target disappeared after scene update | Identity reconciliation | Focus the mode heading, explain that the scene changed, and preserve keyboard operability. |
| Canonical store/network unavailable in a later Fuseki phase | Data-access boundary | Use an already validated local snapshot where policy permits; otherwise keep current presentation and report unavailable graph data. No partial canonical write. |

Failures in graphical layout are adapter failures, not semantic projection failures. They must not invalidate a valid `SceneDocument` or mutate the source graph.

## 9. Future semantic scene editor boundary

The future editor selects RDF resources, relations, ordering, and communicative roles. It does not edit Reveal.js HTML or compiled `SceneDocument` JSON as authoritative content.

Required flow:

```text
canonical RDF (read)
      +
separate validated draft graph
      |
      v
SHACL + deterministic compiler preview
      |
      v
explicit authoring commit/review gate
      |
      v
canonical scene-definition update
```

Editor drafts remain separate from exploration state. Promoting a draft requires validation and an explicit authoring action. Breaking ontology changes, publication, legal/privacy decisions, and accepted-requirement changes remain human-gated.

## 10. Staged implementation plan

Each stage is a separately governable issue and pull request.

### Stage 1 — Renderer-neutral binding and shell-state contracts

**First implementation increment.** Define TypeScript contracts and pure validation/canonicalization helpers for `SceneResourceBinding`, `SceneGraphProjectionRequest`, and `ViewSwitchState`. Extend compiler output only where necessary to expose existing RDF identities and relation paths; do not add UI or D3. Add tests for lexical canonicalization, missing identities, duplicate identities, revision-keyed state, and no-network behavior.

Dependencies: accepted #43–#45 contracts. Specialist review: Backend/Data Integration plus Accessibility review of state semantics.

### Stage 2 — Pure one-hop scene graph projector

Produce a deterministic renderer-neutral projection from the logical RDF dataset, scene bindings, and relation allowlist. Add selected/related classifications, provenance edges, stable ordering, invalid-input rejection, and parity with the accessible summary model. No DOM, React, D3, or force layout.

Dependencies: Stage 1 and existing knowledge-network projection contracts where reusable.

### Stage 3 — Accessible graph summary and shell switching

Implement the non-visual summary first, together with presentation cursor preservation and focus restoration. Keep Reveal.js behind its adapter. Add keyboard, screen-reader, reduced-motion, stale-revision, and failure-recovery tests.

Dependencies: Stages 1–2. Specialist review: Accessibility and Privacy/Data Protection.

### Stage 4 — Optional visual graph adapter

Render the same projection document visually. Adapter owns coordinates, zoom, animation, and DOM lifecycle. Summary remains available and authoritative for non-visual access. Add no-color-only and adapter-failure fallback tests.

Dependencies: Stage 3 and accepted D3 adapter boundary. Specialist review: Frontend/Graph Visualization and Accessibility.

### Stage 5 — Explicit local retention and export

Add opt-in persistence, clear controls, versioned export/import, and privacy documentation. No account or telemetry.

Dependencies: stable state contract from Stage 1 and human/specialist privacy review.

### Stage 6 — Semantic scene-editor design and bounded prototype

Specify a separate draft graph, SHACL feedback, deterministic preview, and explicit promotion gate before any implementation. Do not reuse exploration state as an authoring draft.

Dependencies: authoring workflow, typed query layer, and explicit governance decisions in Phase 3.

## 11. Decision points requiring later review

The following remain intentionally undecided:

- exact relation allowlist and user-facing relation labels — Semantic Web/chemistry subject-matter review;
- whether deterministic skolemization is permitted and its namespace/versioning policy — ontology governance review;
- persistence duration and whether local persistence is enabled by default — privacy review and human product decision;
- graph visual layout and interaction vocabulary — frontend/accessibility review;
- editor draft storage and promotion workflow — architecture, ontology, and human governance review;
- whether source/provenance details are expanded by default — instructional-design and accessibility review;
- behavior when a later remote canonical store is unavailable — deployment/offline product decision.

No decision in this document authorizes publication, telemetry, mandatory accounts, canonical RDF mutation from exploration, ontology changes, or claims of pedagogical effectiveness.

## 12. Architecture invariants and review checklist

A later implementation is conformant only when all statements below remain true:

- RDF and graph-backed scene definitions are canonical; compiled documents are disposable snapshots.
- `SceneDocument` and graph projection contracts contain no Reveal.js, React, D3, DOM, or force-layout concepts.
- Scene-to-graph mapping uses expanded RDF identities and explicit provenance, never labels or visual indices.
- Presentation layout stays renderer-owned.
- Exploration state is revision-keyed, local, clearable, and incapable of silently mutating canonical RDF.
- The accessible summary uses the same projection document as the visual graph.
- A visual graph failure cannot destroy the presentation or block the non-graph fallback.
- Switching and return are keyboard-operable with deterministic focus restoration.
- No mandatory network, account, or telemetry dependency is introduced.
- The future editor authors validated graph-backed scene definitions and never becomes a second content store.
