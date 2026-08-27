import "./styles.css";
import { createSelfStudyRenderPlan } from "../../../packages/renderer-self-study/src/index.ts";
import { mountSelfStudyRenderPlan, type SelfStudyController } from "../../../packages/renderer-self-study/src/browser.ts";
import { canonicalSelfStudySceneDocuments } from "./scene-data.ts";

const fallbackRoot = document.querySelector<HTMLElement>("#self-study-static");
const enhancedRoot = document.querySelector<HTMLElement>("#self-study-enhanced");
if (!fallbackRoot || !enhancedRoot) throw new Error("Missing self-study application roots");

const controllers: SelfStudyController[] = [];
try {
  for (const documentValue of canonicalSelfStudySceneDocuments()) {
    const result = createSelfStudyRenderPlan(documentValue);
    if (!result.plan || result.diagnostics.length > 0) {
      throw new Error(result.diagnostics.map((item) => `${item.code}: ${item.message}`).join("; ") || "Self-study render plan unavailable");
    }
    const documentRoot = document.createElement("article");
    documentRoot.className = "self-study-document";
    enhancedRoot.append(documentRoot);
    controllers.push(mountSelfStudyRenderPlan(documentRoot, result.plan));
  }
  fallbackRoot.hidden = true;
  enhancedRoot.hidden = false;
} catch (error) {
  console.error("Self-study enhancement unavailable; canonical static fallback remains visible.", error);
  for (const controller of controllers.splice(0)) controller.destroy();
  enhancedRoot.replaceChildren();
  enhancedRoot.hidden = true;
  fallbackRoot.hidden = false;
}

window.addEventListener("pagehide", () => {
  for (const controller of controllers.splice(0)) controller.destroy();
}, { once: true });
