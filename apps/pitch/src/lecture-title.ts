import type { CanonicalRuntimeSceneDocumentBinding, TeachingOfferingRuntimeDocument, RuntimeLocalizedText } from "../../../packages/core/src/canonical-runtime.ts";
import type { SceneDocument } from "../../../packages/core/src/scene-document.ts";

export interface LectureTitle {
  readonly title: string;
  readonly course: string;
  readonly pathId: string;
  readonly graphId: string;
}

function label(texts: readonly RuntimeLocalizedText[], language: string): string | undefined {
  return texts.find(text => text.language === language)?.value
    ?? texts.find(text => !text.language)?.value ?? texts[0]?.value;
}

/** Presentation chrome from exact authored path metadata, not a new learning step. */
export function resolveLectureTitle(
  document: SceneDocument,
  bindings: readonly CanonicalRuntimeSceneDocumentBinding[],
  offerings: readonly TeachingOfferingRuntimeDocument[],
  language = "en",
): LectureTitle | undefined {
  const binding = bindings.find(candidate => candidate.sceneDocumentId === document.id);
  if (!binding) return undefined;
  for (const offering of offerings) {
    for (const unit of offering.units) {
      const path = unit.paths.find(candidate => candidate.id === binding.pathId && candidate.graphId === binding.pathGraphId);
      if (!path) continue;
      const title = label(path.labels, language);
      if (!title) return undefined;
      return { title, course: label(offering.offering.labels, language) ?? "", pathId: path.id, graphId: path.graphId };
    }
  }
  return undefined;
}

export function hasAuthoredTitleSlide(document: SceneDocument): boolean {
  const blocks = document.scenes[0]?.blocks;
  return blocks?.length === 1 && blocks[0]?.kind === "prose" && blocks[0].intent?.kind === "introduce";
}

export function prependLectureTitle(root: HTMLElement, document: SceneDocument, title: LectureTitle): () => void {
  if (hasAuthoredTitleSlide(document)) return () => undefined;
  const slide = root.ownerDocument.createElement("section");
  slide.className = "pcd-lecture-title";
  slide.dataset.composition = "stack";
  slide.dataset.compositionMainCount = "0";
  slide.id = `lecture-title-${encodeURIComponent(document.id)}`;
  slide.dataset.lectureTitle = "true";
  slide.dataset.sceneDocumentId = document.id;
  slide.dataset.resourceId = title.pathId;
  slide.dataset.provenanceIds = title.graphId;
  slide.setAttribute("aria-labelledby", `${slide.id}-heading`);
  const heading = root.ownerDocument.createElement("h2");
  heading.dataset.compositionRegion = "heading";
  heading.id = `${slide.id}-heading`;heading.textContent = title.title;
  slide.append(heading);
  const first = [...root.children].find(element => (element as HTMLElement).dataset.sceneDocumentId === document.id);
  if (!first) throw new Error(`No slides for lecture title ${document.id}`);
  first.before(slide);
  return () => slide.remove();
}
