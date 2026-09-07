import type { Scene, SourceReference } from "../../../packages/core/src/scene-document.ts";
import type { RdfDatasetSnapshot } from "../../../packages/core/src/knowledge-network.ts";
import {
  projectSceneKnowledgeNetwork,
  type SceneKnowledgeNetworkDocument,
  type SceneKnowledgeNetworkNode,
} from "../../../packages/core/src/scene-graph-projector.ts";
import type { SceneGraphProjectionRequest, SceneResourceBinding } from "../../../packages/core/src/scene-graph-view-contracts.ts";
import {
  createSvgD3Runtime,
  mountD3KnowledgeNetwork,
  type D3KnowledgeNetworkComponent,
  type D3KnowledgeNetworkOptions,
} from "../../../packages/renderer-d3/src/index.ts";

const PREFIXES: Readonly<Record<string, string>> = Object.freeze({
  ex: "https://w3id.org/project-chemie-digital/resource/",
  cd: "https://w3id.org/project-chemie-digital/ontology/",
  skos: "http://www.w3.org/2004/02/skos/core#",
  rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
  rdfs: "http://www.w3.org/2000/01/rdf-schema#",
});

const LANGUAGE_SUFFIX = /@([A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*)$/;

function absoluteIri(value: string): string {
  if (/^[A-Za-z][A-Za-z0-9+.-]*:\/\//.test(value) || value.startsWith("urn:")) return value;
  const separator = value.indexOf(":");
  if (separator < 1) return value;
  const prefix = PREFIXES[value.slice(0, separator)];
  return prefix ? `${prefix}${value.slice(separator + 1)}` : value;
}

function absoluteRelationPath(value: string): readonly string[] {
  const normalized = value.replace(/@[A-Za-z0-9-]+$/, "");
  if (/^[A-Za-z][A-Za-z0-9+.-]*:\/\//.test(normalized) || normalized.startsWith("urn:")) {
    return Object.freeze([normalized]);
  }
  return Object.freeze(normalized.split("/").filter(Boolean).map(absoluteIri));
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

export function sceneProjectionLanguage(scene: Scene): string {
  const languages = [...new Set(scene.blocks.flatMap((block) =>
    block.source.flatMap((source) => {
      if (!source.relationPath) return [];
      const match = LANGUAGE_SUFFIX.exec(source.relationPath);
      return match?.[1] ? [match[1].toLowerCase()] : [];
    }),
  ))].sort();
  if (languages.length === 0) {
    throw new Error(`Scene ${scene.id} has no authored language-bearing relation path`);
  }
  if (languages.length !== 1) {
    throw new Error(`Scene ${scene.id} has conflicting authored languages: ${languages.join(", ")}`);
  }
  return languages[0]!;
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
    language: sceneProjectionLanguage(scene),
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
  renderGraph(document: SceneKnowledgeNetworkDocument, options: D3KnowledgeNetworkOptions): void;
  updateGraphMode(mode: "graph" | "summary"): void;
  handleGraphKey(key: string): boolean;
  showError(message: string): void;
  focusSummaryHeading(): void;
  focusGraphHeading(): void;
  focusGraphNode(nodeId: string): void;
  focusInvoker(): void;
}

type ShellMode = "presentation" | "graph" | "summary";

function findScene(documents: readonly { readonly scenes: readonly Scene[] }[], sceneId: string | null): Scene {
  if (!sceneId) throw new Error("Die aktuelle Präsentationsszene konnte nicht bestimmt werden.");
  const scene = documents.flatMap((document) => document.scenes).find((candidate) => candidate.id === sceneId);
  if (!scene) throw new Error("Die aktuelle Präsentationsszene konnte nicht bestimmt werden.");
  return scene;
}

function preferredNodeId(document: SceneKnowledgeNetworkDocument): string | null {
  const selectedByOrder = document.accessibility.nodeReadingOrder.find((nodeId) =>
    document.nodes.some((node) => node.id === nodeId && node.classification === "selected"),
  );
  if (selectedByOrder) return selectedByOrder;
  return document.accessibility.nodeReadingOrder[0] ?? null;
}

export function createGraphSummaryShellController(options: {
  readonly documents: readonly { readonly scenes: readonly Scene[] }[];
  readonly snapshot: RdfDatasetSnapshot;
  readonly reducedMotion: boolean;
  readonly port: GraphSummaryShellPort;
}) {
  let destroyed = false;
  let currentMode: ShellMode = "presentation";
  let staticMode = options.reducedMotion;
  let currentDocument: SceneKnowledgeNetworkDocument | null = null;
  let currentSummary: GraphSummaryModel | null = null;

  function hydrateCurrentScene(): { document: SceneKnowledgeNetworkDocument; summary: GraphSummaryModel } {
    const scene = findScene(options.documents, options.port.currentSceneId());
    const document = projectSceneSummary(options.snapshot, scene);
    return { document, summary: createGraphSummaryModel(document) };
  }

  function graphOptions(): D3KnowledgeNetworkOptions {
    return {
      reducedMotion: options.reducedMotion,
      interactionPolicy: staticMode ? "static" : "keyboard",
    };
  }

  return Object.freeze({
    openGraph(): void {
      if (destroyed) return;
      try {
        const hydrated = hydrateCurrentScene();
        currentDocument = hydrated.document;
        currentSummary = hydrated.summary;
        options.port.renderSummary(hydrated.summary);
        options.port.renderGraph(hydrated.document, graphOptions());
        options.port.hidePresentation();
        options.port.updateGraphMode("graph");
        options.port.focusGraphHeading();
        const nodeId = preferredNodeId(hydrated.document);
        if (nodeId) options.port.focusGraphNode(nodeId);
        currentMode = "graph";
      } catch (error) {
        if (currentSummary) {
          options.port.hidePresentation();
          options.port.updateGraphMode("summary");
          options.port.focusSummaryHeading();
          currentMode = "summary";
        } else {
          options.port.showPresentation();
          currentMode = "presentation";
        }
        options.port.showError(error instanceof Error ? error.message : "Wissenskontext konnte nicht erzeugt werden.");
      }
    },
    open(): void {
      if (destroyed) return;
      try {
        const hydrated = hydrateCurrentScene();
        currentDocument = hydrated.document;
        currentSummary = hydrated.summary;
        options.port.renderSummary(hydrated.summary);
        options.port.hidePresentation();
        options.port.updateGraphMode("summary");
        options.port.focusSummaryHeading();
        currentMode = "summary";
      } catch (error) {
        options.port.showError(error instanceof Error ? error.message : "Wissenskontext konnte nicht erzeugt werden.");
        options.port.showPresentation();
        currentMode = "presentation";
      }
    },
    switchToGraph(): void {
      if (destroyed || !currentDocument) return;
      try {
        options.port.renderGraph(currentDocument, graphOptions());
        options.port.updateGraphMode("graph");
        options.port.focusGraphHeading();
        const nodeId = preferredNodeId(currentDocument);
        if (nodeId) options.port.focusGraphNode(nodeId);
        currentMode = "graph";
      } catch (error) {
        options.port.showError(error instanceof Error ? error.message : "Graphansicht konnte nicht gerendert werden.");
        options.port.updateGraphMode("summary");
        options.port.focusSummaryHeading();
        currentMode = "summary";
      }
    },
    switchToSummary(): void {
      if (destroyed) return;
      options.port.updateGraphMode("summary");
      options.port.focusSummaryHeading();
      currentMode = "summary";
    },
    setStaticMode(value: boolean): void {
      if (destroyed) return;
      staticMode = value;
      if (currentMode === "graph" && currentDocument) {
        try {
          options.port.renderGraph(currentDocument, graphOptions());
          const nodeId = preferredNodeId(currentDocument);
          if (nodeId) options.port.focusGraphNode(nodeId);
        } catch (error) {
          options.port.showError(error instanceof Error ? error.message : "Graphansicht konnte nicht aktualisiert werden.");
          options.port.updateGraphMode("summary");
          currentMode = "summary";
        }
      }
    },
    handleGraphKey(key: string): boolean {
      if (destroyed || currentMode !== "graph") return false;
      return options.port.handleGraphKey(key);
    },
    close(): void {
      if (destroyed) return;
      options.port.showPresentation();
      options.port.focusInvoker();
      currentMode = "presentation";
    },
    destroy(): void {
      if (destroyed) return;
      destroyed = true;
      currentMode = "presentation";
      currentDocument = null;
      currentSummary = null;
    },
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
  const shellControls = document.createElement("div");
  shellControls.className = "graph-shell-controls";
  const openButton = document.createElement("button");
  openButton.id = "open-graph-summary";
  openButton.type = "button";
  openButton.textContent = "Textzusammenfassung anzeigen";
  openButton.setAttribute("aria-pressed", "false");
  const openGraphButton = document.createElement("button");
  openGraphButton.id = "open-graph-visual";
  openGraphButton.type = "button";
  openGraphButton.textContent = "Graphansicht anzeigen";
  openGraphButton.setAttribute("aria-pressed", "false");

  const panel = document.createElement("main");
  panel.id = "graph-shell-panel";
  panel.hidden = true;
  panel.setAttribute("aria-live", "polite");
  const heading = document.createElement("h1");
  heading.tabIndex = -1;
  heading.textContent = "Wissenskontext der aktuellen Szene";
  const modeControls = document.createElement("div");
  modeControls.className = "graph-mode-controls";
  const switchSummaryButton = document.createElement("button");
  switchSummaryButton.type = "button";
  switchSummaryButton.textContent = "Textmodus";
  const switchGraphButton = document.createElement("button");
  switchGraphButton.type = "button";
  switchGraphButton.textContent = "Graphmodus";
  const staticToggleLabel = document.createElement("label");
  staticToggleLabel.className = "graph-static-toggle";
  const staticToggle = document.createElement("input");
  staticToggle.type = "checkbox";
  staticToggle.id = "graph-static-mode";
  staticToggle.checked = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const staticToggleText = document.createElement("span");
  staticToggleText.textContent = "Statischer Modus";
  staticToggleLabel.append(staticToggle, staticToggleText);
  modeControls.append(switchSummaryButton, switchGraphButton, staticToggleLabel);

  const graphHost = document.createElement("section");
  graphHost.id = "graph-visual";
  graphHost.setAttribute("aria-label", "Graphische Wissensnetz-Ansicht");
  graphHost.hidden = true;
  const summary = document.createElement("section");
  summary.id = "graph-summary";
  summary.hidden = true;
  const summaryHeading = document.createElement("h2");
  summaryHeading.tabIndex = -1;
  summaryHeading.textContent = "Textuelle Zusammenfassung";
  const content = document.createElement("div");
  summary.append(summaryHeading, content);

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.textContent = "Zur Präsentation zurück";
  panel.append(heading, modeControls, closeButton, graphHost, summary);

  const error = document.createElement("p"); error.hidden = true; error.setAttribute("role", "alert");
  shellControls.append(openButton, openGraphButton);
  options.root.append(shellControls, error, panel);

  const runtime = createSvgD3Runtime();
  let component: D3KnowledgeNetworkComponent | null = null;
  let lastInvoker: HTMLButtonElement = openButton;

  const destroyGraph = (): void => {
    component?.destroy();
    component = null;
    graphHost.innerHTML = "";
  };

  const port: GraphSummaryShellPort = {
    currentSceneId: options.currentSceneId,
    showPresentation: () => {
      options.presentation.hidden = false;
      panel.hidden = true;
      openButton.setAttribute("aria-pressed", "false");
      openGraphButton.setAttribute("aria-pressed", "false");
      destroyGraph();
    },
    hidePresentation: () => {
      options.presentation.hidden = true;
      panel.hidden = false;
      error.hidden = true;
    },
    renderSummary: (model) => {
      heading.textContent = model.label;
      summaryHeading.textContent = `${model.label} (autoritativ)`;
      content.innerHTML = "";
      appendNodeList(content, "In der aktuellen Szene verwendet", model.selected);
      appendNodeList(content, "Direkt verwandte, noch nicht präsentierte Ressourcen", model.related);
      const relations = document.createElement("section"); const relationHeading = document.createElement("h2"); relationHeading.textContent = "Relationen"; relations.append(relationHeading);
      const list = document.createElement("ul"); for (const relation of model.relations) { const item = document.createElement("li"); item.textContent = relation.text; list.append(item); }
      if (model.relations.length) relations.append(list); else { const empty = document.createElement("p"); empty.textContent = "Keine freigegebenen direkten Relationen."; relations.append(empty); }
      content.append(relations);
    },
    renderGraph: (document, renderOptions) => {
      destroyGraph();
      const mounted = mountD3KnowledgeNetwork(graphHost, document, renderOptions, runtime);
      if (!("handleKey" in mounted)) {
        throw new Error(mounted.diagnostics[0]?.message ?? "Graphansicht konnte nicht erzeugt werden.");
      }
      component = mounted;
    },
    updateGraphMode: (mode) => {
      if (mode === "graph") {
        graphHost.hidden = false;
        summary.hidden = true;
        openGraphButton.setAttribute("aria-pressed", "true");
        openButton.setAttribute("aria-pressed", "false");
      } else {
        graphHost.hidden = true;
        summary.hidden = false;
        openGraphButton.setAttribute("aria-pressed", "false");
        openButton.setAttribute("aria-pressed", "true");
      }
    },
    handleGraphKey: (key) => component?.handleKey(key) ?? false,
    showError: (message) => { error.textContent = message; error.hidden = false; },
    focusSummaryHeading: () => summaryHeading.focus(),
    focusGraphHeading: () => heading.focus(),
    focusGraphNode: (nodeId) => component?.focusNode(nodeId),
    focusInvoker: () => lastInvoker.focus(),
  };
  const controller = createGraphSummaryShellController({
    documents: options.documents,
    snapshot: options.snapshot,
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    port,
  });

  const onSummaryOpen = (): void => {
    lastInvoker = openButton;
    controller.open();
  };
  const onGraphOpen = (): void => {
    lastInvoker = openGraphButton;
    controller.openGraph();
  };
  const onClose = (): void => controller.close();
  const onSwitchSummary = (): void => controller.switchToSummary();
  const onSwitchGraph = (): void => controller.switchToGraph();
  const onStaticToggle = (): void => controller.setStaticMode(staticToggle.checked);
  const onPanelKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Escape") {
      event.preventDefault();
      controller.close();
      return;
    }
    if (controller.handleGraphKey(event.key)) event.preventDefault();
  };

  openButton.addEventListener("click", onSummaryOpen);
  openGraphButton.addEventListener("click", onGraphOpen);
  closeButton.addEventListener("click", onClose);
  switchSummaryButton.addEventListener("click", onSwitchSummary);
  switchGraphButton.addEventListener("click", onSwitchGraph);
  staticToggle.addEventListener("change", onStaticToggle);
  panel.addEventListener("keydown", onPanelKeyDown);

  let destroyed = false;
  return () => {
    if (destroyed) return;
    destroyed = true;
    panel.removeEventListener("keydown", onPanelKeyDown);
    openButton.removeEventListener("click", onSummaryOpen);
    openGraphButton.removeEventListener("click", onGraphOpen);
    closeButton.removeEventListener("click", onClose);
    switchSummaryButton.removeEventListener("click", onSwitchSummary);
    switchGraphButton.removeEventListener("click", onSwitchGraph);
    staticToggle.removeEventListener("change", onStaticToggle);
    destroyGraph();
    controller.destroy();
    options.presentation.hidden = false;
    options.root.innerHTML = "";
  };
}
