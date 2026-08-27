import assert from "node:assert/strict";
import test from "node:test";
import {
  canonicalSerializeLearnerStateDocument,
  createLearnerStateDocument,
  parseAndValidateLearnerStateDocument,
  parseLearnerStateDocument,
  validateLearnerStateDocument,
  type LearnerStateDocument,
  type LearnerStateRuntime,
} from "../src/index.ts";

const runtime: LearnerStateRuntime = {
  datasetFingerprint: "sha256:active",
  documents: [{
    documentId: "doc:a",
    sceneIds: ["scene:a"],
    blocks: [
      { sceneId: "scene:a", blockId: "prompt:text", prompt: { responseMode: "free-text" } },
      { sceneId: "scene:a", blockId: "prompt:single", prompt: { responseMode: "single-choice", options: ["A", "B"] } },
      { sceneId: "scene:a", blockId: "prompt:multi", prompt: { responseMode: "multiple-choice", options: ["A", "B", "C"] } },
      { sceneId: "scene:a", blockId: "optional", disclosure: { mode: "optional" } },
      { sceneId: "scene:a", blockId: "progressive", disclosure: { mode: "progressive" } },
      { sceneId: "scene:a", blockId: "plain" },
    ],
  }],
};

function sample(): LearnerStateDocument {
  return createLearnerStateDocument("sha256:active", [{
    documentId: "doc:a",
    promptResponses: [
      { sceneId: "scene:a", blockId: "prompt:multi", responseMode: "multiple-choice", value: ["C", "A"] },
      { sceneId: "scene:a", blockId: "prompt:text", responseMode: "free-text", value: "Beobachtung" },
    ],
    disclosures: [
      { sceneId: "scene:a", blockId: "progressive", mode: "progressive", open: false, visible: true },
      { sceneId: "scene:a", blockId: "optional", mode: "optional", open: true, visible: true },
    ],
  }]);
}

test("serialization is stable for logically equal ordering", () => {
  const left = sample();
  const right = createLearnerStateDocument("sha256:active", [{
    documentId: "doc:a",
    promptResponses: [...left.documents[0]!.promptResponses].reverse(),
    disclosures: [...left.documents[0]!.disclosures].reverse(),
  }]);
  assert.equal(canonicalSerializeLearnerStateDocument(left), canonicalSerializeLearnerStateDocument(right));
  assert.deepEqual((right.documents[0]!.promptResponses.find((item) => item.responseMode === "multiple-choice") as any).value, ["A", "C"]);
});

test("prompt and disclosure state round-trips through strict parse and validation", () => {
  const source = canonicalSerializeLearnerStateDocument(sample());
  const result = parseAndValidateLearnerStateDocument(source, runtime);
  assert.deepEqual(result.diagnostics, []);
  assert.ok(result.document);
  assert.equal(canonicalSerializeLearnerStateDocument(result.document), source);
});

test("dataset fingerprint mismatch fails closed", () => {
  const stale = { ...sample(), datasetFingerprint: "sha256:stale" } as LearnerStateDocument;
  const result = validateLearnerStateDocument(stale, runtime);
  assert.equal(result.document, undefined);
  assert.equal(result.diagnostics[0]?.code, "DATASET_FINGERPRINT_MISMATCH");
});

test("unknown or stale block fails validation", () => {
  const stale = createLearnerStateDocument("sha256:active", [{
    documentId: "doc:a",
    promptResponses: [{ sceneId: "scene:a", blockId: "prompt:gone", responseMode: "free-text", value: "x" }],
    disclosures: [],
  }]);
  const result = validateLearnerStateDocument(stale, runtime);
  assert.equal(result.document, undefined);
  assert.equal(result.diagnostics[0]?.code, "UNKNOWN_BLOCK");
});

test("response mode and authored choice values are enforced", () => {
  let value = createLearnerStateDocument("sha256:active", [{
    documentId: "doc:a",
    promptResponses: [{ sceneId: "scene:a", blockId: "prompt:single", responseMode: "free-text", value: "A" }],
    disclosures: [],
  }]);
  let result = validateLearnerStateDocument(value, runtime);
  assert.equal(result.diagnostics[0]?.code, "RESPONSE_MODE_MISMATCH");

  value = createLearnerStateDocument("sha256:active", [{
    documentId: "doc:a",
    promptResponses: [{ sceneId: "scene:a", blockId: "prompt:single", responseMode: "single-choice", value: "C" }],
    disclosures: [],
  }]);
  result = validateLearnerStateDocument(value, runtime);
  assert.equal(result.diagnostics[0]?.code, "INVALID_CHOICE_VALUE");
});

test("duplicate or conflicting records are rejected during import", () => {
  const value = sample() as any;
  value.documents[0].promptResponses.push({ ...value.documents[0].promptResponses[0] });
  const result = parseLearnerStateDocument(JSON.stringify(value));
  assert.equal(result.document, undefined);
  assert.ok(result.diagnostics.some((item) => item.code === "DUPLICATE_STATE"));
});

test("state cannot attach to a non-interactive block", () => {
  const value = createLearnerStateDocument("sha256:active", [{
    documentId: "doc:a",
    promptResponses: [{ sceneId: "scene:a", blockId: "plain", responseMode: "free-text", value: "x" }],
    disclosures: [],
  }]);
  const result = validateLearnerStateDocument(value, runtime);
  assert.equal(result.diagnostics[0]?.code, "INVALID_STATE_OWNER");
});

test("v1 artifact has no account, profile, user, random id or timestamp fields", () => {
  const source = canonicalSerializeLearnerStateDocument(sample());
  assert.doesNotMatch(source, /"(?:user|userId|account|accountId|profile|profileId|timestamp|createdAt|updatedAt|sessionId|uuid)"/i);
});

test("unknown extension fields fail strict parsing", () => {
  const value = { ...sample(), createdAt: "2026-08-27T00:00:00Z" };
  const result = parseLearnerStateDocument(JSON.stringify(value));
  assert.equal(result.document, undefined);
  assert.equal(result.diagnostics[0]?.code, "MALFORMED_DOCUMENT");
});

test("learner-state implementation has no browser store, semantic service, tracking or network dependency", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(new URL("../src/index.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /Fuseki|SPARQL|localStorage|indexedDB|document\.cookie|telemetry|analytics|fetch\s*\(/i);
});
