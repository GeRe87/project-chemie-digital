import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_SPARQL_ENDPOINT,
  FusekiHttpTransport,
  SemanticQueryClient,
  STANDARD_DEVIATION_PATH,
  STANDARD_DEVIATION_PATH_GRAPH,
  STANDARD_DEVIATION_RESOURCE,
  STANDARD_DEVIATION_SPEC_GRAPH,
  provenanceQuery,
  resourceQuery,
  standardDeviationPathQuery,
  type SparqlSelectResults,
  type SparqlSelectTransport,
} from "../src/index.mts";

class QueueTransport implements SparqlSelectTransport {
  readonly queries: string[] = [];
  readonly #responses: SparqlSelectResults[];

  constructor(responses: SparqlSelectResults[]) {
    this.#responses = [...responses];
  }

  async select(query: string): Promise<SparqlSelectResults> {
    this.queries.push(query);
    const response = this.#responses.shift();
    if (!response) throw new Error("Unexpected query");
    return response;
  }
}

function results(
  bindings: SparqlSelectResults["results"]["bindings"],
): SparqlSelectResults {
  return { head: { vars: [] }, results: { bindings } };
}

test("queries are read-only and preserve explicit named-graph boundaries", () => {
  const pathQuery = standardDeviationPathQuery();
  assert.match(pathQuery, new RegExp(`GRAPH <${STANDARD_DEVIATION_PATH_GRAPH}>`));
  assert.match(pathQuery, new RegExp(`<${STANDARD_DEVIATION_PATH}>`));
  assert.doesNotMatch(pathQuery, /\b(?:INSERT|DELETE|LOAD|CLEAR|CREATE|DROP|MOVE|COPY|ADD|WITH)\b/i);

  const provenance = provenanceQuery(STANDARD_DEVIATION_RESOURCE);
  assert.match(provenance, /GRAPH \?graph/);
  assert.match(provenance, new RegExp(`<${STANDARD_DEVIATION_RESOURCE}>`));

  assert.throws(
    () => resourceQuery("file:///tmp/not-allowed"),
    /Only absolute HTTP\(S\) IRIs/,
  );
});

test("typed resource decoding deduplicates types and multilingual labels", async () => {
  const transport = new QueueTransport([
    results([
      {
        type: { type: "uri", value: "https://w3id.org/project-chemie-digital/ontology/Concept" },
        label: { type: "literal", value: "Standardabweichung", "xml:lang": "de" },
      },
      {
        type: { type: "uri", value: "https://w3id.org/project-chemie-digital/ontology/Concept" },
        label: { type: "literal", value: "standard deviation", "xml:lang": "en" },
      },
    ]),
  ]);
  const client = new SemanticQueryClient(transport);
  const resource = await client.resource(STANDARD_DEVIATION_RESOURCE);

  assert.deepEqual(resource, {
    id: STANDARD_DEVIATION_RESOURCE,
    types: ["https://w3id.org/project-chemie-digital/ontology/Concept"],
    labels: [
      { value: "Standardabweichung", language: "de" },
      { value: "standard deviation", language: "en" },
    ],
  });
  assert.equal(transport.queries.length, 1);
});

test("standard deviation path decoding is deterministic and typed", async () => {
  const transport = new QueueTransport([
    results([
      {
        step: { type: "uri", value: "https://w3id.org/project-chemie-digital/resource/path-step-2" },
        position: { type: "literal", value: "2", datatype: "http://www.w3.org/2001/XMLSchema#integer" },
        scene: { type: "uri", value: "https://w3id.org/project-chemie-digital/resource/scene-sd-process" },
      },
      {
        step: { type: "uri", value: "https://w3id.org/project-chemie-digital/resource/path-step-1" },
        position: { type: "literal", value: "1", datatype: "http://www.w3.org/2001/XMLSchema#integer" },
        scene: { type: "uri", value: "https://w3id.org/project-chemie-digital/resource/scene-sd-definition" },
      },
    ]),
  ]);
  const client = new SemanticQueryClient(transport);
  const path = await client.standardDeviationPath();

  assert.equal(path.id, STANDARD_DEVIATION_PATH);
  assert.equal(path.graphId, STANDARD_DEVIATION_PATH_GRAPH);
  assert.deepEqual(path.steps.map((step) => step.position), [1, 2]);
  assert.deepEqual(path.steps.map((step) => step.sceneId), [
    "https://w3id.org/project-chemie-digital/resource/scene-sd-definition",
    "https://w3id.org/project-chemie-digital/resource/scene-sd-process",
  ]);
});

test("provenance decoding exposes named graph identity instead of flattening it", async () => {
  const transport = new QueueTransport([
    results([
      {
        graph: { type: "uri", value: STANDARD_DEVIATION_SPEC_GRAPH },
        predicate: {
          type: "uri",
          value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        },
        object: {
          type: "uri",
          value: "https://w3id.org/project-chemie-digital/ontology/Concept",
        },
      },
      {
        graph: { type: "uri", value: STANDARD_DEVIATION_SPEC_GRAPH },
        predicate: {
          type: "uri",
          value: "http://www.w3.org/2004/02/skos/core#prefLabel",
        },
        object: { type: "literal", value: "Standardabweichung", "xml:lang": "de" },
      },
    ]),
  ]);
  const client = new SemanticQueryClient(transport);
  const provenance = await client.provenance(STANDARD_DEVIATION_RESOURCE);

  assert.equal(provenance.length, 2);
  assert.equal(provenance[0]?.graphId, STANDARD_DEVIATION_SPEC_GRAPH);
  assert.deepEqual(provenance[1]?.object, {
    kind: "literal",
    value: "Standardabweichung",
    language: "de",
  });
});

test("HTTP transport posts SPARQL SELECT and validates the JSON result envelope", async () => {
  let seenUrl = "";
  let seenInit: RequestInit | undefined;
  const fakeFetch = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    seenUrl = String(input);
    seenInit = init;
    return new Response(JSON.stringify(results([])), {
      status: 200,
      headers: { "content-type": "application/sparql-results+json" },
    });
  };

  const transport = new FusekiHttpTransport(DEFAULT_SPARQL_ENDPOINT, fakeFetch);
  await transport.select("SELECT * WHERE { ?s ?p ?o } LIMIT 1");

  assert.equal(seenUrl, DEFAULT_SPARQL_ENDPOINT);
  assert.equal(seenInit?.method, "POST");
  assert.match(String(seenInit?.body), /^query=/);
  assert.equal(
    (seenInit?.headers as Record<string, string>)?.accept,
    "application/sparql-results+json",
  );
});
