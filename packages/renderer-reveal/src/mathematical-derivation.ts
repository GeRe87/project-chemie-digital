import { mathematicalDerivationText, type DerivationFormula, type DerivationStep, type MathematicalDerivationSection, type MathematicalDerivationDetail } from "../../core/src/scene-document.ts";

const escape = (text: string): string => text.replace(/[&<>"']/gu, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
export type MathematicalMarkup = (expression: string) => string;

/** Extent estimates select geometry, never transformations or scientific content. */
export function derivationLayout(section: MathematicalDerivationSection): "vertical" | "columns" {
  const equations = [section.steps[0]!.from, ...section.steps.map(step => step.to)];
  const extent = Math.max(...equations.map(f => f.expression.length));
  const lines = Math.max(...equations.map(f => f.expression.split("\\\\").length));
  return extent > 110 || lines > 1 ? "columns" : "vertical";
}

function staged(section: MathematicalDerivationSection, step: number): string {
  return step ? ` data-presentation-disclosure-mode="progressive" data-presentation-disclosure-step="${step}" data-presentation-disclosure-trigger-resource-id="${escape(section.id)}" data-presentation-disclosure-visible="false" aria-hidden="true"` : "";
}
function equation(formula: DerivationFormula, render: MathematicalMarkup, attributes = ""): string {
  return `<div class="derivation-formula" role="math" data-resource-id="${escape(formula.id)}"${attributes}>${formula.label ? `<div class="math-expression-label">${escape(formula.label)}</div>` : ""}${render(formula.expression)}</div>`;
}

export function renderMathematicalDerivation(section: MathematicalDerivationSection, render: MathematicalMarkup): string {
  const layout = derivationLayout(section);
  const formulas = [section.steps[0]!.from, ...section.steps.map(step => step.to)];
  const rows = formulas.map((formula, index) => {
    const step = section.steps[index];
    const formulaMarkup = equation(formula, render, ` style="grid-row:${index + 1}"${staged(section, index * 2)}`);
    const operation = step ? `<button type="button" class="derivation-operation" data-derivation-step-id="${escape(step.id)}" data-stage-required="${index * 2 + 1}" aria-label="${escape(step.operation)}: explain this step" aria-haspopup="dialog" disabled style="grid-row:${layout === "columns" && section.steps.length === 1 ? "1 / 3" : index + 1}"${staged(section, index * 2 + 1)}>
      <span class="derivation-operation-label">| ${escape(step.operation)}</span>
      <span class="derivation-rule-math">${render(step.rule.formula.expression)}</span>
      <span class="derivation-kind">${escape(step.kindLabel)}</span><span class="derivation-open-hint">Explain this step ↗</span></button>` : "";
    return formulaMarkup + operation;
  }).join("");
  const legend = section.legend.map(entry => `<div><dt><span class="symbol-math">${render(entry.expression ?? entry.term)}</span>:</dt><dd>${escape(entry.description ?? "")}</dd></div>`).join("");
  const assumptions = [...new Map(section.steps.flatMap(step => step.assumptions).map(a => [a.id, a])).values()];
  const conditions = assumptions.length ? `<p class="derivation-assumptions">Assumptions: ${assumptions.map(a => `<span title="${escape(a.description)}">${escape(a.label)}</span>`).join(" · ")}</p>` : "";
  return `<div class="derivation-work" data-derivation-layout="${layout}">${rows}</div><dl class="derivation-legend">${legend}</dl>${conditions}`;
}

export function renderDerivationExplanation(step: DerivationStep, render: MathematicalMarkup): string {
  const paragraphs = step.explanation.text.split(/\n+/u).filter(Boolean).map(text => `<li>${escape(text)}</li>`).join("");
  const assumptions = step.assumptions.map(a => `<li><strong>${escape(a.label)}:</strong> ${escape(a.description)}</li>`).join("");
  return `<h3>General rule</h3>${equation(step.rule.formula, render)}<p>${escape(step.rule.description)}</p>
    <h3>Application to this step</h3>${equation(step.explanation.application, render)}<ol>${paragraphs}</ol>
    ${assumptions ? `<h3>Conditions and limitations</h3><ul>${assumptions}</ul>` : ""}`;
}

export function renderDerivationDetailButtons(details: readonly MathematicalDerivationDetail[] = []): string {
  return details.length ? `<div class="math-detail-actions">${details.map(d => `<button type="button" data-derivation-detail-id="${escape(d.id)}" aria-haspopup="dialog">Explore: ${escape(d.label)} ↗</button>`).join("")}</div>` : "";
}

/** Full proofs reuse short authored sections, but never emit Reveal fragments. */
export function renderDerivationDetail(detail: MathematicalDerivationDetail, render: MathematicalMarkup): string {
  const steps = detail.sections.flatMap(section => section.steps);
  const assumptions = [...new Map(steps.flatMap(s => s.assumptions).map(a => [a.id,a])).values()];
  const legend = [...new Map(detail.sections.flatMap(s => s.legend).map(e => [e.id,e])).values()];
  return `<div class="mathematical-detail" data-detail-derivation-id="${escape(detail.id)}">
    ${assumptions.length ? `<p class="detail-condition-labels">${assumptions.map(a => escape(a.label)).join(" · ")}</p><details class="detail-conditions"><summary>Conditions and scope</summary><ul>${assumptions.map(a => `<li><strong>${escape(a.label)}:</strong> ${escape(a.description)}</li>`).join("")}</ul></details>` : ""}
    <h3>Starting point</h3>${equation(steps[0]!.from,render)}
    ${steps.map(s => `<section class="mathematical-detail-step" data-detail-step-id="${escape(s.id)}"><details><summary>${s.order}. ${escape(s.operation)} <span class="detail-rule-hint">(${escape(s.rule.label)})</span></summary>${renderDerivationExplanation(s,render)}</details>${equation(s.to,render)}</section>`).join("")}
    <h3>Symbols</h3><dl class="detail-symbol-legend">${legend.map(e => `<div><dt>${render(e.expression ?? e.term)}</dt><dd>${escape(e.description ?? "")}</dd></div>`).join("")}</dl></div>`;
}

/** Same explicit content is available to noninteractive adapters and print fallbacks. */
export function derivationText(section: MathematicalDerivationSection): string {
  return mathematicalDerivationText(section);
}
