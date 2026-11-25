import {
  DEFAULT_SPARQL_ENDPOINT,
  DIGITAL_CHEMISTRY_TEACHING_OFFERING,
  FusekiHttpTransport,
  SemanticQueryClient,
  STANDARD_DEVIATION_PATH,
  STANDARD_DEVIATION_PATH_GRAPH,
  STANDARD_DEVIATION_RESOURCE,
  STANDARD_DEVIATION_SPEC_GRAPH,
} from "./index.mts";

const CD_CONCEPT = "https://w3id.org/project-chemie-digital/ontology/Concept";
const COURSE_SCALE_SPEC_GRAPH = "https://w3id.org/project-chemie-digital/graph/specifications/course-scale";
const STANDARD_DEVIATION_UNIT = "https://w3id.org/project-chemie-digital/resource/learning-unit-standard-deviation";
const STANDARD_DEVIATION_PLACEMENT = "https://w3id.org/project-chemie-digital/resource/unit-placement-standard-deviation";

type Profile = "chemometrics" | "talks";

interface SparqlAskResults {
  readonly boolean: boolean;
}

const TALKS_QUERY = "ASK { GRAPH <https://w3id.org/project-chemie-digital/graph/scenes/talks-ted-thanks> { <https://w3id.org/project-chemie-digital/resource/ted-scene-thanks> a <https://w3id.org/project-chemie-digital/ontology/SceneDefinition> . } }";

function profileFromArgs(args: readonly string[]): Profile {
  if (args.length === 0) return "chemometrics";
  if (
    args.length === 2 && args[0] === "--profile" &&
    (args[1] === "talks" || args[1] === "chemometrics")
  ) return args[1];
  throw new Error("Usage: fuseki:check [--profile talks|chemometrics]");
}

function assertAskResults(value: unknown): asserts value is SparqlAskResults {
  if (
    value === null || typeof value !== "object" || Array.isArray(value) ||
    !("boolean" in value) || typeof value.boolean !== "boolean"
  ) {
    throw new Error("Fuseki returned malformed SPARQL ASK JSON: expected an object with a boolean field");
  }
}

async function talksPreflight(endpoint: string): Promise<void> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      accept: "application/sparql-results+json",
      "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body: new URLSearchParams({ query: TALKS_QUERY }).toString(),
  });
  if (!response.ok) {
    throw new Error(`Fuseki Talks ASK failed with HTTP ${response.status}`);
  }
  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new Error("Fuseki returned invalid JSON for Talks ASK");
  }
  assertAskResults(json);
  if (!json.boolean) {
    throw new Error("Talks profile proof failed: ASK returned false for the canonical thanks scene");
  }
  console.log(`Fuseki typed preflight succeeded: ${endpoint}`);
  console.log("Profile: talks; reachability: confirmed");
}

async function main(): Promise<void> {
  const profile = profileFromArgs(process.argv.slice(2));
  const endpoint = process.env.CHEMIE_DIGITAL_SPARQL_ENDPOINT ?? DEFAULT_SPARQL_ENDPOINT;
  // Reuse the SELECT transport's HTTP(S)/no-credentials validation without sending SELECT.
  const transport = new FusekiHttpTransport(endpoint);
  if (profile === "talks") {
    await talksPreflight(transport.endpoint);
    return;
  }
  await chemometricsPreflight(new SemanticQueryClient(transport), endpoint);
}

async function chemometricsPreflight(client: SemanticQueryClient, endpoint: string): Promise<void> {

  const resource = await client.resource(STANDARD_DEVIATION_RESOURCE);
  if (!resource) throw new Error("Canonical Standardabweichung resource was not found");
  if (!resource.types.includes(CD_CONCEPT)) {
    throw new Error("Standardabweichung resource is missing cd:Concept type");
  }

  const path = await client.standardDeviationPath();
  if (path.steps.length !== 9) {
    throw new Error(`Expected 9 canonical Standardabweichung path steps, got ${path.steps.length}`);
  }
  const positions = path.steps.map((step) => step.position).join(",");
  if (positions !== "1,2,3,4,5,6,7,8,9") {
    throw new Error(`Unexpected Standardabweichung path positions: ${positions}`);
  }

  const composition = await client.teachingOfferingComposition(
    DIGITAL_CHEMISTRY_TEACHING_OFFERING,
  );
  if (!composition) {
    throw new Error("Canonical digital-chemistry teaching offering was not found");
  }
  if (composition.graphId !== COURSE_SCALE_SPEC_GRAPH) {
    throw new Error(`Unexpected course-scale specification graph: ${composition.graphId}`);
  }
  if (composition.placements.length !== 1) {
    throw new Error(
      `Expected one canonical course-scale placement, got ${composition.placements.length}`,
    );
  }
  const placement = composition.placements[0];
  if (!placement) throw new Error("Canonical course-scale placement is missing");
  if (
    placement.id !== STANDARD_DEVIATION_PLACEMENT ||
    placement.position !== 10 ||
    placement.unitId !== STANDARD_DEVIATION_UNIT
  ) {
    throw new Error("Unexpected canonical Standardabweichung course-scale placement");
  }
  if (
    !placement.paths.some(
      (candidate) =>
        candidate.id === STANDARD_DEVIATION_PATH &&
        candidate.graphId === STANDARD_DEVIATION_PATH_GRAPH,
    )
  ) {
    throw new Error("Standardabweichung learning path is missing from course-scale query result");
  }

  const provenance = await client.provenance(STANDARD_DEVIATION_RESOURCE);
  if (!provenance.some((statement) => statement.graphId === STANDARD_DEVIATION_SPEC_GRAPH)) {
    throw new Error("Named-graph provenance for Standardabweichung was not preserved");
  }

  const germanLabel = resource.labels.find((label) => label.language === "de")?.value ?? "(none)";
  console.log(`Fuseki typed preflight succeeded: ${endpoint}`);
  console.log("Profile: chemometrics; reachability: confirmed");
  console.log(`Resource: ${resource.id}: ${germanLabel}`);
  console.log(`Path steps: ${path.steps.length}`);
  console.log(`Course placements: ${composition.placements.length}`);
  console.log(`Provenance statements: ${provenance.length}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
