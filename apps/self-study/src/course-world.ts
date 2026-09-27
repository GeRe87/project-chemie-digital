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

export interface CourseWorldSection {
  readonly id: string;
  readonly position: number;
  readonly regionNumber: number;
  readonly label: string;
  readonly description?: string;
  readonly units: readonly CourseWorldUnit[];
  readonly status: CourseWorldPathStatus;
}

export interface CourseWorldModel {
  readonly offeringId: string;
  readonly title: string;
  readonly units: readonly CourseWorldUnit[];
  readonly sections: readonly CourseWorldSection[];
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

function authoredOptionalText(
  values: readonly RuntimeLocalizedText[],
  language: string,
): string | undefined {
  if (values.length === 0) return undefined;
  const exact = values.find((item) => item.language === language);
  if (exact) return exact.value;
  const neutral = values.find((item) => item.language === undefined);
  if (neutral) return neutral.value;
  return [...values].sort((left, right) => {
    const languageOrder = compareStrings(left.language ?? "", right.language ?? "");
    return languageOrder !== 0 ? languageOrder : compareStrings(left.value, right.value);
  })[0]?.value;
}

export function sceneDocumentAnchorId(sceneDocumentId: string): string {
  return `course-document-${encodeURIComponent(sceneDocumentId)}`;
}

function sectionRegionId(sectionId: string): string {
  return `course-world-section-${encodeURIComponent(sectionId)}`;
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

  const unitsByPlacement = new Map(units.map((unit) => [unit.placementId, unit]));
  const sections: CourseWorldSection[] = [];
  if (offering.version === "1.1" && offering.sections.length > 0) {
    const sectionIds = new Set<string>();
    const groupedPlacements = new Set<string>();
    let previousPosition: number | undefined;

    for (const [index, section] of offering.sections.entries()) {
      if (sectionIds.has(section.id)) {
        throw new Error(`Duplicate OfferingSection id in course world: ${section.id}`);
      }
      sectionIds.add(section.id);
      if (previousPosition !== undefined && section.position <= previousPosition) {
        throw new Error("Course-world sections must be serialized by strictly increasing authored position");
      }
      previousPosition = section.position;

      const memberUnits: CourseWorldUnit[] = [];
      const sectionPlacements = new Set<string>();
      for (const placementId of section.placementIds) {
        const unit = unitsByPlacement.get(placementId);
        if (!unit) {
          throw new Error(`Course-world section references unknown placement: ${placementId}`);
        }
        if (sectionPlacements.has(placementId) || groupedPlacements.has(placementId)) {
          throw new Error(`Course-world placement is grouped more than once: ${placementId}`);
        }
        sectionPlacements.add(placementId);
        groupedPlacements.add(placementId);
        memberUnits.push(unit);
      }
      memberUnits.sort((left, right) => {
        const positionOrder = left.position - right.position;
        return positionOrder !== 0 ? positionOrder : compareStrings(left.placementId, right.placementId);
      });

      sections.push({
        id: section.id,
        position: section.position,
        regionNumber: index + 1,
        label: authoredLabel(section.labels, language, section.id),
        description: authoredOptionalText(section.descriptions, language),
        units: memberUnits,
        status: memberUnits.some((unit) => unit.status === "available") ? "available" : "in-preparation",
      });
    }

    if (groupedPlacements.size !== units.length) {
      const missing = units
        .map((unit) => unit.placementId)
        .filter((placementId) => !groupedPlacements.has(placementId));
      throw new Error(`Course-world sectioned offering leaves placements ungrouped: ${missing.join(", ")}`);
    }
  }

  return {
    offeringId: offering.offering.id,
    title: authoredLabel(offering.offering.labels, language, offering.offering.id),
    units,
    sections,
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

function renderPathOptions(
  unit: CourseWorldUnit,
  options: { readonly interactive: boolean },
): string {
  if (unit.paths.length === 0) {
    return '<p class="course-world-path-state">No learning path yet</p>';
  }
  return unit.paths.map((path) => {
    if (path.status === "available" && path.sceneDocumentId && path.documentAnchorId) {
      const action = options.interactive
        ? `<button type="button" class="course-world-start" data-scene-document-id="${escapeHtml(path.sceneDocumentId)}">Start</button>`
        : `<a class="course-world-start" href="#${escapeHtml(path.documentAnchorId)}">Start</a>`;
      return `<div class="course-world-path-option" data-path-status="available"><span class="course-world-path-label">${escapeHtml(path.label)}</span>${action}</div>`;
    }
    return `<div class="course-world-path-option" data-path-status="in-preparation"><span class="course-world-path-label">${escapeHtml(path.label)}</span><span class="course-world-path-state">In preparation</span></div>`;
  }).join("");
}

function renderUnitNode(
  unit: CourseWorldUnit,
  options: { readonly interactive: boolean },
  headingLevel: 3 | 4,
): string {
  const available = unit.status === "available";
  const side = unit.levelNumber % 2 === 1 ? "left" : "right";
  return `<li class="course-world-node" data-world-side="${side}" data-unit-status="${unit.status}" data-placement-position="${unit.position}">
      <div class="course-world-marker" aria-hidden="true">${unit.levelNumber}</div>
      <article class="course-world-card">
        <p class="course-world-level">Level ${unit.levelNumber}</p>
        <h${headingLevel}>${escapeHtml(unit.label)}</h${headingLevel}>
        <p class="course-world-status">${available ? "Available" : "In preparation"}</p>
        <div class="course-world-path-options">${renderPathOptions(unit, options)}</div>
      </article>
    </li>`;
}

function renderFlatWorld(
  model: CourseWorldModel,
  options: { readonly interactive: boolean },
): string {
  const nodes = model.units.map((unit) => renderUnitNode(unit, options, 3)).join("");
  return `<ol class="course-world-route">${nodes}</ol>`;
}

function renderSectionedWorld(
  model: CourseWorldModel,
  options: { readonly interactive: boolean },
): string {
  const sections = model.sections.map((section, index) => {
    const regionId = sectionRegionId(section.id);
    const headingId = `${regionId}-title`;
    const focusControl = options.interactive && section.units.length > 0
      ? `<button type="button" class="course-world-section-focus" data-focus-course-section-id="${escapeHtml(section.id)}" aria-controls="${escapeHtml(regionId)}" aria-pressed="false">Focus region</button>`
      : "";
    const description = section.description
      ? `<p class="course-world-section-description">${escapeHtml(section.description)}</p>`
      : "";
    const body = section.units.length === 0
      ? '<p class="course-world-section-empty">In preparation</p>'
      : `<ol class="course-world-route course-world-section-route">${section.units.map((unit) => renderUnitNode(unit, options, 4)).join("")}</ol>`;

    return `<li class="course-world-section-item">
      <section id="${escapeHtml(regionId)}" class="course-world-region" data-course-section-id="${escapeHtml(section.id)}" data-section-status="${section.status}" data-region-variant="${index % 6}" aria-labelledby="${escapeHtml(headingId)}"${options.interactive ? ' tabindex="-1"' : ""}>
        <header class="course-world-section-header">
          <div>
            <p class="course-world-region-index">Region ${section.regionNumber}</p>
            <h3 id="${escapeHtml(headingId)}">${escapeHtml(section.label)}</h3>
          </div>
          ${focusControl}
          ${description}
          <p class="course-world-section-status">${section.units.length === 0 ? "In preparation" : section.status === "available" ? "Available" : "In preparation"}</p>
        </header>
        ${body}
      </section>
    </li>`;
  }).join("");

  return `<ol class="course-world-sections">${sections}</ol>`;
}

export function renderCourseWorldHtml(
  model: CourseWorldModel,
  options: { readonly interactive: boolean },
): string {
  const sectioned = model.sections.length > 0;
  const body = sectioned ? renderSectionedWorld(model, options) : renderFlatWorld(model, options);
  const guidance = sectioned
    ? "Choose a region, then start any available learning path. Empty authored regions remain visible while their content is prepared."
    : "Choose a level to start learning. Units still being prepared remain visible on the route.";

  return `<section id="course-world" class="course-world" data-course-world-mode="${sectioned ? "sectioned" : "flat"}" aria-labelledby="course-world-title">
    <header class="course-world-header">
      <p class="course-world-kicker">Course map</p>
      <h2 id="course-world-title" tabindex="-1">${escapeHtml(model.title)}</h2>
      <p>${guidance}</p>
    </header>
    ${body}
  </section>`;
}

export function availableCourseWorldDocumentIds(model: CourseWorldModel): readonly string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const unit of model.units) {
    for (const path of unit.paths) {
      const documentId = path.sceneDocumentId;
      if (!documentId || seen.has(documentId)) continue;
      seen.add(documentId);
      ordered.push(documentId);
    }
  }
  return ordered;
}
