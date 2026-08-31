import { validateSceneDocument, type SceneDocument } from "./scene-document.ts";

export const CANONICAL_RUNTIME_ARTIFACT_VERSION = "1.0" as const;
export const TEACHING_OFFERING_RUNTIME_DOCUMENT_VERSION = "1.0" as const;

export interface RuntimeLocalizedText {
  readonly value: string;
  readonly language?: string;
}

export interface TeachingOfferingRuntimePathReference {
  readonly id: string;
  readonly graphId: string;
  readonly labels: readonly RuntimeLocalizedText[];
  readonly descriptions: readonly RuntimeLocalizedText[];
}

export interface TeachingOfferingRuntimeUnit {
  readonly id: string;
  readonly labels: readonly RuntimeLocalizedText[];
  readonly descriptions: readonly RuntimeLocalizedText[];
  readonly paths: readonly TeachingOfferingRuntimePathReference[];
}

export interface TeachingOfferingRuntimePlacement {
  readonly id: string;
  readonly position: number;
  readonly unitId: string;
}

export interface TeachingOfferingRuntimeDocument {
  readonly version: typeof TEACHING_OFFERING_RUNTIME_DOCUMENT_VERSION;
  readonly datasetFingerprint: string;
  readonly offering: {
    readonly id: string;
    readonly graphId: string;
    readonly labels: readonly RuntimeLocalizedText[];
    readonly descriptions: readonly RuntimeLocalizedText[];
  };
  readonly placements: readonly TeachingOfferingRuntimePlacement[];
  readonly units: readonly TeachingOfferingRuntimeUnit[];
}

export interface CanonicalRuntimeArtifact {
  readonly artifactVersion: typeof CANONICAL_RUNTIME_ARTIFACT_VERSION;
  readonly datasetFingerprint: string;
  readonly datasetSnapshot: unknown;
  readonly teachingOfferingDocuments: readonly TeachingOfferingRuntimeDocument[];
  readonly sceneDocuments: readonly SceneDocument[];
}

export class CanonicalRuntimeContractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CanonicalRuntimeContractError";
  }
}

const DATASET_FINGERPRINT = /^sha256:[0-9a-f]{64}$/;

function fail(message: string): never {
  throw new CanonicalRuntimeContractError(message);
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) fail(`${label} must be an object`);
  return value as Record<string, unknown>;
}

function requireArray(value: unknown, label: string): readonly unknown[] {
  if (!Array.isArray(value)) fail(`${label} must be an array`);
  return value;
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string") fail(`${label} must be a string`);
  return value;
}

function requireDatasetFingerprint(value: unknown, label: string): string {
  const fingerprint = requireString(value, label);
  if (!DATASET_FINGERPRINT.test(fingerprint)) {
    fail(`${label} must use canonical sha256:<64 lowercase hex> form`);
  }
  return fingerprint;
}

function requireHttpIri(value: unknown, label: string): string {
  const iri = requireString(value, label);
  if (iri.length === 0 || /\s/.test(iri)) fail(`${label} must be an absolute HTTP(S) IRI`);
  try {
    const parsed = new URL(iri);
    if (
      (parsed.protocol !== "http:" && parsed.protocol !== "https:")
      || parsed.hostname.length === 0
      || parsed.username.length > 0
      || parsed.password.length > 0
    ) {
      fail(`${label} must be an absolute HTTP(S) IRI`);
    }
  } catch (error) {
    if (error instanceof CanonicalRuntimeContractError) throw error;
    fail(`${label} must be an absolute HTTP(S) IRI`);
  }
  return iri;
}

function compareStrings(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function localizedKey(value: RuntimeLocalizedText): string {
  return `${value.language ?? ""}\u0000${value.value}`;
}

function compareLocalizedText(left: RuntimeLocalizedText, right: RuntimeLocalizedText): number {
  const language = compareStrings(left.language ?? "", right.language ?? "");
  return language !== 0 ? language : compareStrings(left.value, right.value);
}

function validateLocalizedText(value: unknown, label: string): readonly RuntimeLocalizedText[] {
  const entries = requireArray(value, label);
  const validated: RuntimeLocalizedText[] = [];
  const keys = new Set<string>();
  for (const [index, raw] of entries.entries()) {
    const item = requireRecord(raw, `${label}[${index}]`);
    const text = requireString(item.value, `${label}[${index}].value`);
    let language: string | undefined;
    if (item.language !== undefined) {
      language = requireString(item.language, `${label}[${index}].language`);
      if (language.length === 0) fail(`${label}[${index}].language must be non-empty when present`);
    }
    const entry: RuntimeLocalizedText = language === undefined ? { value: text } : { value: text, language };
    const key = localizedKey(entry);
    if (keys.has(key)) fail(`${label} contains duplicate value/language entries`);
    keys.add(key);
    if (validated.length > 0 && compareLocalizedText(validated[validated.length - 1]!, entry) > 0) {
      fail(`${label} must be deterministically sorted by language then value`);
    }
    validated.push(entry);
  }
  return validated;
}

function validatePathReferences(value: unknown, label: string): void {
  const paths = requireArray(value, label);
  const pairs = new Set<string>();
  let previous: readonly [string, string] | undefined;
  for (const [index, raw] of paths.entries()) {
    const path = requireRecord(raw, `${label}[${index}]`);
    const id = requireHttpIri(path.id, `${label}[${index}].id`);
    const graphId = requireHttpIri(path.graphId, `${label}[${index}].graphId`);
    validateLocalizedText(path.labels, `${label}[${index}].labels`);
    validateLocalizedText(path.descriptions, `${label}[${index}].descriptions`);
    const pairKey = `${id}\u0000${graphId}`;
    if (pairs.has(pairKey)) fail(`${label} contains duplicate exact path references`);
    pairs.add(pairKey);
    if (previous !== undefined) {
      const idOrder = compareStrings(previous[0], id);
      const order = idOrder !== 0 ? idOrder : compareStrings(previous[1], graphId);
      if (order > 0) fail(`${label} must be deterministically sorted by exact (id, graphId)`);
    }
    previous = [id, graphId];
  }
}

function validateTeachingOfferingDocument(value: unknown, rootFingerprint: string, index: number): TeachingOfferingRuntimeDocument {
  const label = `teachingOfferingDocuments[${index}]`;
  const documentValue = requireRecord(value, label);
  if (documentValue.version !== TEACHING_OFFERING_RUNTIME_DOCUMENT_VERSION) {
    fail(`${label}.version is unsupported: ${String(documentValue.version)}`);
  }
  const fingerprint = requireDatasetFingerprint(documentValue.datasetFingerprint, `${label}.datasetFingerprint`);
  if (fingerprint !== rootFingerprint) fail(`${label}.datasetFingerprint must equal the root Dataset fingerprint`);

  const offering = requireRecord(documentValue.offering, `${label}.offering`);
  requireHttpIri(offering.id, `${label}.offering.id`);
  requireHttpIri(offering.graphId, `${label}.offering.graphId`);
  validateLocalizedText(offering.labels, `${label}.offering.labels`);
  validateLocalizedText(offering.descriptions, `${label}.offering.descriptions`);

  const placements = requireArray(documentValue.placements, `${label}.placements`);
  if (placements.length === 0) fail(`${label}.placements must contain at least one UnitPlacement`);
  const placementIds = new Set<string>();
  const placementUnitIds: string[] = [];
  const positions = new Set<number>();
  let previousPosition: number | undefined;
  for (const [placementIndex, raw] of placements.entries()) {
    const placementLabel = `${label}.placements[${placementIndex}]`;
    const placement = requireRecord(raw, placementLabel);
    const id = requireHttpIri(placement.id, `${placementLabel}.id`);
    if (placementIds.has(id)) fail(`${label}.placements contains duplicate placement ids`);
    placementIds.add(id);
    const position = placement.position;
    if (typeof position !== "number" || !Number.isInteger(position) || position < 1) {
      fail(`${placementLabel}.position must be a positive integer`);
    }
    if (positions.has(position)) fail(`${label}.placements contains duplicate positions`);
    positions.add(position);
    if (previousPosition !== undefined && position < previousPosition) {
      fail(`${label}.placements must be serialized by position ascending`);
    }
    previousPosition = position;
    placementUnitIds.push(requireHttpIri(placement.unitId, `${placementLabel}.unitId`));
  }

  const units = requireArray(documentValue.units, `${label}.units`);
  const unitIds = new Set<string>();
  let previousUnitId: string | undefined;
  for (const [unitIndex, raw] of units.entries()) {
    const unitLabel = `${label}.units[${unitIndex}]`;
    const unit = requireRecord(raw, unitLabel);
    const id = requireHttpIri(unit.id, `${unitLabel}.id`);
    if (unitIds.has(id)) fail(`${label}.units contains duplicate unit ids`);
    if (previousUnitId !== undefined && compareStrings(previousUnitId, id) > 0) {
      fail(`${label}.units must be deterministically sorted by unit id`);
    }
    unitIds.add(id);
    previousUnitId = id;
    validateLocalizedText(unit.labels, `${unitLabel}.labels`);
    validateLocalizedText(unit.descriptions, `${unitLabel}.descriptions`);
    validatePathReferences(unit.paths, `${unitLabel}.paths`);
  }

  for (const unitId of placementUnitIds) {
    if (!unitIds.has(unitId)) fail(`${label}.placements references unknown unitId ${unitId}`);
  }
  const referencedUnits = new Set(placementUnitIds);
  for (const unitId of unitIds) {
    if (!referencedUnits.has(unitId)) fail(`${label}.units contains unreferenced unit ${unitId}`);
  }

  return value as TeachingOfferingRuntimeDocument;
}

export function validateCanonicalRuntimeArtifact(value: unknown): CanonicalRuntimeArtifact {
  const root = requireRecord(value, "CanonicalRuntimeArtifact");
  if (root.artifactVersion !== CANONICAL_RUNTIME_ARTIFACT_VERSION) {
    fail(`Unsupported canonical runtime artifact version: ${String(root.artifactVersion)}`);
  }
  const fingerprint = requireDatasetFingerprint(root.datasetFingerprint, "CanonicalRuntimeArtifact.datasetFingerprint");
  if (!Object.hasOwn(root, "datasetSnapshot")) fail("CanonicalRuntimeArtifact.datasetSnapshot is required");

  const teachingOfferingDocuments = requireArray(
    root.teachingOfferingDocuments,
    "CanonicalRuntimeArtifact.teachingOfferingDocuments",
  );
  const offeringIds = new Set<string>();
  for (const [index, raw] of teachingOfferingDocuments.entries()) {
    const documentValue = validateTeachingOfferingDocument(raw, fingerprint, index);
    if (offeringIds.has(documentValue.offering.id)) {
      fail("CanonicalRuntimeArtifact.teachingOfferingDocuments contains duplicate offering ids");
    }
    offeringIds.add(documentValue.offering.id);
  }

  const sceneDocuments = requireArray(root.sceneDocuments, "CanonicalRuntimeArtifact.sceneDocuments");
  for (const [index, raw] of sceneDocuments.entries()) {
    requireRecord(raw, `CanonicalRuntimeArtifact.sceneDocuments[${index}]`);
    try {
      validateSceneDocument(raw as SceneDocument);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      fail(`CanonicalRuntimeArtifact.sceneDocuments[${index}] is invalid: ${message}`);
    }
  }

  return value as CanonicalRuntimeArtifact;
}
