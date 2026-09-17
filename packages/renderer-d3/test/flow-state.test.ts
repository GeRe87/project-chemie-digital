import assert from "node:assert/strict";
import test from "node:test";
import type { DiagramBlock } from "../../core/src/index.ts";
import { createD3FlowLayout } from "../src/flow-layout.ts";
import { createD3FlowRenderModel, resolveD3FlowFocusBounds, resolveD3FlowState } from "../src/flow-diagram.ts";

const source = [{ resourceId: "fixture:state-network" }];

// This fixture deliberately uses generic vocabulary so state behavior cannot depend on presentation content.
const coreDomainRuntime: DiagramBlock = {
  kind: "diagram",
  id: "fixture:core-domain-runtime",
  diagramType: "network",
  label: "Core, Domain, Runtime",
  description: "A synthetic three-group state progression.",
  source,
  groups: [
    { id: "core", label: "Core", source },
    { id: "domain", label: "Domain", source },
    { id: "runtime", label: "Runtime", source },
  ],
  nodes: [
    { id: "core-contract", label: "Contract", groupIds: ["core"], source },
    { id: "domain-model", label: "Model", groupIds: ["domain"], source },
    { id: "runtime-service", label: "Service", groupIds: ["runtime"], source },
  ],
  edges: [
    { id: "core-domain", sourceNodeId: "core-contract", targetNodeId: "domain-model", label: "defines", source },
    { id: "domain-runtime", sourceNodeId: "domain-model", targetNodeId: "runtime-service", label: "runs in", source },
  ],
  states: [
    { id: "core-context", label: "Core with domain context", source, sharedEdgeAnnotations: [], activeGroupIds: ["core"], contextGroupIds: ["domain"], focusGroupId: "core" },
    { id: "domain-focus", label: "Domain focus", source, sharedEdgeAnnotations: [], activeGroupIds: ["core", "domain", "runtime"], focusGroupId: "domain", contextGroupIds: ["core", "runtime"] },
  ],
};

test("state selection propagates active and context groups without content-specific renderer rules", () => {
  const result = createD3FlowRenderModel(coreDomainRuntime, { reducedMotion: true, interactionPolicy: "static" });
  assert.ok(result.model);
  if (!result.model) return;

  const core = resolveD3FlowState(result.model, "core-context");
  assert.deepEqual([...core.activeNodeIds], ["core-contract"]);
  assert.deepEqual([...core.contextNodeIds], ["domain-model"]);
  assert.deepEqual([...core.visibleNodeIds], ["core-contract", "domain-model"]);
  assert.deepEqual([...core.contextEdgeIds], ["core-domain"]);
  assert.deepEqual([...core.focusNodeIds], ["core-contract"]);

  const domain = resolveD3FlowState(result.model, "domain-focus");
  assert.deepEqual([...domain.focusNodeIds], ["domain-model"]);
  assert.deepEqual([...domain.visibleNodeIds], ["core-contract", "domain-model", "runtime-service"]);
  assert.deepEqual([...domain.contextNodeIds], []);
  const bounds = resolveD3FlowFocusBounds(createD3FlowLayout(result.model, 960), domain);
  assert.deepEqual(bounds?.nodeIds, ["domain-model"]);
  assert.ok(bounds && bounds.x >= 0 && bounds.y >= 0 && bounds.x + bounds.width <= 960);
});

test("group references fail closed before a renderer can apply state visibility", () => {
  const invalid = createD3FlowRenderModel({
    ...coreDomainRuntime,
    nodes: [{ ...coreDomainRuntime.nodes[0]!, groupIds: ["missing"] }, ...coreDomainRuntime.nodes.slice(1)],
  }, { reducedMotion: true, interactionPolicy: "static" });
  assert.equal(invalid.model, undefined);
  assert.match(invalid.diagnostics[0]!.message, /unknown group/);
});
