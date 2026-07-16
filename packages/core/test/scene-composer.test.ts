import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import type { ResolvedLearningPath } from "../src/path-resolver.ts";
import {
  composeSceneDocument,
  type CompositionDiagnosticCode,
  type ResolvedResource,
} from "../src/scene-composer.ts";
import type { SceneDocument } from "../src/scene-document.ts";

const path: ResolvedLearningPath = {
  id: "ex:standard-deviation-default-path",
  topicId: "ex:standard-deviation",
  steps: [
    { id: "ex:sd-step-definition", position: 1, viewType: "concept-introduction", resourceIds: ["ex:standard-deviation-definition-basic"] },
    { id: "ex:sd-step-expression", position: 2, viewType: "formula-introduction", resourceIds: ["ex:sample-standard-deviation-expression"] },
    { id: "ex:sd-step-symbols", position: 3, viewType: "symbol-explanation", resourceIds: ["ex:symbol-x-i", "ex:symbol-s", "ex:symbol-n", "ex:symbol-x-bar"] },
    { id: "ex:sd-step-examples", position: 4, viewType: "worked-examples", resourceIds: ["ex:standard-deviation-example-sensor", "ex:standard-deviation-example-replicates"] },
    { id: "ex:sd-step-exercise", position: 5, viewType: "exercise", resourceIds: ["ex:standard-deviation-exercise-01"] },
  ],
};

const resourceValues: readonly ResolvedResource[] = [
  { id: "ex:standard-deviation-definition-basic", kind: "Definition", label: "Standardabweichung: Definition", body: "Die Standardabweichung beschreibt die typische Streuung einzelner Beobachtungen um ihren arithmetischen Mittelwert.", format: "plain", provenanceIds: ["ex:reference-statistics-01"] },
  { id: "ex:sample-standard-deviation-expression", kind: "MathExpression", label: "Stichprobenstandardabweichung: Formel", latex: "s = \\sqrt{\\frac{1}{n-1}\\sum_{i=1}^{n}(x_i-\\bar{x})^2}", spokenText: "s ist die Quadratwurzel aus eins durch n minus eins, multipliziert mit der Summe der quadrierten Abweichungen von x i vom arithmetischen Mittelwert x quer." },
  { id: "ex:symbol-n", kind: "MathSymbol", label: "Formelzeichen der Stichprobenstandardabweichung", symbol: "n", spokenText: "n" },
  { id: "ex:symbol-s", kind: "MathSymbol", label: "Formelzeichen der Stichprobenstandardabweichung", symbol: "s", spokenText: "s" },
  { id: "ex:symbol-x-bar", kind: "MathSymbol", label: "Formelzeichen der Stichprobenstandardabweichung", symbol: "\\bar{x}", spokenText: "x quer" },
  { id: "ex:symbol-x-i", kind: "MathSymbol", label: "Formelzeichen der Stichprobenstandardabweichung", symbol: "x_i", spokenText: "x Index i" },
  { id: "ex:standard-deviation-example-replicates", kind: "WorkedExample", label: "Anwendungsbeispiele zur Standardabweichung", body: "Fünf Wiederholmessungen einer Kalibrierlösung werden genutzt, um Präzision und Standardabweichung zu bestimmen.", format: "plain" },
  { id: "ex:standard-deviation-example-sensor", kind: "WorkedExample", label: "Anwendungsbeispiele zur Standardabweichung", body: "Temperaturmessungen eines Minireaktors werden auf zufällige Schwankungen und Sensorstabilität untersucht.", format: "plain" },
  { id: "ex:standard-deviation-exercise-01", kind: "Exercise", label: "Übung zur Stichprobenstandardabweichung", body: "Berechnen und interpretieren Sie die Stichprobenstandardabweichung der Messwerte 9,8; 10,1; 10,0; 10,2; 9,9 mg/L.", staticFallback: "Aufgabe: Berechnen und interpretieren Sie die Stichprobenstandardabweichung der Messwerte 9,8; 10,1; 10,0; 10,2; 9,9 mg/L." },
];

function resources(values: readonly ResolvedResource[] = resourceValues): ReadonlyMap<string, ResolvedResource> {
  return new Map(values.map((resource) => [resource.id, resource]));
}

async function golden(): Promise<SceneDocument> {
  const content = await readFile(new URL("../../../docs/examples/standard-deviation-scene-document-1.0.json", import.meta.url), "utf8");
  return JSON.parse(content) as SceneDocument;
}

function expectOnly(code: CompositionDiagnosticCode, result = composeSceneDocument({ path, resources: resources() })): void {
  assert.equal(result.document, undefined);
  assert.deepEqual(result.diagnostics.map((item) => item.code), [code]);
}

test("deep-equals the normative standard-deviation SceneDocument", async () => {
  const result = composeSceneDocument({ path, resources: resources() });
  assert.deepEqual(result.diagnostics, []);
  assert.deepEqual(result.document, await golden());
});

test("is repeatable and independent of resource-index insertion order", () => {
  const forward = composeSceneDocument({ path, resources: resources() });
  const reverse = composeSceneDocument({ path, resources: resources([...resourceValues].reverse()) });
  assert.deepEqual(forward, reverse);
  assert.deepEqual(composeSceneDocument({ path, resources: resources() }), forward);
});

test("fails atomically for a missing resource", () => {
  const values = resourceValues.filter((resource) => resource.id !== "ex:standard-deviation-exercise-01");
  expectOnly("MISSING_RESOURCE", composeSceneDocument({ path, resources: resources(values) }));
});

test("diagnoses unsupported view types", () => {
  const changed = structuredClone(path);
  changed.steps[0].viewType = "slide";
  expectOnly("UNSUPPORTED_VIEW_TYPE", composeSceneDocument({ path: changed, resources: resources() }));
});

test("diagnoses incompatible cardinality", () => {
  const changed = structuredClone(path);
  changed.steps[0].resourceIds = ["ex:standard-deviation-definition-basic", "ex:standard-deviation-example-sensor"];
  const result = composeSceneDocument({ path: changed, resources: resources() });
  assert.equal(result.document, undefined);
  assert.ok(result.diagnostics.some((item) => item.code === "INCOMPATIBLE_RESOURCE_CARDINALITY"));
});

test("diagnoses unsupported kinds, missing payloads, accessibility, and narration", () => {
  const unsupported = resourceValues.map((resource) => resource.id === "ex:standard-deviation-definition-basic" ? { ...resource, kind: "Video" } : resource);
  assert.ok(composeSceneDocument({ path, resources: resources(unsupported) }).diagnostics.some((item) => item.code === "UNSUPPORTED_RESOURCE_KIND"));

  const payload = resourceValues.map((resource) => resource.id === "ex:standard-deviation-definition-basic" ? { ...resource, body: "" } : resource);
  assert.ok(composeSceneDocument({ path, resources: resources(payload) }).diagnostics.some((item) => item.code === "MISSING_REQUIRED_PAYLOAD"));

  const accessible = resourceValues.map((resource) => resource.id === "ex:sample-standard-deviation-expression" ? { ...resource, spokenText: "" } : resource);
  assert.ok(composeSceneDocument({ path, resources: resources(accessible) }).diagnostics.some((item) => item.code === "MISSING_ACCESSIBLE_ALTERNATIVE"));

  const narration = resourceValues.map((resource) => resource.id === "ex:standard-deviation-definition-basic" ? { ...resource, narrationRequired: true } : resource);
  assert.ok(composeSceneDocument({ path, resources: resources(narration) }).diagnostics.some((item) => item.code === "MISSING_NARRATION_PAYLOAD"));
});
