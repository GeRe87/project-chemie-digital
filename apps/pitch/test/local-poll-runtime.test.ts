import assert from "node:assert/strict";
import test from "node:test";

import { isCorrectSingleChoice } from "../src/local-poll-runtime.ts";

test("local single-choice evaluation uses exact authored option identity", () => {
  assert.equal(isCorrectSingleChoice("option:b", "option:b"), true);
  assert.equal(isCorrectSingleChoice("option:b", "option:a"), false);
});
