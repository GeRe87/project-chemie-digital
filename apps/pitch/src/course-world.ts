import type {
  CanonicalRuntimeSceneDocumentBinding,
  RuntimeLocalizedText,
  TeachingOfferingRuntimeDocument,
} from "../../../packages/core/src/canonical-runtime.ts";
import type { SceneDocument } from "../../../packages/core/src/scene-document.ts";

export type PitchCoursePathStatus = "available" | "in-preparation";

export interface PitchCourseWorldPath {
  readonly id: string;
  readonly graphId: string;
  readonly label: string;
  readonly status: PitchCoursePathStatus;
  readonly sceneDocumentId?: string;
}

export interface PitchCourseWorldUnit {
  readonly placementId: string;
  readonly unitId: string;
  readonly position: number;
  readonly levelNumber: number;
  readonly label: string;
  readonly paths: readonly PitchCourseWorldPath[];
  readonly status: PitchCoursePathStatus;
}

export interface PitchCourseWorldSection {
  readonly id: string;
  readonly position: number;
  readonly regionNumber: number;
  readonly label: string;
  readonly description?: string;
  readonly units: readonly PitchCourseWorldUnit[];
  readonly status: PitchCoursePathStatus;
}

export interface PitchCourseWorldModel {
  readonly offeringId: string;
  readonly title: string;
  readonly units: readonly PitchCourseWorldUnit[];
  readonly sections: readonly PitchCourseWorldSection[];
}

function compareStrings(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function authoredText(
  values: readonly RuntimeLocalizedText[],
  language: string,
  fallback: string,
): string {
  const exact = values.find((item) => item.language === language);
  if (exact) return exact.value;
  const neutral = values.find((item) => item.language === undefined);
  if (neutral) return neutral.value;
  return [...values].sort((left, right) => {
    const languageOrder = compareStrings(left.language ?? "", right.language ?? "");
    return languageOrder !== 0 ? languageOrder : compareStrings(left.value, right.value);
  })[0]?.value ?? fallback;
}

function optionalAuthoredText(
  values: readonly RuntimeLocalizedText[],
  language: string,
): string | undefined {
  if (values.length === 0) return undefined;
  return authoredText(values, language, "");
}

export function createPitchCourseWorldModel(
  offering: TeachingOfferingRuntimeDocument,
  sceneDocuments: readonly SceneDocument[],
  bindings: readonly CanonicalRuntimeSceneDocumentBinding[],
  language = "en",
): PitchCourseWorldModel {
  const documentsById = new Map(sceneDocuments.map((documentValue) => [documentValue.id, documentValue]));
  if (documentsById.size !== sceneDocuments.length) throw new Error("Pitch course world contains duplicate SceneDocument ids");

  const pathReferences = new Set<string>();
  const unitsById = new Map(offering.units.map((unit) => [unit.id, unit]));
  for (const unit of offering.units) {
    for (const path of unit.paths) pathReferences.add(`${path.id}\u0000${path.graphId}`);
  }

  const bindingsByPath = new Map<string, CanonicalRuntimeSceneDocumentBinding>();
  const boundDocuments = new Set<string>();
  for (const binding of bindings) {
    const key = `${binding.pathId}\u0000${binding.pathGraphId}`;
    if (!pathReferences.has(key)) throw new Error(`Pitch course-world binding is outside the selected offering: ${binding.pathId}`);
    if (!documentsById.has(binding.sceneDocumentId)) throw new Error(`Pitch course-world binding references missing document: ${binding.sceneDocumentId}`);
    if (bindingsByPath.has(key)) throw new Error(`Duplicate Pitch course-world path binding: ${binding.pathId}`);
    if (boundDocuments.has(binding.sceneDocumentId)) throw new Error(`SceneDocument is bound more than once in Pitch course world: ${binding.sceneDocumentId}`);
    bindingsByPath.set(key, binding);
    boundDocuments.add(binding.sceneDocumentId);
  }
  for (const documentId of documentsById.keys()) {
    if (!boundDocuments.has(documentId)) throw new Error(`Pitch course-world SceneDocument is unbound: ${documentId}`);
  }

  const placements = [...offering.placements].sort((left, right) =>
    left.position - right.position || compareStrings(left.id, right.id)
  );
  const units: PitchCourseWorldUnit[] = placements.map((placement, index) => {
    const unit = unitsById.get(placement.unitId);
    if (!unit) throw new Error(`Pitch course-world placement references unknown unit: ${placement.unitId}`);
    const paths = unit.paths.map((path): PitchCourseWorldPath => {
      const binding = bindingsByPath.get(`${path.id}\u0000${path.graphId}`);
      return binding
        ? {
            id: path.id,
            graphId: path.graphId,
            label: authoredText(path.labels, language, "Learning path"),
            status: "available",
            sceneDocumentId: binding.sceneDocumentId,
          }
        : {
            id: path.id,
            graphId: path.graphId,
            label: authoredText(path.labels, language, "Learning path"),
            status: "in-preparation",
          };
    });
    return {
      placementId: placement.id,
      unitId: unit.id,
      position: placement.position,
      levelNumber: index,
      label: authoredText(unit.labels, language, unit.id),
      paths,
      status: paths.some((path) => path.status === "available") ? "available" : "in-preparation",
    };
  });

  const unitsByPlacement = new Map(units.map((unit) => [unit.placementId, unit]));
  const sections: PitchCourseWorldSection[] = [];
  if (offering.version === "1.1") {
    for (const [index, section] of offering.sections.entries()) {
      const memberUnits = section.placementIds.map((placementId) => {
        const unit = unitsByPlacement.get(placementId);
        if (!unit) throw new Error(`Pitch course-world section references unknown placement: ${placementId}`);
        return unit;
      });
      sections.push({
        id: section.id,
        position: section.position,
        regionNumber: index + 1,
        label: authoredText(section.labels, language, section.id),
        description: optionalAuthoredText(section.descriptions, language),
        units: memberUnits,
        status: memberUnits.some((unit) => unit.status === "available") ? "available" : "in-preparation",
      });
    }
  }

  return {
    offeringId: offering.offering.id,
    title: authoredText(offering.offering.labels, language, offering.offering.id),
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

function renderPathOptions(unit: PitchCourseWorldUnit): string {
  if (unit.paths.length === 0) return '<p class="pitch-world-state">In preparation</p>';
  return unit.paths.map((path) => {
    if (path.status === "available" && path.sceneDocumentId) {
      return `<div class="pitch-world-path" data-path-status="available">
        <span class="pitch-world-path-label">${escapeHtml(path.label)}</span>
        <button type="button" class="pitch-world-start" data-scene-document-id="${escapeHtml(path.sceneDocumentId)}">Start level</button>
      </div>`;
    }
    return `<div class="pitch-world-path" data-path-status="in-preparation">
      <span class="pitch-world-path-label">${escapeHtml(path.label)}</span>
      <span class="pitch-world-state">In preparation</span>
    </div>`;
  }).join("");
}

function renderUnit(unit: PitchCourseWorldUnit): string {
  return `<li class="pitch-world-node" data-level="${unit.levelNumber}" data-unit-status="${unit.status}">
    <div class="pitch-world-marker" aria-hidden="true">${unit.levelNumber}</div>
    <article class="pitch-world-card">
      <p class="pitch-world-level">Level ${unit.levelNumber}</p>
      <h3>${escapeHtml(unit.label)}</h3>
      <div class="pitch-world-paths">${renderPathOptions(unit)}</div>
    </article>
  </li>`;
}

export function renderPitchCourseWorldHtml(model: PitchCourseWorldModel): string {
  const regions = model.sections.length > 0
    ? model.sections.map((section) => {
        const body = section.units.length
          ? `<ol class="pitch-world-route">${section.units.map(renderUnit).join("")}</ol>`
          : '<p class="pitch-world-region-empty">In preparation</p>';
        return `<li class="pitch-world-region-item">
          <section class="pitch-world-region" data-course-section-id="${escapeHtml(section.id)}" data-section-status="${section.status}">
            <header class="pitch-world-region-header">
              <p>Region ${section.regionNumber}</p>
              <h2>${escapeHtml(section.label)}</h2>
              ${section.description ? `<span>${escapeHtml(section.description)}</span>` : ""}
            </header>
            ${body}
          </section>
        </li>`;
      }).join("")
    : `<li class="pitch-world-region-item"><section class="pitch-world-region"><ol class="pitch-world-route">${model.units.map(renderUnit).join("")}</ol></section></li>`;

  return `<section class="pitch-course-world" aria-labelledby="pitch-course-world-title">
    <header class="pitch-world-header">
      <p class="pitch-world-kicker">COURSE OVERWORLD</p>
      <h1 id="pitch-course-world-title" tabindex="-1">${escapeHtml(model.title)}</h1>
      <p>Select a level. Finished levels return here after their closing buffer.</p>
    </header>
    <ol class="pitch-world-regions">${regions}</ol>
  </section>`;
}

export interface PitchCourseLevelBoundary {
  readonly sceneDocumentId: string;
  readonly levelNumber: number;
  readonly label: string;
}

export function pitchCourseLevelBoundaries(model: PitchCourseWorldModel): readonly PitchCourseLevelBoundary[] {
  const seen = new Set<string>();
  const boundaries: PitchCourseLevelBoundary[] = [];
  for (const unit of model.units) {
    for (const path of unit.paths) {
      if (!path.sceneDocumentId || seen.has(path.sceneDocumentId)) continue;
      seen.add(path.sceneDocumentId);
      boundaries.push({
        sceneDocumentId: path.sceneDocumentId,
        levelNumber: unit.levelNumber,
        label: unit.label,
      });
    }
  }
  return boundaries;
}
