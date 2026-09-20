import type { Scene, SceneDocument } from "../../../packages/core/src/scene-document.ts";

type SceneBlock = Scene["blocks"][number];
type ProseBlock = Extract<SceneBlock, { kind: "prose" }>;
type ListBlock = Extract<SceneBlock, { kind: "list" }>;

const CORE_RESOURCE = "ex:cogniflow-ring-core";
const CONCEPT_LAYER_RESOURCE = "ex:cogniflow-ring-concept-layer";
const SPECIFICATION_LAYER_RESOURCE = "ex:cogniflow-ring-specification-layer";
const NOTE_RESOURCE = "ex:cogniflow-ring-note";
const SVG_NS = "http://www.w3.org/2000/svg";

export interface SemanticRingModule {
  readonly title: string;
  readonly packageId: string;
  readonly details?: readonly string[];
}

export interface SemanticRingProjection {
  readonly sceneId: string;
  readonly coreText: string;
  readonly conceptModules: readonly SemanticRingModule[];
  readonly specificationModules: readonly SemanticRingModule[];
  readonly noteText: string;
}

function hasResource(block: SceneBlock, resourceId: string): boolean {
  return block.source.some((source) => source.resourceId === resourceId);
}

function proseByResource(scene: Scene, resourceId: string): ProseBlock | undefined {
  return scene.blocks.find(
    (block): block is ProseBlock => block.kind === "prose" && hasResource(block, resourceId),
  );
}

function listByResource(scene: Scene, resourceId: string): ListBlock | undefined {
  return scene.blocks.find(
    (block): block is ListBlock => block.kind === "list" && hasResource(block, resourceId),
  );
}

export function parseSemanticRingModule(text: string): SemanticRingModule {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  return Object.freeze({
    title: lines[0] ?? "",
    packageId: lines[1] ?? "",
    ...(lines.length > 2 ? { details: Object.freeze(lines.slice(2)) } : {}),
  });
}

export function semanticRingProjection(scene: Scene): SemanticRingProjection | undefined {
  const core = proseByResource(scene, CORE_RESOURCE);
  const concepts = listByResource(scene, CONCEPT_LAYER_RESOURCE);
  const specifications = listByResource(scene, SPECIFICATION_LAYER_RESOURCE);
  const note = proseByResource(scene, NOTE_RESOURCE);
  if (!core || !concepts || !specifications || !note) return undefined;

  return Object.freeze({
    sceneId: scene.id,
    coreText: core.text,
    conceptModules: concepts.items.map((item) => parseSemanticRingModule(item.text)),
    specificationModules: specifications.items.map((item) => parseSemanticRingModule(item.text)),
    noteText: note.text,
  });
}

function svg<K extends keyof SVGElementTagNameMap>(name: K): SVGElementTagNameMap[K] {
  return document.createElementNS(SVG_NS, name);
}

function setAttrs(node: Element, attrs: Readonly<Record<string, string | number>>): void {
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, String(value));
}

function appendText(
  parent: SVGElement,
  x: number,
  y: number,
  className: string,
  text: string,
  anchor: "start" | "middle" | "end" = "middle",
): SVGTextElement {
  const node = svg("text");
  setAttrs(node, { x, y, "text-anchor": anchor, class: className });
  node.textContent = text;
  parent.append(node);
  return node;
}

function appendMultilineText(
  parent: SVGElement,
  x: number,
  y: number,
  className: string,
  lines: readonly string[],
  lineHeight: number,
): SVGTextElement {
  const text = appendText(parent, x, y, className, "");
  for (const [index, line] of lines.entries()) {
    const tspan = svg("tspan");
    setAttrs(tspan, { x, dy: index === 0 ? 0 : lineHeight });
    tspan.textContent = line;
    text.append(tspan);
  }
  return text;
}

function pointOnRing(cx: number, cy: number, radius: number, angleDeg: number): readonly [number, number] {
  const radians = (angleDeg * Math.PI) / 180;
  return [cx + Math.cos(radians) * radius, cy + Math.sin(radians) * radius];
}

function shortLines(title: string): readonly string[] {
  if (title.length <= 14) return [title];
  const words = title.split(/\s+/);
  if (words.length < 2) return [title];
  const pivot = Math.ceil(words.length / 2);
  return [words.slice(0, pivot).join(" "), words.slice(pivot).join(" ")];
}

function sourceHosts(section: HTMLElement): readonly HTMLElement[] {
  return Array.from(section.children)
    .filter((child): child is HTMLElement => child instanceof HTMLElement)
    .filter((child) => {
      const ids = (child.dataset.resourceId ?? "").split(/\s+/);
      return [CORE_RESOURCE, CONCEPT_LAYER_RESOURCE, SPECIFICATION_LAYER_RESOURCE, NOTE_RESOURCE]
        .some((resourceId) => ids.includes(resourceId));
    });
}

function conceptTone(module: SemanticRingModule): number {
  if (module.packageId === "cf_concept_package") return 0;
  if (module.packageId === "cf_concept_processing") return 5;
  if (module.packageId === "cf_concept_service") return 6;
  if (module.packageId === "cf_concept_workspace") return 4;
  return 3;
}

function createRingSvg(projection: SemanticRingProjection): SVGSVGElement {
  const root = svg("svg");
  setAttrs(root, {
    viewBox: "0 0 1200 650",
    class: "pcd-semantic-rings-svg",
    role: "img",
    "aria-label": "CogniFlow architecture with core ontology, concept layer, and specification layer",
  });

  const cx = 600;
  const cy = 302;
  const conceptRadius = 158;
  const specificationRadius = 258;

  const specBand = svg("circle");
  setAttrs(specBand, { cx, cy, r: specificationRadius, class: "pcd-semantic-ring-band pcd-semantic-ring-band-specification" });
  root.append(specBand);
  const conceptBand = svg("circle");
  setAttrs(conceptBand, { cx, cy, r: conceptRadius, class: "pcd-semantic-ring-band pcd-semantic-ring-band-concept" });
  root.append(conceptBand);

  for (const radius of [conceptRadius, specificationRadius]) {
    const guide = svg("circle");
    setAttrs(guide, { cx, cy, r: radius, class: "pcd-semantic-ring-guide" });
    root.append(guide);
  }

  appendText(root, cx, 36, "pcd-semantic-layer-label", "SPECIFICATION LAYER");
  appendText(root, cx, 101, "pcd-semantic-layer-label", "CONCEPT LAYER");

  const coreLines = projection.coreText.split("\n").map((line) => line.trim()).filter(Boolean);

  const coreGroup = svg("g");
  const coreCircle = svg("circle");
  setAttrs(coreCircle, { cx, cy, r: 80, class: "pcd-semantic-core-node" });
  coreGroup.append(coreCircle);
  appendText(coreGroup, cx, cy - 24, "pcd-semantic-core-title", coreLines[0] ?? "CORE ONTOLOGY");
  appendText(coreGroup, cx, cy + 3, "pcd-semantic-core-package", coreLines[1] ?? "cf_ontology");
  appendText(coreGroup, cx, cy + 33, "pcd-semantic-core-term", coreLines[2] ?? "shared semantic grammar");
  root.append(coreGroup);

  const conceptAngles = [-90, -18, 54, 126, 198];
  const conceptPositions = new Map<string, readonly [number, number]>();
  projection.conceptModules.forEach((module, index) => {
    const angle = conceptAngles[index] ?? (-90 + index * (360 / Math.max(1, projection.conceptModules.length)));
    const [x, y] = pointOnRing(cx, cy, conceptRadius, angle);
    conceptPositions.set(module.packageId, [x, y]);
    const focus = module.packageId === "cf_concept_package" || module.packageId === "cf_concept_processing";
    const group = svg("g");
    setAttrs(group, {
      class: `pcd-semantic-concept-node pcd-semantic-tone-${conceptTone(module)}`,
      "data-focus": String(focus),
      "data-package-id": module.packageId,
    });
    const circle = svg("circle");
    setAttrs(circle, { cx: x, cy: y, r: focus ? 54 : 43 });
    group.append(circle);
    appendMultilineText(
      group,
      x,
      y - (shortLines(module.title).length > 1 ? 7 : 0),
      "pcd-semantic-concept-label",
      shortLines(module.title),
      14,
    );
    const title = svg("title");
    title.textContent = `${module.title} — ${module.packageId}`;
    group.append(title);
    root.append(group);
  });

  const labeledSpecificationModules = new Set([
    "cf_package_template_basic",
    "cf_service_mcp_server",
    "cf_runtime",
    "cf_bootstrap_core",
  ]);

  projection.specificationModules.forEach((module, index) => {
    const angle = -90 + index * (360 / Math.max(1, projection.specificationModules.length));
    const [x, y] = pointOnRing(cx, cy, specificationRadius, angle);
    const group = svg("g");
    setAttrs(group, {
      class: `pcd-semantic-spec-node pcd-semantic-tone-${index % 7}`,
      "data-package-id": module.packageId,
    });
    const circle = svg("circle");
    setAttrs(circle, { cx: x, cy: y, r: labeledSpecificationModules.has(module.packageId) ? 21 : 15 });
    group.append(circle);

    if (labeledSpecificationModules.has(module.packageId)) {
      const [labelX, labelY] = pointOnRing(cx, cy, specificationRadius + 37, angle);
      const anchor = Math.cos((angle * Math.PI) / 180) > 0.28
        ? "start"
        : Math.cos((angle * Math.PI) / 180) < -0.28
          ? "end"
          : "middle";
      appendText(group, labelX, labelY + 4, "pcd-semantic-spec-label", module.title, anchor);
    }

    const title = svg("title");
    title.textContent = `${module.title} — ${module.packageId}`;
    group.append(title);
    root.append(group);
  });

  const focusSpecs = [
    {
      packageId: "cf_concept_package",
      x: 10,
      y: 472,
      width: 400,
      tone: "#9E0142",
    },
    {
      packageId: "cf_concept_processing",
      x: 790,
      y: 472,
      width: 400,
      tone: "#3288BD",
    },
  ] as const;

  for (const spec of focusSpecs) {
    const module = projection.conceptModules.find((candidate) => candidate.packageId === spec.packageId);
    const position = conceptPositions.get(spec.packageId);
    if (!module || !position) continue;
    const [nodeX, nodeY] = position;
    const targetX = spec.x < cx ? spec.x + spec.width : spec.x;
    const targetY = spec.y + 54;
    const connector = svg("path");
    setAttrs(connector, {
      d: `M ${nodeX} ${nodeY} Q ${(nodeX + targetX) / 2} ${targetY - 24} ${targetX} ${targetY}`,
      class: "pcd-semantic-focus-link",
    });
    root.append(connector);

    const card = svg("rect");
    setAttrs(card, {
      x: spec.x,
      y: spec.y,
      width: spec.width,
      height: 118,
      rx: 12,
      ry: 12,
      class: "pcd-semantic-focus-card",
      stroke: spec.tone,
    });
    root.append(card);
    const title = appendText(root, spec.x + 20, spec.y + 27, "pcd-semantic-focus-eyebrow", module.title, "start");
    title.setAttribute("fill", spec.tone);
    appendText(root, spec.x + 20, spec.y + 50, "pcd-semantic-focus-package-id", module.packageId, "start");
    const detailLines = module.details ?? [];
    appendMultilineText(
      root,
      spec.x + 20,
      spec.y + 76,
      "pcd-semantic-focus-detail",
      detailLines.slice(0, 3),
      18,
    ).setAttribute("text-anchor", "start");
  }

  appendText(root, cx, 638, "pcd-semantic-ring-note", projection.noteText);
  return root;
}

function sceneElement(root: HTMLElement, sceneId: string): HTMLElement | undefined {
  return Array.from(root.querySelectorAll<HTMLElement>("section"))
    .find((section) => section.id === sceneId);
}

export function mountCogniflowSemanticRings(
  root: HTMLElement,
  documents: readonly SceneDocument[],
): () => void {
  const cleanups: Array<() => void> = [];

  for (const sceneDocument of documents) {
    for (const scene of sceneDocument.scenes) {
      const projection = semanticRingProjection(scene);
      if (!projection) continue;
      const section = sceneElement(root, scene.id);
      const heading = section?.querySelector<HTMLElement>("h2");
      if (!section || !heading) continue;

      const sources = sourceHosts(section);
      if (sources.length !== 4) continue;
      for (const source of sources) source.classList.add("pcd-semantic-rings-source");

      const host = document.createElement("div");
      host.className = "pcd-semantic-rings-host";
      host.dataset.semanticRingScene = scene.id;
      host.append(createRingSvg(projection));
      heading.after(host);
      section.dataset.semanticRings = "true";

      cleanups.push(() => {
        host.remove();
        section.removeAttribute("data-semantic-rings");
        for (const source of sources) source.classList.remove("pcd-semantic-rings-source");
      });
    }
  }

  let destroyed = false;
  return () => {
    if (destroyed) return;
    destroyed = true;
    for (const cleanup of cleanups.reverse()) cleanup();
  };
}
