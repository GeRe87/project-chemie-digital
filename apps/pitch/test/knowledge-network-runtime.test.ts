import assert from "node:assert/strict";
import test from "node:test";

import {
  KNOWLEDGE_NETWORK_STEP_COUNT,
  knowledgeNetworkStepState,
} from "../src/knowledge-network-runtime.ts";

test("semantic knowledge-network steps build progressively and clamp absolutely", () => {
  assert.equal(KNOWLEDGE_NETWORK_STEP_COUNT, 4);
  assert.deepEqual(knowledgeNetworkStepState(0), {
    selectedVisible: false,
    relatedVisible: false,
    edgesVisible: false,
    focusSelected: false,
  });
  assert.deepEqual(knowledgeNetworkStepState(1), {
    selectedVisible: true,
    relatedVisible: false,
    edgesVisible: false,
    focusSelected: false,
  });
  assert.deepEqual(knowledgeNetworkStepState(2), {
    selectedVisible: true,
    relatedVisible: true,
    edgesVisible: false,
    focusSelected: false,
  });
  assert.deepEqual(knowledgeNetworkStepState(3), {
    selectedVisible: true,
    relatedVisible: true,
    edgesVisible: true,
    focusSelected: false,
  });
  assert.deepEqual(knowledgeNetworkStepState(99), {
    selectedVisible: true,
    relatedVisible: true,
    edgesVisible: true,
    focusSelected: true,
  });
  assert.deepEqual(knowledgeNetworkStepState(-3), knowledgeNetworkStepState(0));
});
