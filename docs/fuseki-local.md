# Local Fuseki and typed SPARQL foundation

Phase 3 adds a local Apache Jena Fuseki query boundary without changing the semantic source of truth or the existing compiler/presentation path.

## Architectural boundary

The authority remains:

```text
ontology/dataset/*.trig
        ↓
deterministic Dataset assembly + SHACL validation
        ↓
existing file-based compilers/renderers
```

The new optional query path is derived from the same Dataset:

```text
ontology/dataset/*.trig
        ↓
scripts/rdf_dataset.py::assemble_dataset()
        ↓
deterministic canonical N-Quads snapshot
        ↓
localhost-only read-only Fuseki
        ↓
packages/semantic-client typed SPARQL client
```

Fuseki is not an authored content store. Stopping or deleting the local Fuseki cache must not affect `npm test`, canonical runtime generation, Reveal, D3, webR or poll behavior.

## Pinned local runtime

This foundation pins:

```text
Apache Jena Fuseki 6.2.0
Java 21+
```

The distribution archive is fetched only by the explicit prepare command. The repository verifies the published SHA-512 before extraction.

Generated files live under:

```text
.local/fuseki/
```

and are excluded from git.

The server is started with `org.apache.jena.fuseki.main.cmds.FusekiMainCmd`, `--localhost`, and no `--update`. This keeps the service localhost-only and exposes SPARQL query services without the Fuseki admin UI or SPARQL Update capability.

## 1. Prerequisites

Normal project prerequisites still apply:

```powershell
npm ci
python -m pip install -r requirements-dev.txt
```

Fuseki additionally requires Java 21 or newer:

```powershell
java -version
```

## 2. Prepare Fuseki while online

This is the only normal Fuseki step that downloads a public runtime:

```powershell
npm run fuseki:prepare
```

To force a clean re-download and checksum verification:

```powershell
npm run fuseki:prepare -- --force
```

Normal `npm test`, `fuseki:load`, `fuseki:doctor`, `fuseki:start` and `fuseki:check` do not install or download Fuseki.

## 3. Load the canonical Dataset

Generate the deterministic local N-Quads snapshot:

```powershell
npm run fuseki:load
```

This does **not** read from a second semantic source. It calls the same canonical Dataset assembly used by validation and serializes canonical N-Quads so named graph IRIs survive unchanged.

Expected generated files:

```text
.local/fuseki/canonical-dataset.nq
.local/fuseki/canonical-dataset.sha256
```

The SHA-256 printed by the command is the repository Dataset fingerprint, not a new semantic identifier.

## 4. Network-free local doctor

Before starting:

```powershell
npm run fuseki:doctor
```

This checks the prepared pinned archive, Java version and canonical snapshot without public network access.

## 5. Start read-only Fuseki

In a dedicated terminal:

```powershell
npm run fuseki:start
```

The process is intentionally foreground/blocking. The service is bound to localhost and loads the canonical snapshot read-only.

Dataset URL:

```text
http://127.0.0.1:3030/chemie-digital
```

SPARQL query endpoint:

```text
http://127.0.0.1:3030/chemie-digital/query
```

No `--update` endpoint is enabled by the repository startup command.

## 6. Typed SPARQL preflight

In another terminal:

```powershell
npm run fuseki:check
```

The preflight uses `packages/semantic-client` rather than raw `curl` parsing. It verifies all of the following against the live local service:

- `ex:standard-deviation` resolves as a typed canonical resource;
- the canonical Standardabweichung learning path resolves to nine ordered scene steps;
- statements for `ex:standard-deviation` retain the named graph
  `https://w3id.org/project-chemie-digital/graph/specifications/standard-deviation`.

The typed query layer currently exposes:

```ts
resource(id)
standardDeviationPath()
provenance(id)
```

and returns domain/query-oriented objects rather than raw SPARQL JSON bindings.

## 7. Stop

Stop the foreground Fuseki process with:

```text
Ctrl+C
```

No cleanup is required for the rest of the project. Fuseki may remain absent/stopped during normal compiler and presentation work.

To remove the generated local service/cache entirely, delete:

```text
.local/fuseki/
```

and re-run `fuseki:prepare` plus `fuseki:load` when needed.

## 8. Test boundary

The authoritative project command remains:

```powershell
npm test
```

It includes deterministic semantic-client unit tests and Fuseki snapshot/command tests, but **does not require a running Fuseki service**.

The live service check is deliberately opt-in:

```powershell
npm run fuseki:check
```

This separation prevents Phase 3 from introducing hidden network/service dependencies into the deterministic compiler pipeline.

## Out of scope for this increment

- SPARQL Update or mutation APIs;
- semantic authoring UI/workflow;
- replacing canonical TriG with Fuseki persistence;
- browser/Reveal runtime queries to Fuseki;
- self-study renderer;
- learner-state persistence/export;
- accounts, analytics or personalization;
- shared/remote Fuseki deployment.
