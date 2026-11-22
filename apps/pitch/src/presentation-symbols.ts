import { createExplanationDialog } from "./explanation-dialog.ts";

/** Keep the equation and all its definitions available together in a bounded view. */
export function mountPresentationSymbols(root: HTMLElement): () => void {
  const dialog = createExplanationDialog("pcd-symbol-dialog", "pcd-symbol-dialog-title");
  const onClick = (event: MouseEvent) => {
    const summary = (event.target as Element).closest<HTMLElement>(".symbol-legend-disclosure > summary");
    const legend = summary?.parentElement?.querySelector("dl");
    if (!summary || !legend) return;
    event.preventDefault();
    const scope = summary.closest(".mathematical-derivation, .formula-with-legend");
    const formulas = [...scope?.querySelectorAll<HTMLElement>(".math-display, .derivation-formula") ?? []];
    const formula = formulas.filter(element => element.getClientRects().length &&
      getComputedStyle(element).visibility === "visible" &&
      !element.closest('[aria-hidden="true"], .fragment:not(.visible)')).at(-1);
    const content = document.createElement("div");
    content.className = "pcd-symbol-dialog-content";
    if (formula) {
      const equation = document.createElement("div");
      equation.className = "pcd-symbol-equation";
      equation.append(formula.cloneNode(true));
      content.append(equation);
    }
    content.append(legend.cloneNode(true));
    for (const node of content.querySelectorAll("[id]")) node.removeAttribute("id");
    dialog.open("Formula & symbols", content, summary);
  };
  root.addEventListener("click", onClick);
  return () => { root.removeEventListener("click", onClick); dialog.destroy(); };
}
