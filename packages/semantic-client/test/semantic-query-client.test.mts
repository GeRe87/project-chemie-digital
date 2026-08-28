import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_SPARQL_ENDPOINT,
  DIGITAL_CHEMISTRY_TEACHING_OFFERING,
  FusekiHttpTransport,
  SemanticQueryClient,
  STANDARD_DEVIATION_PATH,
  STANDARD_DEVIATION_PATH_GRAPH,
  STANDARD_DEVIATION_RESOURCE,
  STANDARD_DEVIATION_SPEC_GRAPH,
  provenanceQuery,
  resourceQuery,
  standardDeviationPathQuery,
  teachingOfferingCompositionQuery,
  type SparqlBindingValue,
  type SparqlSelectResults,
  type SparqlSelectTransport,
} from "../src/index.mts";

const COURSE_GRAPH = "https://w3id.org/project-chemie-digital/graph/specifications/course-scale";
const PLACEMENT_A = "https://w3id.org/project-chemie-digital/resource/unit-placement-a";
const PLACEMENT_B = "https://w3id.org/project-chemie-digital/resource/unit-placement-b";
const UNIT_A = "https://w3id.org/project-chemie-digital/resource/learning-unit-a";
const UNIT_B = "https://w3id.org/project-chemie-digital/resource/learning-unit-b";
const PATH_A = "https://w3id.org/project-chemie-digital/resource/path-a";
const PATH_B = "https://w3id.org/project-chemie-digital/resource/path-b";
const PATH_GRAPH_A = "https://w3id.org/project-chemie-digital/graph/paths/a";
const PATH_GRAPH_B = "https://w3id.org/project-chemie-digital/graph/paths/b";

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

function uri(value: string): SparqlBindingValue {
  return { type: "uri", value };
}

function integer(value: string): SparqlBindingValue {
  return {
    type: "literal",
    value,
    datatype: "http://www.w3.org/2001/XMLSchema#integer",
  };
}

function courseRow({
  placement = PLACEMENT_A,
  position = "10",
  unit = UNIT_A,
  path,
  pathGraph,
  offering = DIGITAL_CHEMISTRY_TEACHING_OFFERING,
  offeringGraph = COURSE_GRAPH,
}: {
  placement?: string;
  position?: string;
  unit?: string;
  path?: string;
  pathGraph?: string;
  offering?: string;
  offeringGraph?: string;
} = {}): Readonly<Record<string, SparqlBindingValue>> {
  return {
    offering: uri(offering),
    offeringGraph: uri(offeringGraph),
    placement: uri(placement),
    position: integer(position),
    unit: uri(unit),
    ...(path ? { path: uri(path) } : {}),
    ...(pathGraph ? { pathGraph: uri(pathGraph) } : {}),
  };
}

test("queries are read-only and preserve explicit named-graph boundaries", () => {
  const pathQuery = standardDeviationPathQuery();
  assert.match(pathQuery, new RegExp(`GRAPH <${STANDARD_DEVIATION_PATH_GRAPH}>`));
  assert.match(pathQuery, new RegExp(`<${STANDARD_DEVIATION_PATH}>`));
  assert.doesNotMatch(pathQuery, /\b(?:INSERT|DELETE|LOAD|CLEAR|CREATE|DROP|MOVE|COPY|ADD|WITH)\b/i);

  const courseQuery = teachingOfferingCompositionQuery(DIGITAL_CHEMISTRY_TEACHING_OFFERING);
  assert.match(courseQuery, /GRAPH \?offeringGraph/);
  assert.match(courseQuery, /GRAPH \?pathGraph/);
  assert.match(courseQuery, /hasUnitPlacement/);
  assert.match(courseQuery, /placesLearningUnit/);
  assert.match(courseQuery, /forLearningUnit/);
  assert.doesNotMatch(courseQuery, /\b(?:INSERT|DELETE|LOAD|CLEAR|CREATE|DROP|MOVE|COPY|ADD|WITH)\b/i);

  const provenance = provenanceQuery(STANDARD_DEVIATION_RESOURCE);
  assert.match(provenance, /GRAPH \?graph/);
  assert.match(provenance, new RegExp(`<${STANDARD_DEVIATION_RESOURCE}>`));

  assert.throws(
    () => resourceQuery("file:///tmp/not-allowed"),
    /Only absolute HTTP\(S\) IRIs/,
  );
  assert.throws(
    () => teachingOfferingCompositionQuery("file:///tmp/not-allowed"),
    /Only absolute HTTP\(S\) IRIs/,
  );
  assert.throws(
    () => teachingOfferingCompositionQuery("https://user:secret@example.test/offering"),
    /credentials are not supported/,
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
        position: integer("2"),
        scene: { type: "uri", value: "https://w3id.org/project-chemie-digital/resource/scene-sd-process" },
      },
      {
        step: { type: "uri", value: "https://w3id.org/project-chemie-digital/resource/path-step-1" },
        position: integer("1"),
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

test("course-scale decoding is deterministic across shuffled rows and repeated paths", async () => {
  const transport = new QueueTransport([
    results([
      courseRow({
        placement: PLACEMENT_B,
        position: "20",
        unit: UNIT_B,
        path: PATH_B,
        pathGraph: PATH_GRAPH_B,
      }),
      courseRow({ path: PATH_B, pathGraph: PATH_GRAPH_B }),
      courseRow({ path: PATH_A, pathGraph: PATH_GRAPH_A }),
      courseRow({ path: PATH_A, pathGraph: PATH_GRAPH_A }),
    ]),
  ]);
  const client = new SemanticQueryClient(transport);
  const composition = await client.teachingOfferingComposition(
    DIGITAL_CHEMISTRY_TEACHING_OFFERING,
  );

  assert.deepEqual(composition, {
    id: DIGITAL_CHEMISTRY_TEACHING_OFFERING,
    graphId: COURSE_GRAPH,
    placements: [
      {
        id: PLACEMENT_A,
        position: 10,
        unitId: UNIT_A,
        paths: [
          { id: PATH_A, graphId: PATH_GRAPH_A },
          { id: PATH_B, graphId: PATH_GRAPH_B },
        ],
      },
      {
        id: PLACEMENT_B,
        position: 20,
        unitId: UNIT_B,
        paths: [{ id: PATH_B, graphId: PATH_GRAPH_B }],
      },
    ],
  });
});

test("course-scale decoding supports a unit with no available path and returns null when absent", async () => {
  const transport = new QueueTransport([
    results([courseRow()]),
    results([]),
  ]);
  const client = new SemanticQueryClient(transport);

  const composition = await client.teachingOfferingComposition(
    DIGITAL_CHEMISTRY_TEACHING_OFFERING,
  );
  assert.deepEqual(composition?.placements[0]?.paths, []);
  assert.equal(
    await client.teachingOfferingComposition(DIGITAL_CHEMISTRY_TEACHING_OFFERING),
    null,
  );
});

test("course-scale decoding rejects invalid positive-integer positions", async () => {
  for (const value of ["0", "-1", "1.5", "9007199254740992"]) {
    const client = new SemanticQueryClient(
      new QueueTransport([results([courseRow({ position: value })])]),
    );
    await assert.rejects(
      client.teachingOfferingComposition(DIGITAL_CHEMISTRY_TEACHING_OFFERING),
      new RegExp(`Invalid position: ${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`),
    );
  }
});

test("course-scale decoding rejects contradictory rows for one placement", async () => {
  const unitConflict = new SemanticQueryClient(
    new QueueTransport([
      results([
        courseRow({ unit: UNIT_A }),
        courseRow({ unit: UNIT_B }),
      ]),
    ]),
  );
  await assert.rejects(
    unitConflict.teachingOfferingComposition(DIGITAL_CHEMISTRY_TEACHING_OFFERING),
    /Contradictory rows for unit placement/,
  );

  const positionConflict = new SemanticQueryClient(
    new QueueTransport([
      results([
        courseRow({ position: "10" }),
        courseRow({ position: "20" }),
      ]),
    ]),
  );
  await assert.rejects(
    positionConflict.teachingOfferingComposition(DIGITAL_CHEMISTRY_TEACHING_OFFERING),
    /Contradictory rows for unit placement/,
  );
});

test("course-scale decoding rejects duplicate positions across placements", async () => {
  const client = new SemanticQueryClient(
    new QueueTransport([
      results([
        courseRow(),
        courseRow({ placement: PLACEMENT_B, position: "10", unit: UNIT_B }),
      ]),
    ]),
  );

  await assert.rejects(
    client.teachingOfferingComposition(DIGITAL_CHEMISTRY_TEACHING_OFFERING),
    /Duplicate teaching-offering placement position 10/,
  );
});

test("course-scale decoding preserves and validates named-graph bindings", async () => {
  const splitOfferingGraphs = new SemanticQueryClient(
    new QueueTransport([
      results([
        courseRow(),
        courseRow({
          placement: PLACEMENT_B,
          position: "20",
          unit: UNIT_B,
          offeringGraph: "https://w3id.org/project-chemie-digital/graph/specifications/other",
        }),
      ]),
    ]),
  );
  await assert.rejects(
    splitOfferingGraphs.teachingOfferingComposition(DIGITAL_CHEMISTRY_TEACHING_OFFERING),
    /spans multiple named graphs/,
  );

  const partialPathBinding = new SemanticQueryClient(
    new QueueTransport([results([courseRow({ path: PATH_A })])]),
  );
  await assert.rejects(
    partialPathBinding.teachingOfferingComposition(DIGITAL_CHEMISTRY_TEACHING_OFFERING),
    /must bind \?path and \?pathGraph together/,
  );
});

test("course-scale decoding rejects unexpected or non-IRI identity bindings", async () => {
  const unexpectedOffering = new SemanticQueryClient(
    new QueueTransport([
      results([
        courseRow({ offering: "https://w3id.org/project-chemie-digital/resource/other-offering" }),
      ]),
    ]),
  );
  await assert.rejects(
    unexpectedOffering.teachingOfferingComposition(DIGITAL_CHEMISTRY_TEACHING_OFFERING),
    /unexpected teaching offering/,
  );

  const malformedPlacement = courseRow() as Record<string, SparqlBindingValue>;
  malformedPlacement.placement = { type: "literal", value: PLACEMENT_A };
  const invalidIdentity = new SemanticQueryClient(
    new QueueTransport([results([malformedPlacement])]),
  );
  await assert.rejects(
    invalidIdentity.teachingOfferingComposition(DIGITAL_CHEMISTRY_TEACHING_OFFERING),
    /binding \?placement must be an IRI/,
  );
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
