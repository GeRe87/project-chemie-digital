import {test} from "node:test";
import assert from "node:assert/strict";
import {chartLabelLines} from "../src/chart-labels.ts";
test("categorical labels wrap complete names without truncation",()=>{
  const label="Extract B with wider recovery spread";
  const narrow=chartLabelLines(label,130),wide=chartLabelLines(label,500);
  assert(narrow.length>wide.length);assert.equal(narrow.join(" "),label);assert.equal(wide.join(" "),label);
  assert(narrow.every(line=>line.length<=12||!line.includes(" ")));
});
