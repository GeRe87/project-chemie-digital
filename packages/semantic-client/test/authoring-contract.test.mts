import assert from "node:assert/strict";
import test from "node:test";

import {
  AUTHORING_DRAFT_CONTRACT_VERSION,
  AUTHORING_PREVIEW_CONTRACT_VERSION,
  AUTHORING_PROMOTION_CONTRACT_VERSION,
  AUTHORING_VALIDATION_CONTRACT_VERSION,
} from "../src/authoring-contract.mts";

test("semantic authoring contracts are explicitly versioned", () => {
  assert.equal(AUTHORING_DRAFT_CONTRACT_VERSION, "1.0");
  assert.equal(AUTHORING_VALIDATION_CONTRACT_VERSION, "1.0");
  assert.equal(AUTHORING_PREVIEW_CONTRACT_VERSION, "1.0");
  assert.equal(AUTHORING_PROMOTION_CONTRACT_VERSION, "1.0");
});
