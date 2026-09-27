import "./styles.css";
import { createSelfStudyRenderPlan, type SelfStudyRenderPlan } from "../../../packages/renderer-self-study/src/index.ts";
import { mountSelfStudyRenderPlan, type SelfStudyController } from "../../../packages/renderer-self-study/src/browser.ts";
import {
  canonicalDatasetFingerprint,
  canonicalSelfStudySceneDocumentBindings,
  canonicalSelfStudySceneDocuments,
  canonicalSelfStudyTeachingOfferingDocuments,
} from "./scene-data.ts";
import {
  availableCourseWorldDocumentIds,
  createCourseWorldModel,
  renderCourseWorldHtml,
  sceneDocumentAnchorId,
} from "./course-world.ts";
import { mountLearnerStateControls, type LearnerStateControls } from "./learner-state.ts";

const fallbackRoot = document.querySelector<HTMLElement>("#self-study-static");
const enhancedRoot = document.querySelector<HTMLElement>("#self-study-enhanced");
if (!fallbackRoot || !enhancedRoot) throw new Error("Missing self-study application roots");

const controllers: SelfStudyController[] = [];
const plans: SelfStudyRenderPlan[] = [];
const disposers: Array<() => void> = [];
let learnerStateControls: LearnerStateControls | undefined;

try {
  const offeringDocuments = canonicalSelfStudyTeachingOfferingDocuments();
  if (offeringDocuments.length !== 1) {
    throw new Error(`Self-study course world requires exactly one TeachingOffering document, received ${offeringDocuments.length}`);
  }

  const sceneDocuments = canonicalSelfStudySceneDocuments();
  const sceneDocumentBindings = canonicalSelfStudySceneDocumentBindings();
  const world = createCourseWorldModel(
    offeringDocuments[0]!,
    sceneDocuments,
    sceneDocumentBindings,
    "en",
  );

  const sceneDocumentsById = new Map(sceneDocuments.map((documentValue) => [documentValue.id, documentValue]));
  const worldRoot = document.createElement("section");
  worldRoot.className = "course-world-shell";
  worldRoot.innerHTML = renderCourseWorldHtml(world, { interactive: true });

  const studyRoot = document.createElement("section");
  studyRoot.className = "self-study-active-path";
  studyRoot.hidden = true;

  const backNavigation = document.createElement("nav");
  backNavigation.className = "course-world-back-navigation";
  backNavigation.setAttribute("aria-label", "Course navigation");
  const backButton = document.createElement("button");
  backButton.type = "button";
  backButton.className = "course-world-back";
  backButton.textContent = "← Back to course map";
  backNavigation.append(backButton);

  const documentsRoot = document.createElement("div");
  documentsRoot.className = "self-study-documents";
  studyRoot.append(backNavigation, documentsRoot);
  enhancedRoot.append(worldRoot, studyRoot);

  const documentElements = new Map<string, HTMLElement>();
  for (const documentId of availableCourseWorldDocumentIds(world)) {
    const documentValue = sceneDocumentsById.get(documentId);
    if (!documentValue) throw new Error(`Course-world document is unavailable: ${documentId}`);
    const result = createSelfStudyRenderPlan(documentValue);
    if (!result.plan || result.diagnostics.length > 0) {
      throw new Error(result.diagnostics.map((item) => `${item.code}: ${item.message}`).join("; ") || "Self-study render plan unavailable");
    }
    const documentRoot = document.createElement("article");
    documentRoot.id = sceneDocumentAnchorId(documentId);
    documentRoot.className = "self-study-document";
    documentRoot.dataset.sourceDocumentId = documentId;
    documentRoot.tabIndex = -1;
    documentRoot.hidden = true;
    documentsRoot.append(documentRoot);
    plans.push(result.plan);
    controllers.push(mountSelfStudyRenderPlan(documentRoot, result.plan));
    documentElements.set(documentId, documentRoot);
  }

  learnerStateControls = mountLearnerStateControls(
    documentsRoot,
    canonicalDatasetFingerprint,
    plans,
    controllers,
  );

  let returnFocus: HTMLElement | undefined;
  const showWorld = (): void => {
    studyRoot.hidden = true;
    for (const element of documentElements.values()) element.hidden = true;
    worldRoot.hidden = false;
    const focusTarget = returnFocus ?? worldRoot.querySelector<HTMLElement>("#course-world-title");
    focusTarget?.focus();
  };

  const openDocument = (documentId: string, trigger: HTMLElement): void => {
    const target = documentElements.get(documentId);
    if (!target) throw new Error(`No mounted Self-Study document for ${documentId}`);
    returnFocus = trigger;
    worldRoot.hidden = true;
    studyRoot.hidden = false;
    for (const [candidateId, element] of documentElements) {
      element.hidden = candidateId !== documentId;
    }
    target.focus();
  };

  for (const button of worldRoot.querySelectorAll<HTMLButtonElement>("button[data-scene-document-id]")) {
    const documentId = button.dataset.sceneDocumentId;
    if (!documentId) throw new Error("Course-world start control is missing a SceneDocument identity");
    const onOpen = (): void => openDocument(documentId, button);
    button.addEventListener("click", onOpen);
    disposers.push(() => button.removeEventListener("click", onOpen));
  }

  const onBack = (): void => showWorld();
  backButton.addEventListener("click", onBack);
  disposers.push(() => backButton.removeEventListener("click", onBack));

  // Commit the enhanced view only after the complete course world and every
  // available canonical document mounted successfully. Without JavaScript,
  // or when any mount fails, the generated static world + content stays intact.
  fallbackRoot.replaceChildren();
  fallbackRoot.hidden = true;
  enhancedRoot.hidden = false;
} catch (error) {
  console.error("Self-study enhancement unavailable; canonical static course world remains visible.", error);
  learnerStateControls?.destroy();
  learnerStateControls = undefined;
  for (const dispose of disposers.splice(0)) dispose();
  for (const controller of controllers.splice(0)) controller.destroy();
  enhancedRoot.replaceChildren();
  enhancedRoot.hidden = true;
  fallbackRoot.hidden = false;
}

window.addEventListener("pagehide", () => {
  learnerStateControls?.destroy();
  learnerStateControls = undefined;
  for (const dispose of disposers.splice(0)) dispose();
  for (const controller of controllers.splice(0)) controller.destroy();
}, { once: true });
