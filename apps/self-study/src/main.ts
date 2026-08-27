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
  // Commit the enhanced view only after every canonical document mounted successfully.
  // Removing the generated fallback subtree prevents duplicate section ids from
  // shadowing the visible navigation targets. Without JavaScript, or when mounting
  // throws above, this line is never reached and the complete static fallback stays intact.
  fallbackRoot.replaceChildren();
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
