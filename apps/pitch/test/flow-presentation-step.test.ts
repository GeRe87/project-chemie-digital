import assert from "node:assert/strict";
import test from "node:test";
import type { DiagramBlock, SourceReference } from "../../../packages/core/src/scene-document.ts";

import {
  FLOW_PRESENTATION_STEP_COUNT,
  deriveFlowPresentationPlan,
  flowPresentationStepState,
} from "../src/flow-runtime.ts";

const source = (resourceId: string): readonly SourceReference[] => [{ resourceId }];

function architectureDiagram(): DiagramBlock {
  return {
    kind: "diagram",
    id: "diagram:cogniflow-architecture",
    diagramType: "flow",
    label: "CogniFlow service-oriented architecture",
    description: "One interface, specialized providers.",
    source: source("ex:diagram-cogniflow-service-architecture"),
    nodes: [
      { id: "actors", label: "User / AI Agent", source: source("ex:node-cogniflow-actors") },
      { id: "mcp", label: "MCP Server", source: source("ex:node-cogniflow-mcp") },
      { id: "orchestrator", label: "Orchestration Engine", source: source("ex:node-cogniflow-orchestrator") },
      { id: "semantic", label: "Semantic Store", source: source("ex:node-cogniflow-semantic-store") },
      { id: "data", label: "Data Store", source: source("ex:node-cogniflow-data-store") },
      { id: "artifacts", label: "Artifact + Provenance", source: source("ex:node-cogniflow-artifact-store") },
    ],
    edges: [
      { id: "actors-mcp", sourceNodeId: "actors", targetNodeId: "mcp", label: "intent", source: source("ex:edge-cogniflow-actors-mcp") },
      { id: "mcp-orchestrator", sourceNodeId: "mcp", targetNodeId: "orchestrator", label: "dispatch", source: source("ex:edge-cogniflow-mcp-orchestrator") },
      { id: "orchestrator-semantic", sourceNodeId: "orchestrator", targetNodeId: "semantic", label: "semantic context", source: source("ex:edge-cogniflow-orchestrator-semantics") },
      { id: "orchestrator-data", sourceNodeId: "orchestrator", targetNodeId: "data", label: "data", source: source("ex:edge-cogniflow-orchestrator-data") },
      { id: "orchestrator-artifacts", sourceNodeId: "orchestrator", targetNodeId: "artifacts", label: "artifacts + provenance", source: source("ex:edge-cogniflow-orchestrator-artifacts") },
    ],
    focusNodeId: "mcp",
  };
}

function provenanceDiagram(): DiagramBlock {
  return {
    kind: "diagram",
    id: "diagram:cogniflow-provenance",
    diagramType: "flow",
    label: "Data processing with growing provenance",
    description: "Processing stages reveal together with their software and parameters.",
    source: source("ex:diagram-cogniflow-provenance-pipeline"),
    nodes: [
      { id: "raw", label: "RAW DATA", source: source("ex:node-cogniflow-prov-raw-data") },
      { id: "baseline-step", label: "PROCESS · Baseline correction", source: source("ex:node-cogniflow-prov-baseline-step") },
      { id: "baseline-algorithm", label: "ALGORITHM · baseline.correct 1.3.0", source: source("ex:node-cogniflow-prov-baseline-algorithm") },
      { id: "baseline-parameters", label: "PARAMETERS · λ=1e5 · p=0.01", source: source("ex:node-cogniflow-prov-baseline-parameters") },
      { id: "corrected", label: "ARTIFACT · Corrected signal", source: source("ex:node-cogniflow-prov-corrected-signal") },
      { id: "peak-step", label: "PROCESS · Peak regression", source: source("ex:node-cogniflow-prov-peak-step") },
      { id: "peak-algorithm", label: "ALGORITHM · qPeaks 0.4.0", source: source("ex:node-cogniflow-prov-peak-algorithm") },
      { id: "peak-parameters", label: "PARAMETERS · asymmetric log-quadratic fit", source: source("ex:node-cogniflow-prov-peak-parameters") },
      { id: "quantified", label: "RESULT · Peak area + uncertainty", source: source("ex:node-cogniflow-prov-quantified-peak") },
      { id: "fair", label: "FAIR RESULT · artifact + provenance", source: source("ex:node-cogniflow-prov-fair-result") },
    ],
    edges: [
      { id: "raw-baseline-step", sourceNodeId: "raw", targetNodeId: "baseline-step", label: "input", source: source("ex:e1") },
      { id: "raw-baseline-algorithm", sourceNodeId: "raw", targetNodeId: "baseline-algorithm", label: "software", source: source("ex:e2") },
      { id: "raw-baseline-parameters", sourceNodeId: "raw", targetNodeId: "baseline-parameters", label: "configuration", source: source("ex:e3") },
      { id: "baseline-step-corrected", sourceNodeId: "baseline-step", targetNodeId: "corrected", label: "produces", source: source("ex:e4") },
      { id: "baseline-algorithm-corrected", sourceNodeId: "baseline-algorithm", targetNodeId: "corrected", label: "recorded with", source: source("ex:e5") },
      { id: "baseline-parameters-corrected", sourceNodeId: "baseline-parameters", targetNodeId: "corrected", label: "recorded with", source: source("ex:e6") },
      { id: "corrected-peak-step", sourceNodeId: "corrected", targetNodeId: "peak-step", label: "input", source: source("ex:e7") },
      { id: "corrected-peak-algorithm", sourceNodeId: "corrected", targetNodeId: "peak-algorithm", label: "software", source: source("ex:e8") },
      { id: "corrected-peak-parameters", sourceNodeId: "corrected", targetNodeId: "peak-parameters", label: "configuration", source: source("ex:e9") },
      { id: "peak-step-quantified", sourceNodeId: "peak-step", targetNodeId: "quantified", label: "produces", source: source("ex:e10") },
      { id: "peak-algorithm-quantified", sourceNodeId: "peak-algorithm", targetNodeId: "quantified", label: "recorded with", source: source("ex:e11") },
      { id: "peak-parameters-quantified", sourceNodeId: "peak-parameters", targetNodeId: "quantified", label: "recorded with", source: source("ex:e12") },
      { id: "quantified-fair", sourceNodeId: "quantified", targetNodeId: "fair", label: "packages", source: source("ex:e13") },
    ],
    focusNodeId: "quantified",
  };
}

test("flow presentation steps retain the legacy absolute reveal contract", () => {
  assert.equal(FLOW_PRESENTATION_STEP_COUNT, 4);
  assert.deepEqual(flowPresentationStepState(0), {
    focusVisible: false,
    allNodesVisible: false,
    edgesVisible: false,
    focusEmphasized: false,
  });
  assert.deepEqual(flowPresentationStepState(1), {
    focusVisible: true,
    allNodesVisible: false,
    edgesVisible: false,
    focusEmphasized: false,
  });
  assert.deepEqual(flowPresentationStepState(2), {
    focusVisible: true,
    allNodesVisible: true,
    edgesVisible: false,
    focusEmphasized: false,
  });
  assert.deepEqual(flowPresentationStepState(3), {
    focusVisible: true,
    allNodesVisible: true,
    edgesVisible: true,
    focusEmphasized: false,
  });
  assert.deepEqual(flowPresentationStepState(42), {
    focusVisible: true,
    allNodesVisible: true,
    edgesVisible: true,
    focusEmphasized: true,
  });
});

test("semantic flow plan reveals the CogniFlow architecture by directed graph depth", () => {
  const plan = deriveFlowPresentationPlan(architectureDiagram());

  assert.equal(plan.mode, "semantic-path");
  assert.equal(plan.stepCount, 4);
  assert.deepEqual(Object.fromEntries(plan.nodeStepById), {
    actors: 1,
    mcp: 2,
    orchestrator: 3,
    semantic: 4,
    data: 4,
    artifacts: 4,
  });
  assert.deepEqual(Object.fromEntries(plan.edgeStepById), {
    "actors-mcp": 2,
    "mcp-orchestrator": 3,
    "orchestrator-semantic": 4,
    "orchestrator-data": 4,
    "orchestrator-artifacts": 4,
  });
});

test("provenance flow reveals processing metadata with the stage that consumes it", () => {
  const plan = deriveFlowPresentationPlan(provenanceDiagram());

  assert.equal(plan.mode, "semantic-path");
  assert.equal(plan.stepCount, 6);
  assert.deepEqual(Object.fromEntries(plan.nodeStepById), {
    raw: 1,
    "baseline-step": 2,
    "baseline-algorithm": 2,
    "baseline-parameters": 2,
    corrected: 3,
    "peak-step": 4,
    "peak-algorithm": 4,
    "peak-parameters": 4,
    quantified: 5,
    fair: 6,
  });
  assert.equal(plan.edgeStepById.get("raw-baseline-step"), 2);
  assert.equal(plan.edgeStepById.get("baseline-algorithm-corrected"), 3);
  assert.equal(plan.edgeStepById.get("corrected-peak-parameters"), 4);
  assert.equal(plan.edgeStepById.get("peak-step-quantified"), 5);
  assert.equal(plan.edgeStepById.get("quantified-fair"), 6);
});

test("cyclic flow diagrams fall back to the legacy reveal plan", () => {
  const block = architectureDiagram();
  const cyclic: DiagramBlock = {
    ...block,
    edges: [
      ...block.edges,
      {
        id: "semantic-mcp",
        sourceNodeId: "semantic",
        targetNodeId: "mcp",
        label: "feedback",
        source: source("ex:edge-semantic-mcp"),
      },
    ],
  };

  const plan = deriveFlowPresentationPlan(cyclic);
  assert.equal(plan.mode, "legacy");
  assert.equal(plan.stepCount, FLOW_PRESENTATION_STEP_COUNT);
  assert.equal(plan.nodeStepById.get("mcp"), 1);
  assert.equal(plan.nodeStepById.get("actors"), 2);
  assert.equal(plan.edgeStepById.get("actors-mcp"), 3);
});
