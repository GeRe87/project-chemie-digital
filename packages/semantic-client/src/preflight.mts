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
  console.log(`Resource: ${resource.id} — ${germanLabel}`);
  console.log(`Path steps: ${path.steps.length}`);
  console.log(`Course placements: ${composition.placements.length}`);
  console.log(`Provenance statements: ${provenance.length}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
