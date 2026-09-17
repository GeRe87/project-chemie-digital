import type { DiagramBlock } from "../../core/src/scene-document.ts";
import { mountD3FlowDiagram, type D3FlowComponent, type D3FlowOptions, type D3FlowRenderModelResult } from "./flow-diagram.ts";
import { mountD3SequenceDiagram, type D3SequenceComponent } from "./sequence-diagram.ts";

export type D3DiagramComponent = D3FlowComponent | D3SequenceComponent;
export type D3DiagramMountResult = D3DiagramComponent | D3FlowRenderModelResult | ReturnType<typeof mountD3SequenceDiagram>;

/** Dispatches authored diagram semantics without binding callers to a diagram family. */
export function mountD3Diagram(host: unknown, block: DiagramBlock, options: D3FlowOptions): D3DiagramMountResult {
  return block.diagramType === "sequence" ? mountD3SequenceDiagram(host, block, options) : mountD3FlowDiagram(host, block, options);
}
