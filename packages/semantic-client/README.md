# Semantic client

`packages/semantic-client` is the renderer-neutral read-only semantic-query boundary introduced in Phase 3.

Current responsibilities:

- typed SPARQL SELECT query construction and result decoding;
- a small HTTP transport for a Fuseki-compatible SPARQL endpoint;
- deterministic typed lookup of canonical resources;
- deterministic Standardabweichung path/scene lookup;
- named-graph-aware provenance lookup.

The package does **not** own semantic content. `ontology/dataset/*.trig` remains the sole authored semantic authority. The local Fuseki service is a derived query view over a deterministic snapshot produced from that Dataset.

No SPARQL Update or browser integration is provided in this foundation increment.

Run the unit tests without Fuseki:

```powershell
npm run test:semantic-client
```

Run the opt-in local-service preflight after preparing/loading/starting Fuseki:

```powershell
npm run fuseki:check
```

The default query endpoint is:

```text
http://127.0.0.1:3030/chemie-digital/query
```

For a deliberately different local endpoint, set `CHEMIE_DIGITAL_SPARQL_ENDPOINT` for the preflight process.
