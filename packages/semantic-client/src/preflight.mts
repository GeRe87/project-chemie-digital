import {
  DEFAULT_SPARQL_ENDPOINT,
  FusekiHttpTransport,
  SemanticQueryClient,
  STANDARD_DEVIATION_RESOURCE,
  STANDARD_DEVIATION_SPEC_GRAPH,
} from "./index.mts";

const CD_CONCEPT = "https://w3id.org/project-chemie-digital/ontology/Concept";

async function main(): Promise<void> {
  const endpoint = process.env.CHEMIE_DIGITAL_SPARQL_ENDPOINT ?? DEFAULT_SPARQL_ENDPOINT;
  const client = new SemanticQueryClient(new FusekiHttpTransport(endpoint));

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

  const provenance = await client.provenance(STANDARD_DEVIATION_RESOURCE);
  if (!provenance.some((statement) => statement.graphId === STANDARD_DEVIATION_SPEC_GRAPH)) {
    throw new Error("Named-graph provenance for Standardabweichung was not preserved");
  }

  const germanLabel = resource.labels.find((label) => label.language === "de")?.value ?? "(none)";
  console.log(`Fuseki typed preflight succeeded: ${endpoint}`);
  console.log(`Resource: ${resource.id} — ${germanLabel}`);
  console.log(`Path steps: ${path.steps.length}`);
  console.log(`Provenance statements: ${provenance.length}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
