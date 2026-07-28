import type { Scene, SceneBlock, SourceReference } from "../../../packages/core/src/scene-document.ts";
import type { RdfDatasetSnapshot } from "../../../packages/core/src/knowledge-network.ts";
import {
  projectSceneKnowledgeNetwork,
  type SceneKnowledgeNetworkDocument,
  type SceneKnowledgeNetworkNode,
} from "../../../packages/core/src/scene-graph-projector.ts";
import type { SceneGraphProjectionRequest, SceneResourceBinding } from "../../../packages/core/src/scene-graph-view-contracts.ts";

const PREFIXES: Readonly<Record<string, string>> = Object.freeze({
  ex: "https://w3id.org/project-chemie-digital/resource/",
  cd: "https://w3id.org/project-chemie-digital/ontology/",
  skos: "http://www.w3.org/2004/02/skos/core#",
  rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
  rdfs: "http://www.w3.org/2000/01/rdf-schema#",
});

function absoluteIri(value: string): string {
  if (/^[A-Za-z][A-Za-z0-9+.-]*:\/\//.test(value) || value.startsWith("urn:")) return value;
  const separator = value.indexOf(":");
  if (separator < 1) return value;
  const prefix = PREFIXES[value.slice(0, separator)];
  return prefix ? `${prefix}${value.slice(separator + 1)}` : value;
}

function absoluteRelationPath(value: string): readonly string[] {
  return Object.freeze(value.split("/").map((part) => absoluteIri(part.replace(/@[A-Za-z0-9-]+$/, ""))));
}

function absoluteSource(source: SourceReference): SourceReference {
  return Object.freeze({
    resourceId: absoluteIri(source.resourceId),
    ...(source.provenanceIds ? { provenanceIds: Object.freeze(source.provenanceIds.map(absoluteIri)) } : {}),
    ...(source.relationPath ? { relationPath: absoluteRelationPath(source.relationPath).join("/") } : {}),
  });
}

export function absolutizeDatasetSnapshot(snapshot: RdfDatasetSnapshot): RdfDatasetSnapshot {
  return Object.freeze({
    ...snapshot,
    source: Object.freeze(snapshot.source.map(absoluteSource)),
    supportedPredicates: Object.freeze(snapshot.supportedPredicates.map(absoluteIri)),
    entities: Object.freeze(snapshot.entities.map((entity) => Object.freeze({
      ...entity,
      id: absoluteIri(entity.id),
      semanticTypes: Object.freeze(entity.semanticTypes.map(absoluteIri)),
      source: Object.freeze(entity.source.map(absoluteSource)),
    }))),
    statements: Object.freeze(snapshot.statements.map((statement) => Object.freeze({
      ...statement,
      sourceEntityId: absoluteIri(statement.sourceEntityId),
      predicateId: absoluteIri(statement.predicateId),
      targetEntityId: absoluteIri(statement.targetEntityId),
      source: Object.freeze(statement.source.map(absoluteSource)),
    }))),
  });
}

function blockBindings(scene: Scene, snapshot: RdfDatasetSnapshot): readonly SceneResourceBinding[] {
  const available = new Set(snapshot.entities.map((entity) => entity.id));
  return Object.freeze(scene.readingOrder.map((blockId) => {
    const block = scene.blocks.find((candidate) => candidate.id === blockId);
    if (!block) throw new Error(`Scene ${scene.id} references unknown block ${blockId}`);
    const resourceIds = [...new Set(block.source.map((source) => absoluteIri(source.resourceId)).filter((id) => available.has(id)))].sort();
    const provenanceResourceIds = [...new Set(block.source.flatMap((source) => source.provenanceIds ?? []).map(absoluteIri).filter((id) => available.has(id)))].sort();
    const relationPath = block.source.flatMap((source) => source.relationPath ? absoluteRelationPath(source.relationPath) : []);
    return Object.freeze({ version: "1.0" as const, blockId: block.id, resourceIds: Object.freeze(resourceIds), provenanceResourceIds: Object.freeze(provenanceResourceIds), relationPath: Object.freeze(relationPath) });
  }).filter((binding) => binding.resourceIds.length + binding.provenanceResourceIds.length > 0));
}

export function projectSceneSummary(snapshotInput: RdfDatasetSnapshot, scene: Scene): SceneKnowledgeNetworkDocument {
  const snapshot = absolutizeDatasetSnapshot(snapshotInput);
  const bindings = blockBindings(scene, snapshot);
  const supported = new Set(snapshot.supportedPredicates);
  const relationIds = [...new Set(bindings.flatMap((binding) => binding.relationPath).filter((id) => supported.has(id)))].sort();
  const request: SceneGraphProjectionRequest = Object.freeze({
    version: "1.0",
    sceneId: absoluteIri(scene.id),
    sceneRevision: snapshot.identity,
    bindings,
    directRelationAllowlist: Object.freeze({ version: "scene-relation-paths-1", relationIds: Object.freeze(relationIds) }),
    language: "de",
  });
  const result = projectSceneKnowledgeNetwork(snapshot, request);
  if (!result.document) throw new Error(result.diagnostics[0]?.message ?? "Wissenskontext konnte nicht erzeugt werden.");
  return result.document;
}

export interface GraphSummaryRelation {
  readonly id: string;
  readonly text: string;
}
export interface GraphSummaryModel {
  readonly label: string;
  readonly selected: readonly SceneKnowledgeNetworkNode[];
  readonly related: readonly SceneKnowledgeNetworkNode[];
  readonly relations: readonly GraphSummaryRelation[];
}

export function createGraphSummaryModel(document: SceneKnowledgeNetworkDocument): GraphSummaryModel {
  const nodesById = new Map(document.nodes.map((node) => [node.id, node]));
  const orderedNodes = document.accessibility.nodeReadingOrder.map((id) => {
    const node = nodesById.get(id);
    if (!node) throw new Error(`Graph reading order references unknown node ${id}`);
    return node;
  });
  const edgesById = new Map(document.edges.map((edge) => [edge.id, edge]));
  const relations = document.accessibility.edgeReadingOrder.map((id) => {
    const edge = edgesById.get(id);
    if (!edge) throw new Error(`Graph reading order references unknown relation ${id}`);
    const source = nodesById.get(edge.sourceNodeId);
    const target = nodesById.get(edge.targetNodeId);
    if (!source || !target) throw new Error(`Relation ${id} references an unknown node`);
    return Object.freeze({ id, text: `${source.label} — ${edge.label} → ${target.label}` });
  });
  return Object.freeze({
    label: document.accessibility.label ?? "Wissenskontext der aktuellen Szene",
    selected: Object.freeze(orderedNodes.filter((node) => node.classification === "selected")),
    related: Object.freeze(orderedNodes.filter((node) => node.classification === "related")),
    relations: Object.freeze(relations),
  });
}

export interface GraphSummaryShellPort {
  currentSceneId(): string | null;
  showPresentation(): void;
  hidePresentation(): void;
  renderSummary(model: GraphSummaryModel): void;
  showError(message: string): void;
  focusSummaryHeading(): void;
  focusInvoker(): void;
}

export function createGraphSummaryShellController(options: {
  readonly documents: readonly { readonly scenes: readonly Scene[] }[];
  readonly snapshot: RdfDatasetSnapshot;
  readonly port: GraphSummaryShellPort;
}) {
  let destroyed = false;
  return Object.freeze({
    open(): void {
      if (destroyed) return;
      const sceneId = options.port.currentSceneId();
      const scene = options.documents.flatMap((document) => document.scenes).find((candidate) => candidate.id === sceneId);
      if (!scene) { options.port.showError("Die aktuelle Präsentationsszene konnte nicht bestimmt werden."); options.port.showPresentation(); return; }
      try {
        const model = createGraphSummaryModel(projectSceneSummary(options.snapshot, scene));
        options.port.renderSummary(model);
        options.port.hidePresentation();
        options.port.focusSummaryHeading();
      } catch (error) {
        options.port.showError(error instanceof Error ? error.message : "Wissenskontext konnte nicht erzeugt werden.");
        options.port.showPresentation();
      }
    },
    close(): void {
      if (destroyed) return;
      options.port.showPresentation();
      options.port.focusInvoker();
    },
    destroy(): void { destroyed = true; },
  });
}

function appendNodeList(parent: HTMLElement, heading: string, nodes: readonly SceneKnowledgeNetworkNode[]): void {
  const section = document.createElement("section");
  const title = document.createElement("h2"); title.textContent = heading; section.append(title);
  const list = document.createElement("ul");
  for (const node of nodes) {
    const item = document.createElement("li");
    const strong = document.createElement("strong"); strong.textContent = node.label; item.append(strong);
    const identity = document.createElement("code"); identity.textContent = node.semanticEntityId; item.append(" ", identity);
    if (node.description) { const description = document.createElement("p"); description.textContent = node.description; item.append(description); }
    if (node.blockIds.length) { const blocks = document.createElement("p"); blocks.textContent = `Szenenblöcke: ${node.blockIds.join(", ")}`; item.append(blocks); }
    if (node.source.length) { const sources = document.createElement("p"); sources.textContent = `Quellen/Provenienz: ${node.source.map((source) => source.resourceId).join(", ")}`; item.append(sources); }
    list.append(item);
  }
  if (!nodes.length) { const empty = document.createElement("p"); empty.textContent = "Keine Ressourcen in dieser Gruppe."; section.append(empty); }
  else section.append(list);
  parent.append(section);
}

export function mountGraphSummaryShell(options: {
  readonly root: HTMLElement;
  readonly presentation: HTMLElement;
  readonly documents: readonly { readonly scenes: readonly Scene[] }[];
  readonly snapshot: RdfDatasetSnapshot;
  readonly currentSceneId: () => string | null;
}): () => void {
  options.root.innerHTML = "";
  const openButton = document.createElement("button");
  openButton.id = "open-graph-summary";
  openButton.type = "button";
  openButton.textContent = "Wissenskontext anzeigen";
  openButton.setAttribute("aria-pressed", "false");
  const summary = document.createElement("main");
  summary.id = "graph-summary";
  summary.hidden = true;
  summary.setAttribute("aria-live", "polite");
  const heading = document.createElement("h1"); heading.tabIndex = -1; heading.textContent = "Wissenskontext der aktuellen Szene";
  const content = document.createElement("div");
  const closeButton = document.createElement("button"); closeButton.type = "button"; closeButton.textContent = "Zur Präsentation zurück";
  summary.append(heading, closeButton, content);
  const error = document.createElement("p"); error.hidden = true; error.setAttribute("role", "alert");
  options.root.append(openButton, error, summary);

  const port: GraphSummaryShellPort = {
    currentSceneId: options.currentSceneId,
    showPresentation: () => { options.presentation.hidden = false; summary.hidden = true; openButton.setAttribute("aria-pressed", "false"); },
    hidePresentation: () => { options.presentation.hidden = true; summary.hidden = false; error.hidden = true; openButton.setAttribute("aria-pressed", "true"); },
    renderSummary: (model) => {
      heading.textContent = model.label;
      content.innerHTML = "";
      appendNodeList(content, "In der aktuellen Szene verwendet", model.selected);
      appendNodeList(content, "Direkt verwandte, noch nicht präsentierte Ressourcen", model.related);
      const relations = document.createElement("section"); const relationHeading = document.createElement("h2"); relationHeading.textContent = "Relationen"; relations.append(relationHeading);
      const list = document.createElement("ul"); for (const relation of model.relations) { const item = document.createElement("li"); item.textContent = relation.text; list.append(item); }
      if (model.relations.length) relations.append(list); else { const empty = document.createElement("p"); empty.textContent = "Keine freigegebenen direkten Relationen."; relations.append(empty); }
      content.append(relations);
    },
    showError: (message) => { error.textContent = message; error.hidden = false; },
    focusSummaryHeading: () => heading.focus(),
    focusInvoker: () => openButton.focus(),
  };
  const controller = createGraphSummaryShellController({ documents: options.documents, snapshot: options.snapshot, port });
  openButton.addEventListener("click", () => controller.open());
  closeButton.addEventListener("click", () => controller.close());
  let destroyed = false;
  return () => { if (!destroyed) { destroyed = true; controller.destroy(); options.presentation.hidden = false; options.root.innerHTML = ""; } };
}
