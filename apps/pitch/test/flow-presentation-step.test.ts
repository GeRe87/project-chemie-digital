import assert from "node:assert/strict";
import test from "node:test";

import {
  FLOW_PRESENTATION_STEP_COUNT,
  flowPresentationStepState,
} from "../src/flow-runtime.ts";

test("flow presentation steps reveal focus, nodes, edges and final emphasis in absolute order", () => {
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
