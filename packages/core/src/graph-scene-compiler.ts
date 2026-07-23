import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  SCENE_DOCUMENT_VERSION,
  type SceneDocument,
  type SourceReference,
  validateSceneDocument,
} from "./scene-document.ts";

export const GRAPH_SCENE_COMPILER_VERSION = "1.0" as const;

const CD = "https://w3id.org/project-chemie-digital/ontology/";
const EX = "https://w3id.org/project-chemie-digital/resource/";
const SKOS = "http://www.w3.org/2004/02/skos/core#";
const SCHEMA = "https://schema.org/";

const SUPPORTED_ROLES = new Map([
  [`${CD}HeadingRole`, "heading"],
  [`${CD}QuotationRole`, "quotation"],
  [`${CD}CitationRole`, "citation"],
] as const);

type JsonObject = Record<string, unknown>;

export type GraphSceneDiagnosticCode =
  | "INVALID_DOCUMENT"
  | "MISSING_RESOURCE"
  | "AMBIGUOUS_LANGUAGE"
  | "MISSING_RELATION_TARGET"
  | "INVALID_ORDERING"
  | "UNSUPPORTED_ROLE"
  | "UNSUPPORTED_SELECTION_PATH"
  | "SCENE_CONTRACT_VIOLATION";

export interface GraphSceneDiagnostic {
  readonly code: GraphSceneDiagnosticCode;
  readonly resourceId?: string;
  readonly rule: string;
}

export interface GraphSceneCompilationResult {
  readonly document?: SceneDocument;
  readonly canonicalJson?: string;
  readonly diagnostics: readonly GraphSceneDiagnostic[];
}

export interface GraphSceneDataset {
  readonly conceptDocument: unknown;
  readonly resourceDocument: unknown;
  readonly sceneDocument: unknown;
}

function diagnostic(code: GraphSceneDiagnosticCode, rule: string, resourceId?: string): GraphSceneDiagnostic {
  return { code, rule, ...(resourceId ? { resourceId } : {}) };
}

function object(value: unknown, label: string): JsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be an object`);
  return value as JsonObject;
}

function array(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : value === undefined ? [] : [value];
}

function expand(value: unknown): string {
  if (typeof value !== "string") throw new Error("IRI must be a string");
  if (value.startsWith("cd:")) return CD + value.slice(3);
  if (value.startsWith("ex:")) return EX + value.slice(3);
  if (value.startsWith("skos:")) return SKOS + value.slice(5);
  if (value.startsWith("schema:")) return SCHEMA + value.slice(7);
  return value;
}

function compact(iri: string): string {
  if (iri.startsWith(EX)) return `ex:${iri.slice(EX.length)}`;
  if (iri.startsWith(CD)) return `cd:${iri.slice(CD.length)}`;
  if (iri.startsWith(SKOS)) return `skos:${iri.slice(SKOS.length)}`;
  if (iri.startsWith(SCHEMA)) return `schema:${iri.slice(SCHEMA.length)}`;
  return iri;
}

function nodes(document: unknown): readonly JsonObject[] {
  const root = object(document, "JSON-LD document");
  const values = root["@graph"] === undefined ? [root] : array(root["@graph"]);
  return values.map((value, index) => object(value, `JSON-LD node ${index}`));
}

function id(node: JsonObject): string {
  return expand(node.id ?? node["@id"]);
}

function indexDataset(dataset: GraphSceneDataset): Map<string, JsonObject> {
  const index = new Map<string, JsonObject>();
  for (const document of [dataset.conceptDocument, dataset.resourceDocument, dataset.sceneDocument]) {
    for (const node of nodes(document)) {
      const resourceId = id(node);
      if (index.has(resourceId)) throw new Error(`Duplicate resource ${compact(resourceId)}`);
      index.set(resourceId, node);
    }
  }
  return index;
}

function requireNode(index: ReadonlyMap<string, JsonObject>, resourceId: string): JsonObject {
  const node = index.get(resourceId);
  if (!node) throw Object.assign(new Error(`Missing resource ${compact(resourceId)}`), { code: "MISSING_RESOURCE", resourceId });
  return node;
}

function iri(node: JsonObject, property: string): string | undefined {
  const value = node[property];
  if (value === undefined) return undefined;
  if (Array.isArray(value)) {
    if (value.length !== 1) throw new Error(`${property} must have exactly one value`);
    return expand(value[0]);
  }
  return expand(value);
}

function literal(value: unknown, language: string | undefined, label: string): string {
  const candidates = array(value).map((entry) => {
    if (typeof entry === "string") return { value: entry, language: undefined };
    const item = object(entry, label);
    return { value: item["@value"], language: item["@language"] };
  }).filter((entry) => typeof entry.value === "string" && (language === undefined || entry.language === language));
  if (candidates.length !== 1) {
    throw Object.assign(new Error(`${label} requires exactly one${language ? ` ${language}` : ""} literal`), { code: "AMBIGUOUS_LANGUAGE" });
  }
  return candidates[0]!.value as string;
}

function positiveInteger(value: unknown, label: string): number {
  if (!Number.isInteger(value) || (value as number) < 1) throw Object.assign(new Error(`${label} must be a positive integer`), { code: "INVALID_ORDERING" });
  return value as number;
}

function source(resourceId: string, provenanceIds: readonly string[] = []): SourceReference {
  const compactResource = compact(resourceId);
  const provenance = [...new Set(provenanceIds.map(compact))].sort((left, right) => left.localeCompare(right));
  return provenance.length ? { resourceId: compactResource, provenanceIds: provenance } : { resourceId: compactResource };
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as JsonObject)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, canonical(child)]));
  }
  return value;
}

export function canonicalSceneDocumentJson(document: SceneDocument): string {
  return `${JSON.stringify(canonical(document), null, 2)}\n`;
}

export function compileGraphBackedScene(dataset: GraphSceneDataset, sceneId: string): GraphSceneCompilationResult {
  try {
    const index = indexDataset(dataset);
    const expandedSceneId = expand(sceneId);
    const sceneDefinition = requireNode(index, expandedSceneId);
    const focusId = iri(sceneDefinition, "focusConcept");
    if (!focusId) throw Object.assign(new Error("Scene focusConcept is required"), { code: "MISSING_RELATION_TARGET", resourceId: expandedSceneId });
    const focus = requireNode(index, focusId);
    const itemIds = array(sceneDefinition.hasSceneItem).map(expand);
    if (itemIds.length === 0) throw Object.assign(new Error("Scene hasSceneItem is required"), { code: "INVALID_ORDERING" });

    const ordered = itemIds.map((itemId) => {
      const node = requireNode(index, itemId);
      return { itemId, node, position: positiveInteger(node.position, `${compact(itemId)} position`) };
    }).sort((left, right) => left.position - right.position || left.itemId.localeCompare(right.itemId));
    if (new Set(ordered.map((item) => item.position)).size !== ordered.length || ordered.some((item, index) => item.position !== index + 1)) {
      throw Object.assign(new Error("Scene item positions must be unique and contiguous from 1"), { code: "INVALID_ORDERING" });
    }

    const blocks = ordered.map(({ itemId, node, position }) => {
      const roleId = iri(node, "communicativeRole");
      const role = roleId ? SUPPORTED_ROLES.get(roleId as keyof typeof SUPPORTED_ROLES) : undefined;
      if (!role) throw Object.assign(new Error(`Unsupported role ${roleId ? compact(roleId) : "<missing>"}`), { code: "UNSUPPORTED_ROLE", resourceId: itemId });
      const selectedId = iri(node, "selectsResource");
      if (!selectedId) throw Object.assign(new Error("selectsResource is required"), { code: "MISSING_RELATION_TARGET", resourceId: itemId });
      const selected = requireNode(index, selectedId);
      const language = typeof node.language === "string" ? node.language : undefined;
      const selectionPath = node.selectionPath;
      if (typeof selectionPath !== "string") throw Object.assign(new Error("selectionPath is required"), { code: "UNSUPPORTED_SELECTION_PATH", resourceId: itemId });

      if (role === "heading") {
        if (selectionPath !== "skos:prefLabel@de" || selectedId !== focusId) throw Object.assign(new Error("Heading must select the focus concept German prefLabel"), { code: "UNSUPPORTED_SELECTION_PATH", resourceId: itemId });
        return {
          id: `${compact(itemId)}--block`, kind: "prose" as const, source: [source(selectedId)],
          text: literal(selected.label ?? selected["skos:prefLabel"], language ?? "de", `${compact(selectedId)} prefLabel`),
          format: "plain" as const, disclosure: { order: position - 1, mode: "initial" as const },
          emphasis: "primary" as const, intent: { kind: "introduce" as const },
        };
      }

      const definitionId = iri(focus, "hasDefinition");
      if (!definitionId || !index.has(definitionId)) throw Object.assign(new Error("focusConcept hasDefinition target is missing"), { code: "MISSING_RELATION_TARGET", resourceId: focusId });
      const definition = requireNode(index, definitionId);
      const sourceId = iri(definition, "hasSource");
      if (!sourceId || !index.has(sourceId)) throw Object.assign(new Error("Definition hasSource target is missing"), { code: "MISSING_RELATION_TARGET", resourceId: definitionId });

      if (role === "quotation") {
        if (selectionPath !== "cd:hasDefinition" || selectedId !== definitionId) throw Object.assign(new Error("Quotation must select the focus concept definition"), { code: "UNSUPPORTED_SELECTION_PATH", resourceId: itemId });
        return {
          id: `${compact(itemId)}--block`, kind: "prose" as const, source: [source(selectedId, [sourceId])],
          text: literal(selected.body, language ?? "de", `${compact(selectedId)} body`), format: "plain" as const,
          disclosure: { order: position - 1, mode: "initial" as const }, emphasis: "primary" as const,
          intent: { kind: "explain" as const },
        };
      }

      if (selectionPath !== "cd:hasDefinition/cd:hasSource" || selectedId !== sourceId) throw Object.assign(new Error("Citation must select the definition source"), { code: "UNSUPPORTED_SELECTION_PATH", resourceId: itemId });
      return {
        id: `${compact(itemId)}--block`, kind: "prose" as const, source: [source(selectedId)],
        text: literal(selected["schema:name"], undefined, `${compact(selectedId)} schema:name`), format: "plain" as const,
        disclosure: { order: position - 1, mode: "initial" as const }, emphasis: "supporting" as const,
        intent: { kind: "emphasize" as const },
      };
    });

    const document: SceneDocument = {
      version: SCENE_DOCUMENT_VERSION,
      id: `${compact(expandedSceneId)}--scene-document`,
      sourcePathId: compact(expandedSceneId),
      scenes: [{
        id: `${compact(expandedSceneId)}--scene`,
        source: [source(expandedSceneId), source(focusId)],
        blocks,
        readingOrder: blocks.map((block) => block.id),
        accessibility: { label: blocks[0] && blocks[0].kind === "prose" ? blocks[0].text : compact(expandedSceneId) },
      }],
    };
    validateSceneDocument(document);
    return { document, canonicalJson: canonicalSceneDocumentJson(document), diagnostics: [] };
  } catch (error) {
    const candidate = error as Error & { code?: GraphSceneDiagnosticCode; resourceId?: string };
    return { diagnostics: [diagnostic(candidate.code ?? (candidate.name === "SceneContractError" ? "SCENE_CONTRACT_VIOLATION" : "INVALID_DOCUMENT"), candidate.message, candidate.resourceId ? compact(candidate.resourceId) : undefined)] };
  }
}

export async function loadRepositoryStandardDeviationScene(repositoryRoot: string): Promise<GraphSceneDataset> {
  const read = async (path: string) => JSON.parse(await readFile(resolve(repositoryRoot, path), "utf8")) as unknown;
  return {
    conceptDocument: await read("content/concepts/standard-deviation.jsonld"),
    resourceDocument: await read("content/resources/standard-deviation-resources.jsonld"),
    sceneDocument: await read("content/scenes/standard-deviation-definition-with-citation.jsonld"),
  };
}
