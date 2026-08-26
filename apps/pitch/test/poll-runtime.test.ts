import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

import { createHttpLiveResponseProvider, parsePollAggregate, pollServiceBase } from "../src/poll-runtime.ts";

const POLL = "ex:sd-precision-poll";
const OPTIONS = ["ex:sd-precision-option-a", "ex:sd-precision-option-b"] as const;
const VALID_AGGREGATE = {
  pollKey: POLL,
  participationUrl: "https://limesurvey.example.test/123",
  total: 6,
  options: [
    { id: OPTIONS[1], count: 2 },
    { id: OPTIONS[0], count: 4 },
  ],
};

test("poll service endpoint is local by default and explicitly configurable", () => {
  assert.equal(pollServiceBase("?interactive=1"), "http://127.0.0.1:8787");
  assert.equal(
    pollServiceBase("?interactive=1&pollEndpoint=https%3A%2F%2Fpoll.example.test%2F"),
    "https://poll.example.test",
  );
});

test("aggregate parser accepts only canonical option identities and counts", () => {
  const aggregate = parsePollAggregate(VALID_AGGREGATE, POLL, OPTIONS);
  assert.deepEqual(aggregate.options, [
    { id: OPTIONS[0], count: 4 },
    { id: OPTIONS[1], count: 2 },
  ]);
  assert.equal(aggregate.total, 6);
});

test("HTTP provider is replaceable and returns only the validated aggregate contract", async () => {
  let requestedUrl = "";
  const request: typeof fetch = async (input) => {
    requestedUrl = String(input);
    return new Response(JSON.stringify(VALID_AGGREGATE), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };
  const provider = createHttpLiveResponseProvider("?pollEndpoint=https%3A%2F%2Fpoll.example.test", request);
  const result = await provider.load(POLL, OPTIONS, new AbortController().signal);
  assert.equal(requestedUrl, "https://poll.example.test/polls/ex%3Asd-precision-poll");
  assert.deepEqual(result.options.map((option) => option.id), [...OPTIONS]);
});

test("aggregate parser fails closed on backend/content mismatches", () => {
  assert.throws(() => parsePollAggregate({
    ...VALID_AGGREGATE,
    pollKey: "ex:other-poll",
  }, POLL, OPTIONS), /different poll key/);

  assert.throws(() => parsePollAggregate({
    ...VALID_AGGREGATE,
    total: 1,
    options: [
      { id: OPTIONS[0], count: 1 },
      { id: "ex:not-authored", count: 0 },
    ],
  }, POLL, OPTIONS), /identities do not match/);

  assert.throws(() => parsePollAggregate({
    ...VALID_AGGREGATE,
    total: 7,
    options: OPTIONS.map((id) => ({ id, count: 2 })),
  }, POLL, OPTIONS), /counts do not match total/);
});

test("browser poll runtime contains no LimeSurvey administrative credentials or RPC methods", () => {
  const source = ["../src/poll-runtime.ts", "../src/main.ts"]
    .map((path) => readFileSync(new URL(path, import.meta.url), "utf8"))
    .join("\n");
  assert.doesNotMatch(source, /LIMESURVEY_USERNAME|LIMESURVEY_PASSWORD|get_session_key|export_responses|release_session_key/);
});
