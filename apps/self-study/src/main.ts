import "./styles.css";
import { createSelfStudyRenderPlan, type SelfStudyRenderPlan } from "../../../packages/renderer-self-study/src/index.ts";
import { mountSelfStudyRenderPlan, type SelfStudyController } from "../../../packages/renderer-self-study/src/browser.ts";
import { canonicalDatasetFingerprint, canonicalSelfStudySceneDocuments } from "./scene-data.ts";
import { mountLearnerStateControls, type LearnerStateControls } from "./learner-state.ts";

const fallbackRoot = document.querySelector<HTMLElement>("#self-study-static");
const enhancedRoot = document.querySelector<HTMLElement>("#self-study-enhanced");
if (!fallbackRoot || !enhancedRoot) throw new Error("Missing self-study application roots");

const controllers: SelfStudyController[] = [];
const plans: SelfStudyRenderPlan[] = [];
let learnerStateControls: LearnerStateControls | undefined;
try {
  for (const documentValue of canonicalSelfStudySceneDocuments()) {
    const result = createSelfStudyRenderPlan(documentValue);
    if (!result.plan || result.diagnostics.length > 0) {
      throw new Error(result.diagnostics.map((item) => `${item.code}: ${item.message}`).join("; ") || "Self-study render plan unavailable");
    }
    const documentRoot = document.createElement("article");
    documentRoot.className = "self-study-document";
    enhancedRoot.append(documentRoot);
    plans.push(result.plan);
    controllers.push(mountSelfStudyRenderPlan(documentRoot, result.plan));
  }
  learnerStateControls = mountLearnerStateControls(enhancedRoot, canonicalDatasetFingerprint, plans, controllers);
  // Commit the enhanced view only after every canonical document mounted successfully.
  // Removing the generated fallback subtree prevents duplicate section ids from
  // shadowing the visible navigation targets. Without JavaScript, or when mounting
  // throws above, this line is never reached and the complete static fallback stays intact.
  fallbackRoot.replaceChildren();
  fallbackRoot.hidden = true;
  enhancedRoot.hidden = false;
} catch (error) {
  console.error("Self-study enhancement unavailable; canonical static fallback remains visible.", error);
  learnerStateControls?.destroy();
  learnerStateControls = undefined;
  for (const controller of controllers.splice(0)) controller.destroy();
  enhancedRoot.replaceChildren();
  enhancedRoot.hidden = true;
  fallbackRoot.hidden = false;
}

window.addEventListener("pagehide", () => {
  learnerStateControls?.destroy();
  learnerStateControls = undefined;
  for (const controller of controllers.splice(0)) controller.destroy();
}, { once: true });
