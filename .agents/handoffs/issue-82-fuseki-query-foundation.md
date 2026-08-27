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

## Owner-reproduced N-Quads defect and bounded repair

The first owner service gate on validated PR head
`f404f06a431ccc2d62e2acb220bb59eadafb2b50` reached Fuseki 6.2.0 successfully but failed while Jena RIOT parsed the generated snapshot:

```text
Triple quoted string not permitted: [STRING:x <- c(6, 8, 10)
sd(x)]
```

Root cause: `scripts/rdf_dataset.py::canonical_nquads()` manually composed N-Quads with RDFLib `term.n3()`. For multiline RDF literals, `Literal.n3()` may choose Turtle/TriG `"""..."""` long-string syntax, which is not valid N-Quads.

The repair keeps the same deterministic graph canonicalization and ordering but adds an explicit N-Quads term serializer:

- literals always use short quoted N-Quads syntax;
- newline, carriage return, tab, backspace, form feed, quote and backslash characters are escaped;
- other C0/DEL control characters use `\\uXXXX`;
- language tags and datatype IRIs are preserved;
- URIRefs and canonical blank nodes retain RDFLib N3 term encoding;
- no semantic source, graph identity or presentation/runtime code changed.

## Deterministic automated coverage

Added `packages/semantic-client/test/semantic-query-client.test.mts` covering:

1. read-only query construction and explicit named graph boundary;
2. unsafe/non-HTTP IRI rejection;
3. typed multilingual resource decoding;
4. deterministic ordered Standardabweichung path decoding;
5. named-graph provenance decoding;
6. HTTP SPARQL POST/result-envelope behavior.

`tests/test_fuseki_local.py` now covers:

1. pinned Fuseki release and checksum metadata;
2. localhost/no-update server command;
3. canonical snapshot creation;
4. preservation of Standardabweichung specification/path named graph IRIs;
5. full generated snapshot parse as `nquads`;
6. the actual multiline R literal `x <- c(6, 8, 10)\nsd(x)` serialized with escaped newline rather than triple quotes;
7. roundtrip preservation of quad count, populated named-graph identities and the R literal in its specification graph.

`tests/test_rdf_dataset.py` additionally exercises language-tagged and datatype literals containing newline, quote and backslash characters through serialize/parse roundtrip.

Root `npm test` includes these deterministic tests but still does not require Fuseki to be prepared or running.

## Worker-side checks performed

Before the owner-discovered serializer defect, the standalone semantic-client tests were executed in Node 22 with type stripping:

```text
5 tests passed
```

Python sources were syntax-compiled successfully.

For the repair, the serializer algorithm and representative language/datatype/multiline roundtrips were independently exercised against RDFLib's N-Quads parser. No claim is made for the repository-wide authoritative `npm test`; the installed exact-head validator must rerun on the repaired final head.

## Owner/local service retest required after repaired exact-head validator success

The old `.local/fuseki/canonical-dataset.nq` was generated by the defective head. After pulling the repaired branch, regenerate it before restart:

```powershell
npm run fuseki:load
npm run fuseki:doctor
```

The Fuseki 6.2.0 download itself does not need to be repeated if `fuseki:prepare` already succeeded.

Then:

Terminal 1:

```powershell
npm run fuseki:start
```

Terminal 2:

```powershell
npm run fuseki:check
```

Expected: Fuseki loads the snapshot without RIOT parse errors; typed preflight succeeds, finds nine Standardabweichung path steps and reports preserved named-graph provenance.

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
