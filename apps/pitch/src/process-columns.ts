import type { SceneDocument } from "../../../packages/core/src/scene-document.ts";
import { addFlowVisualMotif } from "../../../packages/renderer-d3/src/flow-diagram.ts";
import { teachingTextMarkup } from "./teaching-text.ts";

interface ProcessColumn {
  readonly heading: string;
  readonly hue: number;
  readonly nodes: readonly string[];
}

interface ProcessColumns {
  readonly diagram: string;
  readonly columns: readonly ProcessColumn[];
}

export const anovaProcessColumns: ProcessColumns = {
  diagram: "ex:l7-intro-diagram-01",
  columns: [
    { heading: "Sampling", hue: 195, nodes: ["ex:l7-intro-node-01-1"] },
    { heading: "Sample preparation", hue: 273, nodes: ["ex:l7-intro-node-01-2", "ex:l7-intro-node-01-3", "ex:l7-intro-node-01-4"] },
    { heading: "Measurement + recovery calculation", hue: 29, nodes: ["ex:l7-intro-node-01-5"] },
  ],
};

export function mountProcessColumns(root: HTMLElement, documents: readonly SceneDocument[], layout: ProcessColumns) {
  for (const scene of documents.flatMap(document => document.scenes)) {
    for (const diagram of scene.blocks) {
      if (diagram.kind !== "diagram" || !diagram.source.some(source => source.resourceId === layout.diagram)) continue;
      const host = root.querySelector<HTMLElement>(`[data-diagram-block-id="${CSS.escape(diagram.id)}"]`);
      if (!host) continue;
      const nodes = new Map(diagram.nodes.map(node => [node.id, node]));
      const assigned = layout.columns.flatMap(column => column.nodes);
      if (new Set(assigned).size !== diagram.nodes.length || assigned.length !== diagram.nodes.length
          || assigned.some(id => !nodes.has(id))) continue;

      const grid = document.createElement("div");
      grid.className = "pcd-process-columns";
      grid.style.setProperty("--pcd-process-count", String(layout.columns.length));
      grid.setAttribute("role", "group");
      grid.setAttribute("aria-label", diagram.label);
      let entryIndex = 0;
      for (const column of layout.columns) {
        const panel = document.createElement("article");
        panel.className = "pcd-process-column";
        panel.style.setProperty("--pcd-process-hue", String(column.hue));
        const heading = document.createElement("h3");
        heading.textContent = column.heading;
        panel.append(heading);
        for (const id of column.nodes) {
          const node = nodes.get(id)!;
          const entry = document.createElement("div");
          entry.className = "pcd-process-entry";
          entry.dataset.resourceId = id;
          const header = document.createElement("header");
          const title = document.createElement("h4");
          title.textContent = node.label;
          const number = document.createElement("span");
          number.className = "pcd-process-number";
          number.textContent = String(++entryIndex).padStart(2, "0");
          number.setAttribute("aria-hidden", "true");
          header.append(number, title);
          if (node.visualMotif) {
            const ns = "http://www.w3.org/2000/svg";
            const icon = document.createElementNS(ns, "svg");
            icon.setAttribute("viewBox", "0 0 64 64");
            icon.setAttribute("aria-hidden", "true");
            const drawing = document.createElementNS(ns, "g");
            addFlowVisualMotif(drawing, node.visualMotif, 32, 32, 54);
            icon.append(drawing);
            header.append(icon);
          }
          entry.append(header);
          const points = node.description?.split(/\n/u).map(line => line.replace(/^\s*[◆•]\s*/u, "").trim()).filter(Boolean);
          if (points?.length) {
            const list = document.createElement("ul");
            for (const point of points) {
              const item = document.createElement("li");
              item.innerHTML = teachingTextMarkup(point);
              list.append(item);
            }
            entry.append(list);
          }
          panel.append(entry);
        }
        grid.append(panel);
      }
      host.replaceChildren(grid);
      host.removeAttribute("data-diagram-block-id");
      host.classList.remove("d3-diagram-host", "d3-flow-host");
      host.classList.add("pcd-process-host");
      host.tabIndex = 0;
      host.setAttribute("role", "region");
      host.setAttribute("aria-label", diagram.label);
    }
  }
}
