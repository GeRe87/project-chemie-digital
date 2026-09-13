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
