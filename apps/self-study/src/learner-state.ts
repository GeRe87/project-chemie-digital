import {
  canonicalSerializeLearnerStateDocument,
  createLearnerStateDocument,
  emptyLearnerDocumentState,
  parseAndValidateLearnerStateDocument,
  type LearnerStateDiagnostic,
  type LearnerStateDocument,
  type LearnerStateRuntime,
  type LearnerStateRuntimeBlock,
} from "../../../packages/learner-state/src/index.ts";
import type { SelfStudyController } from "../../../packages/renderer-self-study/src/browser.ts";
import type { SelfStudyNodePlan, SelfStudyRenderPlan } from "../../../packages/renderer-self-study/src/index.ts";

function collectRuntimeBlocks(sceneId: string, nodes: readonly SelfStudyNodePlan[], output: LearnerStateRuntimeBlock[]): void {
  for (const node of nodes) {
    output.push({
      sceneId,
      blockId: node.sourceBlockId,
      ...(node.kind === "prompt" ? {
        prompt: {
          responseMode: node.responseMode,
          ...(node.options ? { options: [...node.options] } : {}),
        },
      } : {}),
      ...(node.disclosureMode === "optional" || node.disclosureMode === "progressive"
        ? { disclosure: { mode: node.disclosureMode } }
        : {}),
    });
    if (node.kind === "group") collectRuntimeBlocks(sceneId, node.children, output);
  }
}

export function createSelfStudyLearnerRuntime(
  datasetFingerprint: string,
  plans: readonly SelfStudyRenderPlan[],
): LearnerStateRuntime {
  return {
    datasetFingerprint,
    documents: plans.map((plan) => ({
      documentId: plan.sourceDocumentId,
      sceneIds: plan.sections.map((section) => section.sourceSceneId),
      blocks: plan.sections.flatMap((section) => {
        const blocks: LearnerStateRuntimeBlock[] = [];
        collectRuntimeBlocks(section.sourceSceneId, section.nodes, blocks);
        return blocks;
      }),
    })),
  };
}

export function captureSelfStudyLearnerState(
  datasetFingerprint: string,
  controllers: readonly SelfStudyController[],
): LearnerStateDocument {
  return createLearnerStateDocument(datasetFingerprint, controllers.map((controller) => controller.captureLearnerState()));
}

export function restoreSelfStudyLearnerStateAtomically(
  documentValue: LearnerStateDocument,
  controllers: readonly SelfStudyController[],
): void {
  const byDocumentId = new Map(documentValue.documents.map((item) => [item.documentId, item]));
  const commits = controllers.map((controller) => controller.prepareLearnerStateRestore(
    byDocumentId.get(controller.sourceDocumentId) ?? emptyLearnerDocumentState(controller.sourceDocumentId),
  ));
  for (const commit of commits) commit();
}

export interface LearnerStateImportResult {
  readonly document?: LearnerStateDocument;
  readonly diagnostics: readonly LearnerStateDiagnostic[];
}

export function importSelfStudyLearnerState(
  source: string,
  runtime: LearnerStateRuntime,
  controllers: readonly SelfStudyController[],
): LearnerStateImportResult {
  const result = parseAndValidateLearnerStateDocument(source, runtime);
  if (!result.document) return result;
  restoreSelfStudyLearnerStateAtomically(result.document, controllers);
  return result;
}

export interface LearnerStateControls {
  destroy(): void;
}

export function mountLearnerStateControls(
  root: HTMLElement,
  datasetFingerprint: string,
  plans: readonly SelfStudyRenderPlan[],
  controllers: readonly SelfStudyController[],
): LearnerStateControls {
  const runtime = createSelfStudyLearnerRuntime(datasetFingerprint, plans);
  const controls = document.createElement("section");
  controls.className = "learner-state-controls";
  controls.setAttribute("aria-label", "Lokaler Lernstand");

  const actions = document.createElement("div");
  actions.className = "learner-state-actions";
  const exportButton = document.createElement("button");
  exportButton.type = "button";
  exportButton.textContent = "Lernstand exportieren";
  const importButton = document.createElement("button");
  importButton.type = "button";
  importButton.textContent = "Lernstand importieren";
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "application/json,.json";
  fileInput.hidden = true;
  const status = document.createElement("p");
  status.className = "learner-state-status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  const privacy = document.createElement("p");
  privacy.className = "learner-state-privacy";
  privacy.textContent = "Exportierte Dateien können Ihre eingegebenen Antworten enthalten und bleiben dort gespeichert, wo Sie die Datei ablegen.";

  actions.append(exportButton, importButton, fileInput);
  controls.append(actions, status, privacy);
  root.prepend(controls);

  const onExport = (): void => {
    const artifact = captureSelfStudyLearnerState(datasetFingerprint, controllers);
    const blob = new Blob([canonicalSerializeLearnerStateDocument(artifact)], { type: "application/json" });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = "chemie-digital-lernstand.json";
    anchor.click();
    URL.revokeObjectURL(objectUrl);
    status.textContent = "Lernstand wurde als lokale Datei exportiert.";
  };

  const onImportButton = (): void => {
    fileInput.click();
  };

  const onImport = async (): Promise<void> => {
    const file = fileInput.files?.[0];
    fileInput.value = "";
    if (!file) return;
    try {
      const result = importSelfStudyLearnerState(await file.text(), runtime, controllers);
      if (!result.document) {
        status.textContent = `Import abgelehnt: ${result.diagnostics.map((item) => item.code).join(", ")}`;
        return;
      }
      status.textContent = "Lernstand wurde importiert.";
    } catch {
      status.textContent = "Import abgelehnt: RESTORE_FAILED";
    }
  };

  exportButton.addEventListener("click", onExport);
  importButton.addEventListener("click", onImportButton);
  fileInput.addEventListener("change", onImport);

  return {
    destroy(): void {
      exportButton.removeEventListener("click", onExport);
      importButton.removeEventListener("click", onImportButton);
      fileInput.removeEventListener("change", onImport);
      controls.remove();
    },
  };
}
