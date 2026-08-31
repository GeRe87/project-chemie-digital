import assert from "node:assert/strict";
import test from "node:test";

import {
  CANONICAL_RUNTIME_ARTIFACT_VERSION,
  CanonicalRuntimeContractError,
  TEACHING_OFFERING_RUNTIME_DOCUMENT_VERSION,
  validateCanonicalRuntimeArtifact,
} from "../src/canonical-runtime.ts";

const FINGERPRINT = `sha256:${"a".repeat(64)}`;
const OTHER_FINGERPRINT = `sha256:${"b".repeat(64)}`;
const BASE = "https://w3id.org/project-chemie-digital/resource/";
const GRAPH = "https://w3id.org/project-chemie-digital/graph/";

type MutableArtifact = Record<string, any>;

function artifact(): MutableArtifact {
  return {
    artifactVersion: CANONICAL_RUNTIME_ARTIFACT_VERSION,
    datasetFingerprint: FINGERPRINT,
    datasetSnapshot: { intentionallyOpaque: true },
    teachingOfferingDocuments: [
      {
        version: TEACHING_OFFERING_RUNTIME_DOCUMENT_VERSION,
        datasetFingerprint: FINGERPRINT,
        offering: {
          id: `${BASE}offering-a`,
          graphId: `${GRAPH}course-a`,
          labels: [
            { value: "Neutral" },
            { value: "Angebot", language: "de" },
            { value: "Offering", language: "en" },
          ],
          descriptions: [],
        },
        placements: [
          { id: `${BASE}placement-a`, position: 10, unitId: `${BASE}unit-a` },
          { id: `${BASE}placement-b`, position: 20, unitId: `${BASE}unit-b` },
        ],
        units: [
          {
            id: `${BASE}unit-a`,
            labels: [{ value: "Einheit A", language: "de" }],
            descriptions: [],
            paths: [],
          },
          {
            id: `${BASE}unit-b`,
            labels: [],
            descriptions: [],
            paths: [
              {
                id: `${BASE}path-a`,
                graphId: `${GRAPH}paths/a`,
                labels: [],
                descriptions: [],
              },
              {
                id: `${BASE}path-a`,
                graphId: `${GRAPH}paths/b`,
                labels: [{ value: "Path B", language: "en" }],
                descriptions: [],
              },
            ],
          },
        ],
      },
    ],
    sceneDocuments: [
      {
        version: "1.0",
        id: "ex:path-a--scene-document",
        sourcePathId: "ex:path-a",
        scenes: [],
      },
    ],
    futureAdditiveRootField: { accepted: true },
  };
}

function expectContractError(mutator: (value: MutableArtifact) => void, message: RegExp): void {
  const value = artifact();
  mutator(value);
  assert.throws(
    () => validateCanonicalRuntimeArtifact(value),
    (error: unknown) => error instanceof CanonicalRuntimeContractError && message.test(error.message),
  );
}

test("accepts current-shaped canonical runtime and unrelated additive root fields", () => {
  const value = artifact();
  const validated = validateCanonicalRuntimeArtifact(value);
  assert.equal(validated, value);
  assert.equal(validated.datasetFingerprint, FINGERPRINT);
  assert.equal(validated.teachingOfferingDocuments[0]!.units[0]!.paths.length, 0);
});

test("rejects unsupported root and TeachingOffering document versions", () => {
  expectContractError((value) => { value.artifactVersion = "2.0"; }, /Unsupported canonical runtime artifact version/);
  expectContractError(
    (value) => { value.teachingOfferingDocuments[0].version = "2.0"; },
    /teachingOfferingDocuments\[0\]\.version is unsupported/,
  );
});

test("requires canonical root and document Dataset fingerprints and rejects mixed revisions", () => {
  expectContractError(
    (value) => { value.datasetFingerprint = "sha256:ABC"; },
    /datasetFingerprint must use canonical sha256/,
  );
  expectContractError(
    (value) => { value.teachingOfferingDocuments[0].datasetFingerprint = "sha256:not-a-digest"; },
    /teachingOfferingDocuments\[0\]\.datasetFingerprint must use canonical sha256/,
  );
  expectContractError(
    (value) => { value.teachingOfferingDocuments[0].datasetFingerprint = OTHER_FINGERPRINT; },
    /must equal the root Dataset fingerprint/,
  );
});

test("requires datasetSnapshot presence but keeps its contents opaque", () => {
  const value = artifact();
  value.datasetSnapshot = "opaque transport is not interpreted here";
  assert.doesNotThrow(() => validateCanonicalRuntimeArtifact(value));
  delete value.datasetSnapshot;
  assert.throws(() => validateCanonicalRuntimeArtifact(value), /datasetSnapshot is required/);
});

test("rejects relative or credential-bearing semantic identities", () => {
  expectContractError(
    (value) => { value.teachingOfferingDocuments[0].offering.id = "/relative"; },
    /offering\.id must be an absolute HTTP\(S\) IRI/,
  );
  expectContractError(
    (value) => { value.teachingOfferingDocuments[0].offering.graphId = "https://user@example.org/graph"; },
    /offering\.graphId must be an absolute HTTP\(S\) IRI/,
  );
  expectContractError(
    (value) => { value.teachingOfferingDocuments[0].units[1].paths[0].graphId = "urn:graph:test"; },
    /graphId must be an absolute HTTP\(S\) IRI/,
  );
});

test("requires unique placement ids, positive unique positions and authored ascending placement order", () => {
  expectContractError(
    (value) => { value.teachingOfferingDocuments[0].placements[1].id = `${BASE}placement-a`; },
    /duplicate placement ids/,
  );
  expectContractError(
    (value) => { value.teachingOfferingDocuments[0].placements[0].position = 0; },
    /position must be a positive integer/,
  );
  expectContractError(
    (value) => { value.teachingOfferingDocuments[0].placements[1].position = 10; },
    /duplicate positions/,
  );
  expectContractError(
    (value) => {
      value.teachingOfferingDocuments[0].placements[0].position = 20;
      value.teachingOfferingDocuments[0].placements[1].position = 10;
    },
    /serialized by position ascending/,
  );
});

test("requires normalized placement-to-unit joins and rejects unreferenced units", () => {
  expectContractError(
    (value) => { value.teachingOfferingDocuments[0].placements[0].unitId = `${BASE}unit-missing`; },
    /references unknown unitId/,
  );
  expectContractError(
    (value) => { value.teachingOfferingDocuments[0].placements.splice(1, 1); },
    /contains unreferenced unit/,
  );
});

test("requires unique units serialized by stable unit IRI", () => {
  expectContractError(
    (value) => { value.teachingOfferingDocuments[0].units[1].id = `${BASE}unit-a`; },
    /duplicate unit ids/,
  );
  expectContractError(
    (value) => {
      const units = value.teachingOfferingDocuments[0].units;
      [units[0], units[1]] = [units[1], units[0]];
    },
    /sorted by unit id/,
  );
});

test("keeps zero-path units valid and requires exact path pairs to be unique and deterministically ordered", () => {
  assert.doesNotThrow(() => validateCanonicalRuntimeArtifact(artifact()));
  expectContractError(
    (value) => { value.teachingOfferingDocuments[0].units[1].paths[1].graphId = `${GRAPH}paths/a`; },
    /duplicate exact path references/,
  );
  expectContractError(
    (value) => {
      const paths = value.teachingOfferingDocuments[0].units[1].paths;
      [paths[0], paths[1]] = [paths[1], paths[0]];
    },
    /sorted by exact \(id, graphId\)/,
  );
});

test("accepts deterministic multilingual and language-neutral metadata without choosing a locale", () => {
  const validated = validateCanonicalRuntimeArtifact(artifact());
  assert.deepEqual(validated.teachingOfferingDocuments[0]!.offering.labels, [
    { value: "Neutral" },
    { value: "Angebot", language: "de" },
    { value: "Offering", language: "en" },
  ]);
});

test("rejects malformed, duplicate and out-of-order localized metadata", () => {
  expectContractError(
    (value) => { value.teachingOfferingDocuments[0].offering.labels[0] = { language: "de" }; },
    /labels\[0\]\.value must be a string/,
  );
  expectContractError(
    (value) => { value.teachingOfferingDocuments[0].offering.labels.push({ value: "Angebot", language: "de" }); },
    /duplicate value\/language entries/,
  );
  expectContractError(
    (value) => {
      value.teachingOfferingDocuments[0].offering.labels = [
        { value: "English", language: "en" },
        { value: "Deutsch", language: "de" },
      ];
    },
    /sorted by language then value/,
  );
  expectContractError(
    (value) => { value.teachingOfferingDocuments[0].units[0].labels = [{ value: "x", language: "" }]; },
    /language must be non-empty when present/,
  );
});

test("uses offering IRI as the root collection identity and rejects duplicate offering documents", () => {
  expectContractError(
    (value) => { value.teachingOfferingDocuments.push(structuredClone(value.teachingOfferingDocuments[0])); },
    /duplicate offering ids/,
  );
});

test("delegates SceneDocument validation to the existing SceneDocument contract", () => {
  expectContractError(
    (value) => { value.sceneDocuments[0].version = "2.0"; },
    /sceneDocuments\[0\] is invalid: Unsupported scene document version/,
  );
  expectContractError(
    (value) => { value.sceneDocuments[0].scenes = [{ id: "scene", source: [], blocks: [], readingOrder: [] }]; },
    /sceneDocuments\[0\] is invalid: Scene scene source must retain at least one source resource/,
  );
});
