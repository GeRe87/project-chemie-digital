import katex from "katex";
import type { DerivationStep, MathematicalDerivationDetail, SceneDocument } from "../../../packages/core/src/scene-document.ts";
import { renderDerivationExplanation, renderDerivationDetail } from "../../../packages/renderer-reveal/src/mathematical-derivation.ts";
import { createExplanationDialog } from "./explanation-dialog.ts";

/** Native modal semantics supplement the existing Reveal semantic-disclosure stages. */
export function mountMathematicalDerivations(root: HTMLElement, documents: readonly SceneDocument[]): () => void {
  const steps = new Map<string, DerivationStep>();
  const details = new Map<string, MathematicalDerivationDetail>();
  const visit = (blocks: SceneDocument["scenes"][number]["blocks"]) => {
    for (const block of blocks) {
      if (block.kind === "group") visit(block.children);
      if (block.kind === "math" && block.derivation) for (const step of block.derivation.steps) steps.set(step.id, step);
      if (block.kind === "math") for (const detail of block.derivationDetails ?? []) details.set(detail.id,detail);
    }
  };
  documents.forEach(d => d.scenes.forEach(s => visit(s.blocks)));
  const modal = createExplanationDialog("", "pcd-rule-dialog-title");
  const click = (event: MouseEvent) => {
    const button = (event.target as Element).closest<HTMLButtonElement>("button[data-derivation-step-id],button[data-derivation-detail-id]");
    if (!button || button.disabled) return;
    const step = steps.get(button.dataset.derivationStepId!);
    const detail = details.get(button.dataset.derivationDetailId!);
    if (!step && !detail) return;
    event.preventDefault(); event.stopPropagation();
    const render = (expression: string) => katex.renderToString(expression, {
      displayMode: true, output: "htmlAndMathml", strict: "warn", throwOnError: false, trust: false,
    });
    modal.open(detail?.label ?? step!.rule.label, detail ? renderDerivationDetail(detail,render) : renderDerivationExplanation(step!,render),button);
  };
  root.addEventListener("click", click);
  const detailKeyboard = (event: KeyboardEvent) => {
    if ((event.key === "Enter" || event.key === " ") && (event.target as Element).closest("button[data-derivation-detail-id]")) event.stopPropagation();
  };
  root.addEventListener("keydown",detailKeyboard);
  const cleanup: Array<() => void> = [];
  for (const host of root.querySelectorAll<HTMLElement>("[data-derivation-block-id]")) {
    const update = (event: Event) => {
      const stage = (event as CustomEvent<{ step: number }>).detail?.step ?? 0;
      for (const button of host.querySelectorAll<HTMLButtonElement>("button[data-stage-required]")) button.disabled = stage < Number(button.dataset.stageRequired);
    };
    host.addEventListener("pcd-presentation-step", update);
    const stopKeyboard = (event: KeyboardEvent) => {
      if ((event.key === "Enter" || event.key === " ") && (event.target as Element).closest("button")) event.stopPropagation();
    };
    host.addEventListener("keydown", stopKeyboard);
    const measure = () => {
      const work = host.querySelector<HTMLElement>(".derivation-work");
      if (!work || !host.getBoundingClientRect().width) return;
      if (work.dataset.derivationLayout !== "stacked" && [...host.querySelectorAll<HTMLElement>(".derivation-formula,.derivation-rule-math")].some(e => e.scrollWidth > e.clientWidth + 5)) work.dataset.derivationLayout = "stacked";
      host.dataset.derivationFits = String(host.scrollHeight <= host.clientHeight + 5);
    };
    const observer = new ResizeObserver(measure); observer.observe(host);
    cleanup.push(() => { host.removeEventListener("pcd-presentation-step", update); host.removeEventListener("keydown", stopKeyboard); observer.disconnect(); });
  }
  return () => {
    modal.destroy(); cleanup.forEach(f => f()); root.removeEventListener("click", click);
    root.removeEventListener("keydown",detailKeyboard);
  };
}
