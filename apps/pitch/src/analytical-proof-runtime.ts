import type {
  DiagramBlock,
  LineChartBlock,
  Scene,
  SceneDocument,
} from "../../../packages/core/src/scene-document.ts";

export interface AnalyticalProofProjection {
  readonly sceneId: string;
  readonly chartBlock: LineChartBlock;
  readonly flowBlock: DiagramBlock;
  readonly flowNodeOrder: readonly string[];
  readonly stepCount: number;
}

export interface AnalyticalProofStepState {
  readonly step: number;
  readonly chartStep: number;
  readonly flowStep: number;
}

function clampStep(step: number, count: number): number {
  return Math.max(0, Math.min(count, Math.trunc(Number.isFinite(step) ? step : 0)));
}

export function linearFlowNodeOrder(block: DiagramBlock): readonly string[] | undefined {
  if (block.nodes.length < 2 || block.edges.length !== block.nodes.length - 1) return undefined;

  const nodeIds = new Set(block.nodes.map((node) => node.id));
  const indegree = new Map(block.nodes.map((node) => [node.id, 0]));
  const outgoing = new Map<string, string>();

  for (const edge of block.edges) {
    if (!nodeIds.has(edge.sourceNodeId) || !nodeIds.has(edge.targetNodeId)) return undefined;
    if (outgoing.has(edge.sourceNodeId)) return undefined;
    outgoing.set(edge.sourceNodeId, edge.targetNodeId);
    indegree.set(edge.targetNodeId, (indegree.get(edge.targetNodeId) ?? 0) + 1);
  }

  if ([...indegree.values()].some((value) => value > 1)) return undefined;
  const sources = block.nodes.filter((node) => (indegree.get(node.id) ?? 0) === 0);
  if (sources.length !== 1) return undefined;

  const order: string[] = [];
  const seen = new Set<string>();
  let current: string | undefined = sources[0]?.id;
  while (current) {
    if (seen.has(current)) return undefined;
    seen.add(current);
    order.push(current);
    current = outgoing.get(current);
  }

  return order.length === block.nodes.length ? order : undefined;
}

export function analyticalProofProjection(scene: Scene): AnalyticalProofProjection | undefined {
  const charts = scene.blocks.filter(
    (block): block is LineChartBlock => block.kind === "chart" && block.chartType === "line",
  );
  const flows = scene.blocks.filter(
    (block): block is DiagramBlock => block.kind === "diagram" && block.diagramType === "flow",
  );

  for (const chartBlock of charts) {
    const chartStepCount = 1 + (chartBlock.annotations?.length ?? 0);
    for (const flowBlock of flows) {
      const flowNodeOrder = linearFlowNodeOrder(flowBlock);
      if (!flowNodeOrder) continue;
      if (flowNodeOrder.length !== chartStepCount + 1) continue;
      return {
        sceneId: scene.id,
        chartBlock,
        flowBlock,
        flowNodeOrder,
        stepCount: flowNodeOrder.length,
      };
    }
  }

  return undefined;
}

export function analyticalProofStepState(
  step: number,
  chartStepCount: number,
  flowStepCount: number,
): AnalyticalProofStepState {
  const normalized = clampStep(step, flowStepCount);
  return Object.freeze({
    step: normalized,
    chartStep: Math.min(normalized, chartStepCount),
    flowStep: normalized,
  });
}

function numericAttribute(host: HTMLElement, name: string): number {
  const value = Number(host.getAttribute(name) ?? 0);
  return Number.isFinite(value) && value > 0 ? Math.trunc(value) : 0;
}

function sceneElement(root: HTMLElement, sceneId: string): HTMLElement | undefined {
  return Array.from(root.querySelectorAll<HTMLElement>("section"))
    .find((section) => section.id === sceneId);
}

function blockHost(section: HTMLElement, attribute: string, blockId: string): HTMLElement | undefined {
  return Array.from(section.querySelectorAll<HTMLElement>(`[${attribute}]`))
    .find((candidate) => candidate.getAttribute(attribute) === blockId);
}

export function mountAnalyticalProofSteps(
  root: HTMLElement,
  documents: readonly SceneDocument[],
): () => void {
  const cleanups: Array<() => void> = [];

  for (const sceneDocument of documents) {
    for (const scene of sceneDocument.scenes) {
      const projection = analyticalProofProjection(scene);
      if (!projection) continue;

      const section = sceneElement(root, scene.id);
      const chartHost = section
        ? blockHost(section, "data-chart-block-id", projection.chartBlock.id)
        : undefined;
      const flowHost = section
        ? blockHost(section, "data-flow-block-id", projection.flowBlock.id)
        : undefined;
      if (!section || !chartHost || !flowHost) continue;

      const chartStepCount = numericAttribute(chartHost, "data-presentation-step-count");
      const flowStepCount = numericAttribute(flowHost, "data-presentation-step-count");
      if (chartStepCount !== projection.stepCount - 1 || flowStepCount !== projection.stepCount) continue;

      const originalChartHost = chartHost.getAttribute("data-presentation-step-host");
      const originalFlowHost = flowHost.getAttribute("data-presentation-step-host");
      chartHost.removeAttribute("data-presentation-step-count");
      chartHost.removeAttribute("data-presentation-step-host");
      flowHost.removeAttribute("data-presentation-step-count");
      flowHost.removeAttribute("data-presentation-step-host");

      const groupId = `analytical-proof:${scene.id}`;
      section.setAttribute("data-presentation-step-group", groupId);
      section.setAttribute("data-presentation-step-count", String(projection.stepCount));
      section.setAttribute("data-analytical-proof", "true");
      chartHost.classList.add("pcd-analytical-proof-chart");
      flowHost.classList.add("pcd-analytical-proof-flow");

      const apply = (requestedStep: number): void => {
        const state = analyticalProofStepState(requestedStep, chartStepCount, flowStepCount);
        chartHost.dispatchEvent(new CustomEvent("pcd-presentation-step", {
          bubbles: false,
          detail: { step: state.chartStep },
        }));
        flowHost.dispatchEvent(new CustomEvent("pcd-presentation-step", {
          bubbles: false,
          detail: { step: state.flowStep },
        }));
        section.dataset.analyticalProofStep = String(state.step);
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
        section.removeAttribute("data-analytical-proof");
        section.removeAttribute("data-analytical-proof-step");
        chartHost.classList.remove("pcd-analytical-proof-chart");
        flowHost.classList.remove("pcd-analytical-proof-flow");
        chartHost.setAttribute("data-presentation-step-count", String(chartStepCount));
        flowHost.setAttribute("data-presentation-step-count", String(flowStepCount));
        if (originalChartHost !== null) chartHost.setAttribute("data-presentation-step-host", originalChartHost);
        if (originalFlowHost !== null) flowHost.setAttribute("data-presentation-step-host", originalFlowHost);
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
