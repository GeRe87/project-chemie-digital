import type {
  ChartBlock,
  CodeBlock,
  Scene,
  SceneDocument,
  SourceReference,
} from "../../../packages/core/src/scene-document.ts";
import type { RdfDatasetSnapshot } from "../../../packages/core/src/knowledge-network.ts";

const SHOWS_RESOURCE = "cd:showsResource";

export type SemanticMultiViewStage = "semantic" | "table" | "chart";

export interface SemanticMultiViewProjection {
  readonly sceneId: string;
  readonly codeBlock: CodeBlock;
  readonly chartBlock: ChartBlock;
}

export interface SemanticTableRow {
  readonly id: string;
  readonly cells: readonly string[];
  readonly source: readonly SourceReference[];
}

export interface SemanticTableModel {
  readonly label: string;
  readonly columns: readonly string[];
  readonly rows: readonly SemanticTableRow[];
}

function uniqueSources(values: readonly SourceReference[]): readonly SourceReference[] {
  const seen = new Set<string>();
  const result: SourceReference[] = [];
  for (const source of values) {
    const key = JSON.stringify(source);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(source);
  }
  return result;
}

function axisLabel(label: string, unit?: string): string {
  return unit ? `${label} (${unit})` : label;
}

export function semanticMultiViewStage(step: number): SemanticMultiViewStage {
  const normalized = Math.max(0, Math.min(2, Math.trunc(Number.isFinite(step) ? step : 0)));
  return normalized === 0 ? "semantic" : normalized === 1 ? "table" : "chart";
}

export function semanticTableModel(block: ChartBlock): SemanticTableModel {
  if (block.chartType === "bar") {
    return {
      label: block.label,
      columns: [axisLabel(block.xAxis.label, block.xAxis.unit), axisLabel(block.yAxis.label, block.yAxis.unit)],
      rows: block.data.map((datum) => ({
        id: datum.id,
        cells: [datum.category, String(datum.value)],
        source: datum.source,
      })),
    };
  }

  return {
    label: block.label,
    columns: ["Series", axisLabel(block.xAxis.label, block.xAxis.unit), axisLabel(block.yAxis.label, block.yAxis.unit)],
    rows: block.series.flatMap((series) => series.data.map((datum) => ({
      id: `${series.id}:${datum.id}`,
      cells: [series.label, String(datum.x), String(datum.y)],
      source: uniqueSources([...series.source, ...datum.source]),
    }))),
  };
}

export function semanticMultiViewProjection(
  scene: Scene,
  snapshot: RdfDatasetSnapshot,
): SemanticMultiViewProjection | undefined {
  const codeBlocks = scene.blocks.filter(
    (block): block is CodeBlock => block.kind === "code" && block.language.toLowerCase() === "trig",
  );
  const chartBlocks = scene.blocks.filter(
    (block): block is ChartBlock => block.kind === "chart",
  );

  for (const codeBlock of codeBlocks) {
    const sourceIds = new Set(codeBlock.source.map((source) => source.resourceId));
    const shownResources = new Set(snapshot.statements
      .filter((statement) => sourceIds.has(statement.sourceEntityId) && statement.predicateId === SHOWS_RESOURCE)
      .map((statement) => statement.targetEntityId));

    for (const chartBlock of chartBlocks) {
      if (!chartBlock.source.some((source) => shownResources.has(source.resourceId))) continue;
      return { sceneId: scene.id, codeBlock, chartBlock };
    }
  }

  return undefined;
}

function setSourceAttributes(node: HTMLElement, sources: readonly SourceReference[]): void {
  const resourceIds = [...new Set(sources.map((source) => source.resourceId))];
  const provenanceIds = [...new Set(sources.flatMap((source) => source.provenanceIds ?? []))];
  const relationPaths = [...new Set(sources.flatMap((source) => source.relationPath ? [source.relationPath] : []))];
  if (resourceIds.length) node.dataset.resourceId = resourceIds.join(" ");
  if (provenanceIds.length) node.dataset.provenanceIds = provenanceIds.join(" ");
  if (relationPaths.length) node.dataset.relationPath = relationPaths.join(" ");
}

function tableStage(block: ChartBlock): HTMLElement {
  const model = semanticTableModel(block);
  const shell = document.createElement("div");
  shell.className = "pcd-semantic-multi-view-stage pcd-semantic-table-stage";
  shell.dataset.semanticView = "table";
  setSourceAttributes(shell, block.source);

  const eyebrow = document.createElement("div");
  eyebrow.className = "pcd-semantic-view-eyebrow";
  eyebrow.textContent = "TABLE VIEW";

  const table = document.createElement("table");
  table.className = "pcd-semantic-table";
  const caption = document.createElement("caption");
  caption.textContent = model.label;
  table.append(caption);

  const head = document.createElement("thead");
  const headRow = document.createElement("tr");
  for (const column of model.columns) {
    const cell = document.createElement("th");
    cell.scope = "col";
    cell.textContent = column;
    headRow.append(cell);
  }
  head.append(headRow);
  table.append(head);

  const body = document.createElement("tbody");
  for (const row of model.rows) {
    const tr = document.createElement("tr");
    tr.dataset.semanticRowId = row.id;
    setSourceAttributes(tr, row.source);
    row.cells.forEach((value, index) => {
      const cell = document.createElement(index === 0 ? "th" : "td");
      if (index === 0) cell.setAttribute("scope", "row");
      cell.textContent = value;
      tr.append(cell);
    });
    body.append(tr);
  }
  table.append(body);
  shell.append(eyebrow, table);
  return shell;
}

function setStageState(element: HTMLElement, active: boolean): void {
  element.classList.toggle("pcd-semantic-multi-view-active", active);
  element.classList.toggle("pcd-semantic-multi-view-inactive", !active);
  element.setAttribute("aria-hidden", String(!active));
}

function stageRail(): HTMLElement {
  const rail = document.createElement("div");
  rail.className = "pcd-semantic-multi-view-rail";
  rail.setAttribute("role", "group");
  rail.setAttribute("aria-label", "Presentation views");
  for (const [stage, label] of [
    ["semantic", "01 · SEMANTIC"],
    ["table", "02 · TABLE"],
    ["chart", "03 · CHART"],
  ] as const) {
    const item = document.createElement("span");
    item.className = "pcd-semantic-multi-view-rail-item";
    item.dataset.semanticView = stage;
    item.textContent = label;
    rail.append(item);
  }
  return rail;
}

function sceneElement(root: HTMLElement, sceneId: string): HTMLElement | undefined {
  return Array.from(root.querySelectorAll<HTMLElement>("section"))
    .find((section) => section.id === sceneId);
}

function blockHost(section: HTMLElement, attribute: string, blockId: string): HTMLElement | undefined {
  return Array.from(section.querySelectorAll<HTMLElement>(`[${attribute}]`))
    .find((candidate) => candidate.getAttribute(attribute) === blockId);
}

export function mountSemanticMultiViews(
  root: HTMLElement,
  documents: readonly SceneDocument[],
  snapshot: RdfDatasetSnapshot,
): () => void {
  const cleanups: Array<() => void> = [];

  for (const sceneDocument of documents) {
    for (const scene of sceneDocument.scenes) {
      const projection = semanticMultiViewProjection(scene, snapshot);
      if (!projection) continue;

      const section = sceneElement(root, scene.id);
      const codeHost = section ? blockHost(section, "data-code-block-id", projection.codeBlock.id) : undefined;
      const chartHost = section ? blockHost(section, "data-chart-block-id", projection.chartBlock.id) : undefined;
      if (!section || !codeHost || !chartHost) continue;

      const originalChartStepCount = chartHost.getAttribute("data-presentation-step-count");
      const originalChartStepHost = chartHost.getAttribute("data-presentation-step-host");
      const chartFinalStep = Number(originalChartStepCount ?? 0);
      if (Number.isFinite(chartFinalStep) && chartFinalStep > 0) {
        chartHost.dispatchEvent(new CustomEvent("pcd-presentation-step", {
          bubbles: false,
          detail: { step: chartFinalStep },
        }));
      }
      chartHost.removeAttribute("data-presentation-step-count");
      chartHost.removeAttribute("data-presentation-step-host");

      const codeMarker = document.createComment(`semantic-multi-view:${projection.codeBlock.id}`);
      const chartMarker = document.createComment(`semantic-multi-view:${projection.chartBlock.id}`);
      codeHost.before(codeMarker);
      chartHost.before(chartMarker);

      const rail = stageRail();
      const frame = document.createElement("div");
      frame.className = "pcd-semantic-multi-view-frame";
      const table = tableStage(projection.chartBlock);

      codeHost.classList.add("pcd-semantic-multi-view-stage", "pcd-semantic-source-stage");
      codeHost.dataset.semanticView = "semantic";
      chartHost.classList.add("pcd-semantic-multi-view-stage", "pcd-semantic-chart-stage");
      chartHost.dataset.semanticView = "chart";

      codeHost.before(frame);
      frame.append(codeHost, table, chartHost);
      frame.before(rail);

      const groupId = `semantic-multi-view:${scene.id}`;
      section.setAttribute("data-presentation-step-group", groupId);
      section.setAttribute("data-presentation-step-count", "2");
      section.setAttribute("data-semantic-multi-view", "true");

      const apply = (step: number): void => {
        const stage = semanticMultiViewStage(step);
        setStageState(codeHost, stage === "semantic");
        setStageState(table, stage === "table");
        setStageState(chartHost, stage === "chart");
        for (const item of rail.querySelectorAll<HTMLElement>("[data-semantic-view]")) {
          const active = item.dataset.semanticView === stage;
          item.classList.toggle("pcd-semantic-multi-view-rail-active", active);
          item.setAttribute("aria-current", active ? "step" : "false");
        }
        section.dataset.semanticView = stage;
        section.dataset.presentationStep = String(Math.max(0, Math.min(2, Math.trunc(step))));
      };

      const listener: EventListener = (event) => {
        const step = (event as CustomEvent<{ step?: unknown }>).detail?.step;
        if (typeof step === "number") apply(step);
      };
      section.addEventListener("pcd-presentation-step", listener);
      apply(0);

      cleanups.push(() => {
        section.removeEventListener("pcd-presentation-step", listener);
        section.removeAttribute("data-presentation-step-group");
        section.removeAttribute("data-presentation-step-count");
        section.removeAttribute("data-semantic-multi-view");
        section.removeAttribute("data-semantic-view");
        section.removeAttribute("data-presentation-step");

        codeHost.classList.remove(
          "pcd-semantic-multi-view-stage",
          "pcd-semantic-source-stage",
          "pcd-semantic-multi-view-active",
          "pcd-semantic-multi-view-inactive",
        );
        codeHost.removeAttribute("data-semantic-view");
        codeHost.removeAttribute("aria-hidden");
        chartHost.classList.remove(
          "pcd-semantic-multi-view-stage",
          "pcd-semantic-chart-stage",
          "pcd-semantic-multi-view-active",
          "pcd-semantic-multi-view-inactive",
        );
        chartHost.removeAttribute("data-semantic-view");
        chartHost.removeAttribute("aria-hidden");
        if (originalChartStepCount !== null) chartHost.setAttribute("data-presentation-step-count", originalChartStepCount);
        if (originalChartStepHost !== null) chartHost.setAttribute("data-presentation-step-host", originalChartStepHost);

        codeMarker.replaceWith(codeHost);
        chartMarker.replaceWith(chartHost);
        rail.remove();
        frame.remove();
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