import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  DIGITAL_CHEMISTRY_TEACHING_OFFERING,
  STANDARD_DEVIATION_PATH,
  STANDARD_DEVIATION_PATH_GRAPH,
  STANDARD_DEVIATION_RESOURCE,
  STANDARD_DEVIATION_SPEC_GRAPH,
  provenanceQuery,
  resourceQuery,
  standardDeviationPathQuery,
  teachingOfferingCompositionQuery,
  type SparqlBindingValue,
} from "../src/index.mts";

const CLI = fileURLToPath(new URL("../src/preflight.mts", import.meta.url));
const TALKS_QUERY = "ASK { GRAPH <https://w3id.org/project-chemie-digital/graph/scenes/talks-ted-thanks> { <https://w3id.org/project-chemie-digital/resource/ted-scene-thanks> a <https://w3id.org/project-chemie-digital/ontology/SceneDefinition> . } }";

type Reply = { body: string; status?: number };
type RequestRecord = {
  method: string | undefined;
  url: string | undefined;
  accept: string | undefined;
  contentType: string | undefined;
  body: string;
};

async function runCli(args: readonly string[], endpoint: string) {
  const child = spawn(process.execPath, ["--experimental-strip-types", CLI, ...args], {
    env: { ...process.env, CHEMIE_DIGITAL_SPARQL_ENDPOINT: endpoint },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stdout = "";
  let stderr = "";
  child.stdout.setEncoding("utf8").on("data", (chunk: string) => { stdout += chunk; });
  child.stderr.setEncoding("utf8").on("data", (chunk: string) => { stderr += chunk; });
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; child.kill(); }, 10_000);
  try {
    const [code, signal] = await once(child, "close");
    assert.equal(timedOut, false, `CLI timed out: ${stderr}`);
    assert.equal(signal, null);
    return { code, stdout, stderr };
  } finally {
    clearTimeout(timer);
    if (child.exitCode === null && child.signalCode === null) child.kill();
  }
}

async function withStub(
  replies: readonly Reply[],
  check: (endpoint: string, requests: RequestRecord[]) => Promise<void>,
) {
  const requests: RequestRecord[] = [];
  const server = createServer(async (request, response) => {
    let body = "";
    for await (const chunk of request) body += chunk.toString();
    const reply = replies[requests.length] ?? { status: 500, body: "Unexpected request" };
    requests.push({
      method: request.method,
      url: request.url,
      accept: request.headers.accept,
      contentType: request.headers["content-type"],
      body,
    });
    response.writeHead(reply.status ?? 200, { "content-type": "application/sparql-results+json" });
    response.end(reply.body);
  });
  try {
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    assert.ok(address && typeof address === "object");
    await check(`http://127.0.0.1:${address.port}/chemie-digital/query`, requests);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
}

function assertRequests(requests: readonly RequestRecord[], queries: readonly string[]) {
  assert.equal(requests.length, queries.length);
  requests.forEach((request, index) => {
    assert.equal(request.method, "POST");
    assert.equal(request.url, "/chemie-digital/query");
    assert.equal(request.accept, "application/sparql-results+json");
    assert.equal(request.contentType, "application/x-www-form-urlencoded;charset=UTF-8");
    assert.deepEqual([...new URLSearchParams(request.body)], [["query", queries[index]]]);
  });
}

test("Talks CLI proves the exact named-graph scene with typed ASK", { timeout: 20_000 }, async () => {
  await withStub([{ body: JSON.stringify({ head: {}, boolean: true }) }], async (endpoint, requests) => {
    const result = await runCli(["--profile", "talks"], endpoint);
    assert.equal(result.code, 0, result.stderr);
    assert.match(result.stdout, /Profile: talks; reachability: confirmed/);
    assert.ok(result.stdout.includes(endpoint));
    assertRequests(requests, [TALKS_QUERY]);
  });
});

const failures = [
  { name: "false", body: '{"boolean":false}', error: /ASK returned false/ },
  ...[{}, { boolean: "true" }, { boolean: 1 }, { boolean: null }, null, [], true].map((value) => ({
    name: `malformed ${JSON.stringify(value)}`,
    body: JSON.stringify(value),
    error: /malformed SPARQL ASK JSON.*boolean/,
  })),
  { name: "invalid JSON", body: "not JSON", error: /invalid JSON for Talks ASK/ },
  { name: "HTTP failure", body: '{"boolean":true}', status: 503, error: /HTTP 503/ },
];
for (const failure of failures) {
  test(`Talks CLI rejects ${failure.name}`, { timeout: 20_000 }, async () => {
    await withStub([failure], async (endpoint, requests) => {
      const result = await runCli(["--profile", "talks"], endpoint);
      assert.equal(result.code, 1, result.stderr);
      assert.match(result.stderr, failure.error);
      assert.doesNotMatch(result.stdout, /succeeded|reachability: confirmed/);
      assertRequests(requests, [TALKS_QUERY]);
    });
  });
}

for (const args of [
  ["--profile", "unknown"], ["--profile"], ["talks"], ["--unknown"],
  ["--profile", "talks", "extra"], ["--profile", "chemometrics", "extra"],
  ["--profile", "talks", "--profile", "chemometrics"],
]) {
  test(`CLI rejects arguments before HTTP: ${args.join(" ")}`, { timeout: 20_000 }, async () => {
    await withStub([], async (endpoint, requests) => {
      const result = await runCli(args, endpoint);
      assert.equal(result.code, 1);
      assert.match(result.stderr, /Usage: fuseki:check/);
      assertRequests(requests, []);
    });
  });
}

for (const profile of ["talks", "chemometrics"]) {
  for (const endpoint of ["file:///not-http", "http://user:password@127.0.0.1:1/query"]) {
    test(`${profile} rejects unsafe endpoint ${endpoint.startsWith("file:") ? "scheme" : "credentials"}`, { timeout: 20_000 }, async () => {
      const result = await runCli(["--profile", profile], endpoint);
      assert.equal(result.code, 1);
      assert.match(result.stderr, /Only absolute HTTP\(S\) IRIs|credentials are not supported/);
      assert.doesNotMatch(result.stderr, /user:password/);
    });
  }
}

const uri = (value: string): SparqlBindingValue => ({ type: "uri", value });
const integer = (value: number): SparqlBindingValue => ({
  type: "literal", value: String(value), datatype: "http://www.w3.org/2001/XMLSchema#integer",
});
const selectReply = (bindings: Record<string, SparqlBindingValue>[]): Reply => ({
  body: JSON.stringify({ head: { vars: [...new Set(bindings.flatMap(Object.keys))] }, results: { bindings } }),
});
const chemometricsReplies = [
  selectReply([{
    type: uri("https://w3id.org/project-chemie-digital/ontology/Concept"),
    label: { type: "literal", value: "Standardabweichung", "xml:lang": "de" },
  }]),
  selectReply(Array.from({ length: 9 }, (_, index) => ({
    step: uri(`https://w3id.org/project-chemie-digital/resource/step-${index + 1}`),
    position: integer(index + 1),
    scene: uri(`https://w3id.org/project-chemie-digital/resource/scene-${index + 1}`),
  }))),
  selectReply([{
    offering: uri(DIGITAL_CHEMISTRY_TEACHING_OFFERING),
    offeringGraph: uri("https://w3id.org/project-chemie-digital/graph/specifications/course-scale"),
    placement: uri("https://w3id.org/project-chemie-digital/resource/unit-placement-standard-deviation"),
    position: integer(10),
    unit: uri("https://w3id.org/project-chemie-digital/resource/learning-unit-standard-deviation"),
    path: uri(STANDARD_DEVIATION_PATH),
    pathGraph: uri(STANDARD_DEVIATION_PATH_GRAPH),
  }]),
  selectReply([{
    graph: uri(STANDARD_DEVIATION_SPEC_GRAPH),
    predicate: uri("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
    object: uri("https://w3id.org/project-chemie-digital/ontology/Concept"),
  }]),
];

for (const args of [[], ["--profile", "chemometrics"]]) {
  test(`Chemometrics CLI preserves all four SELECT checks (${args.length ? "explicit" : "default"})`, { timeout: 20_000 }, async () => {
    await withStub(chemometricsReplies, async (endpoint, requests) => {
      const result = await runCli(args, endpoint);
      assert.equal(result.code, 0, result.stderr);
      assert.match(result.stdout, /Profile: chemometrics; reachability: confirmed/);
      assert.match(result.stdout, /Path steps: 9/);
      assert.match(result.stdout, /Course placements: 1/);
      assert.match(result.stdout, /Provenance statements: 1/);
      assertRequests(requests, [
        resourceQuery(STANDARD_DEVIATION_RESOURCE), standardDeviationPathQuery(),
        teachingOfferingCompositionQuery(DIGITAL_CHEMISTRY_TEACHING_OFFERING),
        provenanceQuery(STANDARD_DEVIATION_RESOURCE),
      ]);
    });
  });
}
