import { renderSelfStudyHtml, type SelfStudyRenderPlan } from "./index.ts";

export interface SelfStudyController {
  destroy(): void;
}

function installProgressiveSequence(container: Element, listeners: Array<() => void>): void {
  const progressive = Array.from(container.querySelectorAll<HTMLDetailsElement>(':scope > details[data-disclosure-mode="progressive"]'))
    .sort((left, right) => Number(left.dataset.disclosureOrder ?? "0") - Number(right.dataset.disclosureOrder ?? "0"));

  progressive.forEach((details, index) => {
    if (index > 0) details.hidden = true;
    const onToggle = (): void => {
      if (!details.open) return;
      const next = progressive[index + 1];
      if (next) next.hidden = false;
    };
    details.addEventListener("toggle", onToggle);
    listeners.push(() => details.removeEventListener("toggle", onToggle));
  });
}

export function mountSelfStudyRenderPlan(root: HTMLElement, plan: SelfStudyRenderPlan): SelfStudyController {
  root.innerHTML = renderSelfStudyHtml(plan, { interactive: true });

  const listeners: Array<() => void> = [];
  const containers = [
    ...root.querySelectorAll<HTMLElement>(".self-study-section"),
    ...root.querySelectorAll<HTMLElement>(".self-study-group"),
  ];
  for (const container of containers) installProgressiveSequence(container, listeners);

  return {
    destroy(): void {
      for (const dispose of listeners.splice(0)) dispose();
      root.replaceChildren();
    },
  };
}
