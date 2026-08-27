export const DEFAULT_SPARQL_ENDPOINT = "http://127.0.0.1:3030/chemie-digital/query";
export const STANDARD_DEVIATION_RESOURCE = "https://w3id.org/project-chemie-digital/resource/standard-deviation";
export const STANDARD_DEVIATION_PATH = "https://w3id.org/project-chemie-digital/resource/path-standard-deviation";
export const STANDARD_DEVIATION_PATH_GRAPH = "https://w3id.org/project-chemie-digital/graph/paths/standard-deviation";
export const STANDARD_DEVIATION_SPEC_GRAPH = "https://w3id.org/project-chemie-digital/graph/specifications/standard-deviation";

const RDF_TYPE = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";
const SKOS_PREF_LABEL = "http://www.w3.org/2004/02/skos/core#prefLabel";
const CD = "https://w3id.org/project-chemie-digital/ontology/";

export interface SparqlBindingValue {
  readonly type: "uri" | "literal" | "typed-literal" | "bnode";
  readonly value: string;
  readonly datatype?: string;
  readonly "xml:lang"?: string;
}

export interface SparqlSelectResults {
  readonly head: { readonly vars: readonly string[] };
  readonly results: {
    readonly bindings: readonly Readonly<Record<string, SparqlBindingValue>>[];
  };
}

export interface SparqlSelectTransport {
  select(query: string): Promise<SparqlSelectResults>;
}

export type RdfTerm =
  | { readonly kind: "iri"; readonly value: string }
  | {
      readonly kind: "literal";
      readonly value: string;
      readonly language?: string;
      readonly datatype?: string;
    }
  | { readonly kind: "blank-node"; readonly value: string };

export interface LanguageString {
  readonly value: string;
  readonly language?: string;
}

export interface SemanticResource {
  readonly id: string;
  readonly types: readonly string[];
  readonly labels: readonly LanguageString[];
}

export interface StandardDeviationPathStep {
  readonly id: string;
  readonly position: number;
  readonly sceneId: string;
}

export interface StandardDeviationPathSummary {
  readonly id: string;
  readonly graphId: string;
  readonly steps: readonly StandardDeviationPathStep[];
}

export interface NamedGraphStatement {
  readonly graphId: string;
  readonly predicate: string;
  readonly object: RdfTerm;
}

type FetchLike = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

function absoluteHttpIri(value: string): string {
  const url = new URL(value);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new TypeError(`Only absolute HTTP(S) IRIs are supported: ${value}`);
  }
  if (url.username || url.password) {
    throw new TypeError("IRIs containing credentials are not supported");
  }
  return url.href;
}

function iri(value: string): string {
  return `<${absoluteHttpIri(value)}>`;
}

function requireBinding(
  row: Readonly<Record<string, SparqlBindingValue>>,
  name: string,
): SparqlBindingValue {
  const value = row[name];
  if (!value) {
    throw new Error(`SPARQL result is missing required binding ?${name}`);
  }
  return value;
}

function requireUri(
  row: Readonly<Record<string, SparqlBindingValue>>,
  name: string,
): string {
  const value = requireBinding(row, name);
  if (value.type !== "uri") {
    throw new Error(`SPARQL binding ?${name} must be an IRI`);
  }
  return value.value;
}

function optionalLiteral(
  row: Readonly<Record<string, SparqlBindingValue>>,
  name: string,
): SparqlBindingValue | undefined {
  const value = row[name];
  if (!value) return undefined;
  if (value.type !== "literal" && value.type !== "typed-literal") {
    throw new Error(`SPARQL binding ?${name} must be a literal`);
  }
  return value;
}

function termFromBinding(value: SparqlBindingValue): RdfTerm {
  if (value.type === "uri") return { kind: "iri", value: value.value };
  if (value.type === "bnode") return { kind: "blank-node", value: value.value };
  return {
    kind: "literal",
    value: value.value,
    ...(value["xml:lang"] ? { language: value["xml:lang"] } : {}),
    ...(value.datatype ? { datatype: value.datatype } : {}),
  };
}

function assertSelectResults(value: unknown): asserts value is SparqlSelectResults {
  if (!value || typeof value !== "object") {
    throw new Error("Fuseki returned a non-object SPARQL JSON response");
  }
  const candidate = value as Partial<SparqlSelectResults>;
  if (!candidate.results || !Array.isArray(candidate.results.bindings)) {
    throw new Error("Fuseki returned malformed SPARQL SELECT JSON");
  }
}

export function resourceQuery(resourceId: string): string {
  const resource = iri(resourceId);
  return `SELECT ?type ?label WHERE {
  GRAPH ?graph {
    ${resource} <${RDF_TYPE}> ?type .
    OPTIONAL { ${resource} <${SKOS_PREF_LABEL}> ?label }
  }
}
ORDER BY STR(?type) LANG(?label) STR(?label)`;
}

export function standardDeviationPathQuery(): string {
  return `SELECT ?step ?position ?scene WHERE {
  GRAPH ${iri(STANDARD_DEVIATION_PATH_GRAPH)} {
    ${iri(STANDARD_DEVIATION_PATH)} <${CD}hasStep> ?step .
    ?step <${CD}position> ?position ;
          <${CD}usesScene> ?scene .
  }
}
ORDER BY ?position STR(?step)`;
}

export function provenanceQuery(resourceId: string): string {
  return `SELECT ?graph ?predicate ?object WHERE {
  GRAPH ?graph {
    ${iri(resourceId)} ?predicate ?object .
  }
}
ORDER BY STR(?graph) STR(?predicate) STR(?object)`;
}

export class FusekiHttpTransport implements SparqlSelectTransport {
  readonly endpoint: string;
  readonly #fetch: FetchLike;

  constructor(endpoint = DEFAULT_SPARQL_ENDPOINT, fetchImpl: FetchLike = globalThis.fetch) {
    this.endpoint = absoluteHttpIri(endpoint);
    this.#fetch = fetchImpl;
  }

  async select(query: string): Promise<SparqlSelectResults> {
    const response = await this.#fetch(this.endpoint, {
      method: "POST",
      headers: {
        accept: "application/sparql-results+json",
        "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: new URLSearchParams({ query }).toString(),
    });
    if (!response.ok) {
      throw new Error(`Fuseki SPARQL query failed with HTTP ${response.status}`);
    }
    const json: unknown = await response.json();
    assertSelectResults(json);
    return json;
  }
}

export class SemanticQueryClient {
  readonly #transport: SparqlSelectTransport;

  constructor(transport: SparqlSelectTransport) {
    this.#transport = transport;
  }

  async resource(resourceId: string): Promise<SemanticResource | null> {
    const result = await this.#transport.select(resourceQuery(resourceId));
    if (result.results.bindings.length === 0) return null;

    const types = new Set<string>();
    const labelKeys = new Set<string>();
    const labels: LanguageString[] = [];

    for (const row of result.results.bindings) {
      types.add(requireUri(row, "type"));
      const label = optionalLiteral(row, "label");
      if (!label) continue;
      const language = label["xml:lang"];
      const key = `${language ?? ""}\u0000${label.value}`;
      if (!labelKeys.has(key)) {
        labelKeys.add(key);
        labels.push({
          value: label.value,
          ...(language ? { language } : {}),
        });
      }
    }

    labels.sort((left, right) =>
      `${left.language ?? ""}\u0000${left.value}`.localeCompare(
        `${right.language ?? ""}\u0000${right.value}`,
      ),
    );

    return {
      id: absoluteHttpIri(resourceId),
      types: [...types].sort(),
      labels,
    };
  }

  async standardDeviationPath(): Promise<StandardDeviationPathSummary> {
    const result = await this.#transport.select(standardDeviationPathQuery());
    const steps = result.results.bindings.map((row) => {
      const positionValue = optionalLiteral(row, "position");
      if (!positionValue) {
        throw new Error("SPARQL result is missing required binding ?position");
      }
      const position = Number(positionValue.value);
      if (!Number.isSafeInteger(position) || position < 1) {
        throw new Error(`Invalid path position: ${positionValue.value}`);
      }
      return {
        id: requireUri(row, "step"),
        position,
        sceneId: requireUri(row, "scene"),
      };
    });

    steps.sort((left, right) =>
      left.position - right.position || left.id.localeCompare(right.id),
    );

    return {
      id: STANDARD_DEVIATION_PATH,
      graphId: STANDARD_DEVIATION_PATH_GRAPH,
      steps,
    };
  }

  async provenance(resourceId: string): Promise<readonly NamedGraphStatement[]> {
    const result = await this.#transport.select(provenanceQuery(resourceId));
    return result.results.bindings.map((row) => ({
      graphId: requireUri(row, "graph"),
      predicate: requireUri(row, "predicate"),
      object: termFromBinding(requireBinding(row, "object")),
    }));
  }
}
