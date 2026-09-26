import type {
  CanonicalRuntimeSceneDocumentBinding,
  RuntimeLocalizedText,
  TeachingOfferingRuntimeDocument,
} from "../../../packages/core/src/canonical-runtime.ts";
import type { SceneDocument } from "../../../packages/core/src/scene-document.ts";

export type CourseWorldPathStatus = "available" | "in-preparation";

export interface CourseWorldPath {
  readonly id: string;
  readonly graphId: string;
  readonly label: string;
  readonly status: CourseWorldPathStatus;
  readonly sceneDocumentId?: string;
  readonly documentAnchorId?: string;
}

export interface CourseWorldUnit {
  readonly placementId: string;
  readonly unitId: string;
  readonly position: number;
  readonly levelNumber: number;
  readonly label: string;
  readonly paths: readonly CourseWorldPath[];
  readonly status: CourseWorldPathStatus;
}

export interface CourseWorldModel {
  readonly offeringId: string;
  readonly title: string;
  readonly units: readonly CourseWorldUnit[];
}

function compareStrings(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function authoredLabel(
  values: readonly RuntimeLocalizedText[],
  language: string,
  semanticId: string,
): string {
  const exact = values.find((item) => item.language === language);
  if (exact) return exact.value;
  const neutral = values.find((item) => item.language === undefined);
  if (neutral) return neutral.value;
  const first = [...values].sort((left, right) => {
    const languageOrder = compareStrings(left.language ?? "", right.language ?? "");
    return languageOrder !== 0 ? languageOrder : compareStrings(left.value, right.value);
  })[0];
  return first?.value ?? semanticId;
}

export function sceneDocumentAnchorId(sceneDocumentId: string): string {
  return `course-document-${encodeURIComponent(sceneDocumentId)}`;
}

export function createCourseWorldModel(
  offering: TeachingOfferingRuntimeDocument,
  sceneDocuments: readonly SceneDocument[],
  bindings: readonly CanonicalRuntimeSceneDocumentBinding[],
  language = "en",
): CourseWorldModel {
  const documentsById = new Map<string, SceneDocument>();
  for (const documentValue of sceneDocuments) {
    if (documentsById.has(documentValue.id)) {
      throw new Error(`Duplicate SceneDocument id in course world: ${documentValue.id}`);
    }
    documentsById.set(documentValue.id, documentValue);
  }

  const unitsById = new Map(offering.units.map((unit) => [unit.id, unit]));
  const pathReferences = new Map<string, { readonly id: string; readonly graphId: string }>();
  for (const unit of offering.units) {
    for (const path of unit.paths) {
      pathReferences.set(`${path.id}\u0000${path.graphId}`, path);
    }
  }

  const bindingsByPath = new Map<string, CanonicalRuntimeSceneDocumentBinding>();
  const boundDocuments = new Set<string>();
  for (const binding of bindings) {
    const key = `${binding.pathId}\u0000${binding.pathGraphId}`;
    if (!pathReferences.has(key)) {
      throw new Error(`SceneDocument binding references a path outside the selected TeachingOffering: ${binding.pathId}`);
    }
    if (!documentsById.has(binding.sceneDocumentId)) {
      throw new Error(`SceneDocument binding references an absent document: ${binding.sceneDocumentId}`);
    }
    if (bindingsByPath.has(key)) {
      throw new Error(`Duplicate course-world path binding: ${binding.pathId}`);
    }
    if (boundDocuments.has(binding.sceneDocumentId)) {
      throw new Error(`SceneDocument is bound more than once in course world: ${binding.sceneDocumentId}`);
    }
    bindingsByPath.set(key, binding);
    boundDocuments.add(binding.sceneDocumentId);
  }

  for (const documentId of documentsById.keys()) {
    if (!boundDocuments.has(documentId)) {
      throw new Error(`Course-world SceneDocument has no exact path binding: ${documentId}`);
    }
  }

  const placements = [...offering.placements].sort((left, right) => {
    const positionOrder = left.position - right.position;
    return positionOrder !== 0 ? positionOrder : compareStrings(left.id, right.id);
  });

  const units: CourseWorldUnit[] = placements.map((placement, index) => {
    const unit = unitsById.get(placement.unitId);
    if (!unit) throw new Error(`Course-world placement references unknown unit: ${placement.unitId}`);
    const paths = unit.paths.map((path): CourseWorldPath => {
      const binding = bindingsByPath.get(`${path.id}\u0000${path.graphId}`);
      if (!binding) {
        return {
          id: path.id,
          graphId: path.graphId,
          label: authoredLabel(path.labels, language, path.id),
          status: "in-preparation",
        };
      }
      return {
        id: path.id,
        graphId: path.graphId,
        label: authoredLabel(path.labels, language, path.id),
        status: "available",
        sceneDocumentId: binding.sceneDocumentId,
        documentAnchorId: sceneDocumentAnchorId(binding.sceneDocumentId),
      };
    });
    return {
      placementId: placement.id,
      unitId: unit.id,
      position: placement.position,
      levelNumber: index + 1,
      label: authoredLabel(unit.labels, language, unit.id),
      paths,
      status: paths.some((path) => path.status === "available") ? "available" : "in-preparation",
    };
  });

  return {
    offeringId: offering.offering.id,
    title: authoredLabel(offering.offering.labels, language, offering.offering.id),
    units,
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderCourseWorldHtml(
  model: CourseWorldModel,
  options: { readonly interactive: boolean },
): string {
  const nodes = model.units.map((unit, index) => {
    const available = unit.status === "available";
    const paths = unit.paths.length === 0
      ? '<p class="course-world-path-state">No learning path yet</p>'
      : unit.paths.map((path) => {
          if (path.status === "available" && path.sceneDocumentId && path.documentAnchorId) {
            const action = options.interactive
              ? `<button type="button" class="course-world-start" data-scene-document-id="${escapeHtml(path.sceneDocumentId)}">Start</button>`
              : `<a class="course-world-start" href="#${escapeHtml(path.documentAnchorId)}">Start</a>`;
            return `<div class="course-world-path-option" data-path-status="available"><span class="course-world-path-label">${escapeHtml(path.label)}</span>${action}</div>`;
          }
          return `<div class="course-world-path-option" data-path-status="in-preparation"><span class="course-world-path-label">${escapeHtml(path.label)}</span><span class="course-world-path-state">In preparation</span></div>`;
        }).join("");

    return `<li class="course-world-node" data-world-side="${index % 2 === 0 ? "left" : "right"}" data-unit-status="${unit.status}" data-placement-position="${unit.position}">
      <div class="course-world-marker" aria-hidden="true">${unit.levelNumber}</div>
      <article class="course-world-card">
        <p class="course-world-level">Level ${unit.levelNumber}</p>
        <h3>${escapeHtml(unit.label)}</h3>
        <p class="course-world-status">${available ? "Available" : "In preparation"}</p>
        <div class="course-world-path-options">${paths}</div>
      </article>
    </li>`;
  }).join("");

  return `<section id="course-world" class="course-world" aria-labelledby="course-world-title">
    <header class="course-world-header">
      <p class="course-world-kicker">Course map</p>
      <h2 id="course-world-title">${escapeHtml(model.title)}</h2>
      <p>Choose a level to start learning. Units still being prepared remain visible on the route.</p>
    </header>
    <ol class="course-world-route">${nodes}</ol>
  </section>`;
}

export function availableCourseWorldDocumentIds(model: CourseWorldModel): readonly string[] {
  return model.units.flatMap((unit) =>
    unit.paths.flatMap((path) => path.sceneDocumentId ? [path.sceneDocumentId] : []),
  );
}
