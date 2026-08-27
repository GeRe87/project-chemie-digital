import type {
  LearnerDisclosureState,
  LearnerDocumentState,
  LearnerPromptResponse,
} from "../../learner-state/src/index.ts";
import { renderSelfStudyHtml, type SelfStudyNodePlan, type SelfStudyRenderPlan, type SelfStudySectionPlan } from "./index.ts";

export interface SelfStudyController {
  readonly sourceDocumentId: string;
  captureLearnerState(): LearnerDocumentState;
  prepareLearnerStateRestore(state: LearnerDocumentState): () => void;
  destroy(): void;
}

interface NodeBinding {
  readonly section: SelfStudySectionPlan;
  readonly node: SelfStudyNodePlan;
}

function installProgressiveSequence(container: Element, listeners: Array<() => void>): void {
  const progressive = Array.from(container.querySelectorAll<HTMLDetailsElement>(':scope > details[data-disclosure-mode="progressive"]'))
    .sort((left, right) => Number(left.dataset.disclosureOrder ?? "0") - Number(right.dataset.disclosureOrder ?? "0"));

  progressive.forEach((details, index) => {
    if (index > 0) details.hidden = true;
    const summary = details.querySelector<HTMLElement>(":scope > summary");
    if (!summary) return;
    const onClick = (): void => {
      if (details.open) return;
      const next = progressive[index + 1];
      if (next) next.hidden = false;
    };
    summary.addEventListener("click", onClick);
    listeners.push(() => summary.removeEventListener("click", onClick));
  });
}

function collectBindings(section: SelfStudySectionPlan, nodes: readonly SelfStudyNodePlan[], output: NodeBinding[]): void {
  for (const node of nodes) {
    output.push({ section, node });
    if (node.kind === "group") collectBindings(section, node.children, output);
  }
}

function bindingKey(binding: { readonly section: SelfStudySectionPlan; readonly node: SelfStudyNodePlan }): string {
  return `${binding.section.sourceSceneId}\u0000${binding.node.sourceBlockId}`;
}

function recordKey(record: { readonly sceneId: string; readonly blockId: string }): string {
  return `${record.sceneId}\u0000${record.blockId}`;
}

function sectionElement(root: HTMLElement, section: SelfStudySectionPlan): HTMLElement {
  const element = Array.from(root.querySelectorAll<HTMLElement>(".self-study-section")).find((candidate) => candidate.id === section.id);
  if (!element) throw new Error(`Missing mounted self-study section ${section.sourceSceneId}`);
  return element;
}

function blockElement(root: HTMLElement, binding: NodeBinding): HTMLElement {
  const section = sectionElement(root, binding.section);
  const element = Array.from(section.querySelectorAll<HTMLElement>("[data-source-block-id]"))
    .find((candidate) => candidate.dataset.sourceBlockId === binding.node.sourceBlockId);
  if (!element) throw new Error(`Missing mounted self-study block ${binding.node.sourceBlockId}`);
  return element;
}

function optionAt(node: Extract<SelfStudyNodePlan, { readonly kind: "prompt" }>, input: HTMLInputElement): string {
  const index = Number(input.value);
  const option = node.options?.[index];
  if (!Number.isInteger(index) || option === undefined) throw new Error(`Invalid mounted choice option for ${node.sourceBlockId}`);
  return option;
}

function capturePrompt(root: HTMLElement, binding: NodeBinding): LearnerPromptResponse | undefined {
  const node = binding.node;
  if (node.kind !== "prompt") return undefined;
  const element = blockElement(root, binding);
  if (node.responseMode === "free-text" || node.responseMode === "reflection") {
    const textarea = element.querySelector<HTMLTextAreaElement>("textarea");
    if (!textarea) throw new Error(`Missing mounted prompt textarea ${node.sourceBlockId}`);
    if (textarea.value === "") return undefined;
    return {
      sceneId: binding.section.sourceSceneId,
      blockId: node.sourceBlockId,
      responseMode: node.responseMode,
      value: textarea.value,
    };
  }

  const checked = Array.from(element.querySelectorAll<HTMLInputElement>('input[type="radio"], input[type="checkbox"]'))
    .filter((input) => input.checked);
  if (node.responseMode === "single-choice") {
    const input = checked[0];
    if (!input) return undefined;
    return {
      sceneId: binding.section.sourceSceneId,
      blockId: node.sourceBlockId,
      responseMode: node.responseMode,
      value: optionAt(node, input),
    };
  }
  if (checked.length === 0) return undefined;
  return {
    sceneId: binding.section.sourceSceneId,
    blockId: node.sourceBlockId,
    responseMode: node.responseMode,
    value: checked.map((input) => optionAt(node, input)),
  };
}

function captureDisclosure(root: HTMLElement, binding: NodeBinding): LearnerDisclosureState | undefined {
  const node = binding.node;
  if (node.disclosureMode !== "optional" && node.disclosureMode !== "progressive") return undefined;
  const element = blockElement(root, binding);
  if (!(element instanceof HTMLDetailsElement)) throw new Error(`Missing mounted disclosure ${node.sourceBlockId}`);
  return {
    sceneId: binding.section.sourceSceneId,
    blockId: node.sourceBlockId,
    mode: node.disclosureMode,
    open: element.open,
    visible: !element.hidden,
  };
}

export function mountSelfStudyRenderPlan(root: HTMLElement, plan: SelfStudyRenderPlan): SelfStudyController {
  root.innerHTML = renderSelfStudyHtml(plan, { interactive: true });

  const listeners: Array<() => void> = [];
  const containers = [
    ...root.querySelectorAll<HTMLElement>(".self-study-section"),
    ...root.querySelectorAll<HTMLElement>(".self-study-group"),
  ];
  for (const container of containers) installProgressiveSequence(container, listeners);

  const bindings: NodeBinding[] = [];
  for (const section of plan.sections) collectBindings(section, section.nodes, bindings);
  const disclosureBaseline = new Map<string, { readonly open: boolean; readonly visible: boolean }>();
  for (const binding of bindings) {
    if (binding.node.disclosureMode !== "optional" && binding.node.disclosureMode !== "progressive") continue;
    const element = blockElement(root, binding);
    if (!(element instanceof HTMLDetailsElement)) throw new Error(`Missing mounted disclosure ${binding.node.sourceBlockId}`);
    disclosureBaseline.set(bindingKey(binding), { open: element.open, visible: !element.hidden });
  }

  return {
    sourceDocumentId: plan.sourceDocumentId,

    captureLearnerState(): LearnerDocumentState {
      const promptResponses = bindings.flatMap((binding) => {
        const response = capturePrompt(root, binding);
        return response ? [response] : [];
      });
      const disclosures = bindings.flatMap((binding) => {
        const state = captureDisclosure(root, binding);
        return state ? [state] : [];
      });
      return { documentId: plan.sourceDocumentId, promptResponses, disclosures };
    },

    prepareLearnerStateRestore(state: LearnerDocumentState): () => void {
      if (state.documentId !== plan.sourceDocumentId) throw new Error(`Learner-state document mismatch for ${plan.sourceDocumentId}`);
      const promptResponses = new Map(state.promptResponses.map((item) => [recordKey(item), item]));
      const disclosures = new Map(state.disclosures.map((item) => [recordKey(item), item]));
      const promptAssignments: Array<() => void> = [];
      const disclosureAssignments: Array<() => void> = [];
      const matchedPrompts = new Set<string>();
      const matchedDisclosures = new Set<string>();

      for (const binding of bindings) {
        const key = bindingKey(binding);
        const node = binding.node;
        if (node.kind === "prompt") {
          const element = blockElement(root, binding);
          const response = promptResponses.get(key);
          if (response) matchedPrompts.add(key);
          if (node.responseMode === "free-text" || node.responseMode === "reflection") {
            const textarea = element.querySelector<HTMLTextAreaElement>("textarea");
            if (!textarea) throw new Error(`Missing mounted prompt textarea ${node.sourceBlockId}`);
            const value = response && (response.responseMode === "free-text" || response.responseMode === "reflection") ? response.value : "";
            promptAssignments.push(() => { textarea.value = value; });
          } else {
            const inputs = Array.from(element.querySelectorAll<HTMLInputElement>('input[type="radio"], input[type="checkbox"]'));
            const selected = response
              ? new Set(response.responseMode === "multiple-choice" ? response.value : [response.value])
              : new Set<string>();
            const assignments = inputs.map((input) => ({ input, checked: selected.has(optionAt(node, input)) }));
            promptAssignments.push(() => {
              for (const assignment of assignments) assignment.input.checked = assignment.checked;
            });
          }
        }

        if (node.disclosureMode === "optional" || node.disclosureMode === "progressive") {
          const element = blockElement(root, binding);
          if (!(element instanceof HTMLDetailsElement)) throw new Error(`Missing mounted disclosure ${node.sourceBlockId}`);
          const baseline = disclosureBaseline.get(key);
          if (!baseline) throw new Error(`Missing disclosure baseline ${node.sourceBlockId}`);
          const stateValue = disclosures.get(key);
          if (stateValue) matchedDisclosures.add(key);
          const desired = stateValue ?? { open: baseline.open, visible: baseline.visible };
          disclosureAssignments.push(() => {
            element.hidden = !desired.visible;
            element.open = desired.open;
          });
        }
      }

      if (matchedPrompts.size !== promptResponses.size || matchedDisclosures.size !== disclosures.size) {
        throw new Error(`Learner-state contains unmatched interaction records for ${plan.sourceDocumentId}`);
      }

      return (): void => {
        for (const apply of promptAssignments) apply();
        for (const apply of disclosureAssignments) apply();
      };
    },

    destroy(): void {
      for (const dispose of listeners.splice(0)) dispose();
      root.replaceChildren();
    },
  };
}
