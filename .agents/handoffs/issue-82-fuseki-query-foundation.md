# Issue #82 handoff — local Fuseki and typed SPARQL foundation

## Worker scope

Role: Backend and Data Integration Engineer.

Branch:

```text
agent/82-fuseki-query-foundation
```

This increment implements Phase 3 backlog item 32 as a bounded read-only foundation. It does not migrate presentation/runtime code to Fuseki.

## Implemented boundary

### Canonical Dataset stays authoritative

No TriG or SHACL content was modified.

`scripts/fuseki_local.py load` calls the existing `scripts/rdf_dataset.py::assemble_dataset()` and writes `canonical_nquads(dataset)`. The generated snapshot therefore comes from the same logical canonical Dataset and preserves named graph identities.

Generated Fuseki runtime/snapshot state is under `.local/` and ignored by git.

### Pinned local Fuseki

Pinned runtime:

```text
Apache Jena Fuseki 6.2.0
```

Pinned archive:

```text
https://archive.apache.org/dist/jena/binaries/apache-jena-fuseki-6.2.0.zip
```

Published SHA-512 pinned in the preparation script:

```text
46e5d798faf80fe5f4b32318750071b9172315f9d86bb3aa3ba4d5e94abe2e21cd194eab349d491a203c934c6e59b370a671b338f2a413110e859dc628ffe934
```

The explicit `fuseki:prepare` command is the only path that downloads the runtime. Ordinary project validation does not call it.

Startup uses Java 21+ and the no-admin-UI command class:

```text
org.apache.jena.fuseki.main.cmds.FusekiMainCmd
```

with:

```text
--localhost
--port=3030
--file=<generated canonical N-Quads snapshot>
/chemie-digital
```

No `--update` flag is supplied.

### Typed query layer

`packages/semantic-client/src/index.mts` adds:

- `FusekiHttpTransport`;
- `SemanticQueryClient.resource(id)`;
- `SemanticQueryClient.standardDeviationPath()`;
- `SemanticQueryClient.provenance(id)`;
- typed RDF terms/resources/path steps/named-graph statements;
- deterministic read-only SPARQL query builders.

`packages/semantic-client/src/preflight.mts` is an opt-in integration/preflight check against:

```text
http://127.0.0.1:3030/chemie-digital/query
```

It verifies the canonical Standardabweichung resource, all nine path steps and the specification named-graph provenance.

No browser/Reveal code imports this package.

## Deterministic automated coverage

Added `packages/semantic-client/test/semantic-query-client.test.mts` covering:

1. read-only query construction and explicit named graph boundary;
2. unsafe/non-HTTP IRI rejection;
3. typed multilingual resource decoding;
4. deterministic ordered Standardabweichung path decoding;
5. named-graph provenance decoding;
6. HTTP SPARQL POST/result-envelope behavior.

Added `tests/test_fuseki_local.py` covering:

1. pinned Fuseki release and checksum metadata;
2. localhost/no-update server command;
3. canonical snapshot creation;
4. preservation of Standardabweichung specification/path named graph IRIs.

Root `npm test` now includes the semantic-client unit tests but still does not require Fuseki to be prepared or running.

## Worker-side checks performed

The standalone semantic-client tests were executed in Node 22 with type stripping:

```text
5 tests passed
```

Python sources were syntax-compiled successfully.

No claim is made here for the repository-wide authoritative `npm test`; the installed exact-head validator remains the merge gate.

## Owner/local service check still required after exact-head validator success

While online once:

```powershell
npm run fuseki:prepare
npm run fuseki:load
```

Then, without requiring public Internet:

Terminal 1:

```powershell
npm run fuseki:doctor
npm run fuseki:start
```

Terminal 2:

```powershell
npm run fuseki:check
```

Expected: typed preflight succeeds, finds nine Standardabweichung path steps and reports preserved named-graph provenance.

Stop Fuseki with `Ctrl+C`.

## Explicit non-goals preserved

Not implemented:

- SPARQL Update;
- authoring/editor workflows;
- semantic writes to Fuseki;
- browser live queries;
- self-study renderer;
- learner state;
- accounts/analytics;
- remote/shared Fuseki.
