import type { CanonicalRuntimeArtifact } from "./graph-scene-data.ts";

const categoryPaths: Readonly<Record<string, string>> = {
  "cd:TitleSlide": "M3 5h18v14H3z M7 10h10m-10 4h6",
  "cd:ChapterSlide": "M6 3h12v18l-6-4-6 4z",
  "cd:UseCaseSlide": "M8 5V3h8v2 M5 5h14v16H5z M8 13l3 3 5-6",
  "cd:ExplorationSlide": "M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0zm-2 5 6 6",
  "cd:DerivationSlide": "M4 5h5v5H4z M15 14h5v5h-5z M9 7.5h8.5V14",
  "cd:WorkedCalculationSlide": "M5 3h14v18H5z M8 7h8 M8 12h2m4 0h2m-8 5h2m4 0h2",
  "cd:InterpretationSlide": "M4 4h16v12H10l-6 4z M8 10l3 3 5-6",
};

const contentRoles = [
  ["cd:guidingQuestion", "Guiding question", "?"],
  ["cd:teachingHint", "Hint", "i"],
  ["cd:teachingObservation", "Observation", "◉"],
  ["cd:teachingPartialAnswer", "Partial answer", "…"],
  ["cd:answerResource", "Answer", "✓"],
  ["cd:teachingTakeaway", "In essence", "!"],
] as const;

function resources(element: HTMLElement): string[] {
  return element.dataset.resourceId?.trim().split(/\s+/u) ?? [];
}

export function mountTeachingMarkers(root: HTMLElement, artifact: CanonicalRuntimeArtifact): void {
  const snapshot = artifact.datasetSnapshot;
  const statements = snapshot.statements;
  const bySubject = new Map<string, typeof statements[number][]>();
  for (const statement of statements) {
    const list = bySubject.get(statement.sourceEntityId) ?? [];
    list.push(statement);
    bySubject.set(statement.sourceEntityId, list);
  }
  const labels = new Map(snapshot.entities.map(entity => [entity.id, entity.label]));
  const bindings = new Map(artifact.sceneDocumentBindings?.map(binding => [binding.sceneDocumentId, binding]));
  const stepsByDocument = new Map<string, Map<string, string>>();
  for (const [id, binding] of bindings) {
    const inPathGraph = (statement: typeof statements[number]) =>
      statement.source.some(source => source.provenanceIds?.includes(binding.pathGraphId));
    const steps = new Map<string, string>();
    const pathId = binding.pathId.replace("https://w3id.org/project-chemie-digital/resource/", "ex:");
    for (const member of bySubject.get(pathId) ?? []) {
      if (member.predicateId !== "cd:hasStep" || !inPathGraph(member)) continue;
      for (const statement of bySubject.get(member.targetEntityId) ?? []) {
        if (statement.predicateId === "cd:usesScene" && inPathGraph(statement)) {
          steps.set(statement.targetEntityId, member.targetEntityId);
        }
      }
    }
    stepsByDocument.set(id, steps);
  }

  for (const slide of root.querySelectorAll<HTMLElement>("section[data-scene-document-id]")) {
    const scene = resources(slide)[0];
    const kind = (bySubject.get(scene ?? "") ?? []).find(s => s.predicateId === "cd:teachingSceneType")?.targetEntityId;
    const heading = slide.querySelector<HTMLElement>('[data-composition-region="heading"]');
    const iconPath = kind && categoryPaths[kind];
    if (kind && iconPath && heading) {
      const label = labels.get(kind) ?? kind;
      const badge = root.ownerDocument.createElement("span");
      badge.dataset.teachingCategory = kind;
      badge.title = label;
      badge.setAttribute("aria-label", label);
      badge.setAttribute("role", "img");
      heading.querySelector(".pcd-use-case-badge")?.remove();
      badge.className = "pcd-teaching-category";
      badge.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${iconPath}"/></svg>`;
      slide.append(badge);
    }

    const id = slide.dataset.sceneDocumentId ?? "";
    const step = stepsByDocument.get(id)?.get(scene ?? "");
    const statementsForStep = (bySubject.get(step ?? "") ?? []).filter(statement =>
      statement.source.some(source => source.provenanceIds?.includes(bindings.get(id)?.pathGraphId ?? "")),
    );
    for (const block of slide.querySelectorAll<HTMLElement>("blockquote[data-resource-id], [data-lecture-takeaway]")) {
      const ids = resources(block);
      const role = contentRoles.find(([predicate]) => statementsForStep.some(statement =>
        statement.predicateId === predicate && ids.includes(statement.targetEntityId),
      ));
      if (!role && !block.hasAttribute("data-lecture-takeaway")) continue;
      const [predicate, labelText, symbol] = role ?? contentRoles[5];
      block.dataset.teachingContentRole = predicate;
      const label = root.ownerDocument.createElement("span");
      label.className = "lecture-takeaway-label";
      const icon = root.ownerDocument.createElement("span");
      icon.className = "pcd-teaching-role-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = symbol;
      label.append(icon, labelText);
      const content = root.ownerDocument.createElement("div");
      content.append(...block.childNodes);
      block.append(label, content);
    }
  }
}
