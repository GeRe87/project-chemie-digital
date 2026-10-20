import "./styles.css";
import "./course-world.css";
import { createPitchCourseWorldModel, renderPitchCourseWorldHtml } from "./course-world.ts";
import { resolvePublicAssetUrl } from "./public-asset-url.ts";
import { mountCourseWorldMap } from "./course-world-map.ts";
import type { CanonicalRuntimeSceneDocumentBinding, TeachingOfferingRuntimeDocument } from "../../../packages/core/src/canonical-runtime.ts";

if (!document.querySelector('meta[name="pitch-course-world"]')) {
  // Preserve existing standalone generators and their direct presentation entry.
  const { canonicalRuntimeArtifact } = await import("./graph-scene-data.ts");
  const { startPresentation } = await import("./presentation-main.ts");
  await startPresentation(canonicalRuntimeArtifact);
} else {
performance.mark("pcd-world-bootstrap-start");
const manifestResponse = await fetch(resolvePublicAssetUrl("course-runtime/manifest.json"));
if (!manifestResponse.ok) throw new Error(`Could not load course manifest (${manifestResponse.status})`);
const manifest = await manifestResponse.json() as {
  offering: TeachingOfferingRuntimeDocument;
  bindings: CanonicalRuntimeSceneDocumentBinding[];
  documents: { id: string; pathId: string; sceneIds: string[]; runtime: string }[];
};

// Only metadata is imported here. Reveal, charts, KaTeX and semantic snapshots
// are loaded after selecting a level, not while browsing the course world.
const model = createPitchCourseWorldModel(manifest.offering,
  manifest.documents, manifest.bindings);
const url = new URL(window.location.href);
const requested = url.searchParams.get("level");
let directScene = decodeURIComponent(url.hash.replace(/^#\/?/, ""));
// Retain legacy full-course numeric Reveal links as well as authored scene IDs.
if (!requested && /^\d+(?:\/0)?$/.test(directScene)) {
  const index = Number(directScene.split("/")[0]);
  let offset = 0;
  for (const entry of manifest.documents) {
    if (index >= offset && index < offset + entry.sceneIds.length) {
      directScene = entry.sceneIds[index - offset]!;
      url.hash = `/${encodeURIComponent(directScene)}`;
      window.history.replaceState({}, "", url);
      break;
    }
    offset += entry.sceneIds.length + 2; // existing level buffer and return sentinel
  }
}
const selected = manifest.documents.find(d => d.id === requested || d.pathId === requested
  || (directScene && d.sceneIds.includes(directScene)));
document.body.dataset.presentationTheme = url.searchParams.get("theme") === "light" ? "light" : "dark";
if (selected) {
  performance.mark("pcd-level-load-start");
  // A Start-level action always starts at the first authored scene. Reveal's
  // scroll restoration is scoped only to pathname, not the selected level.
  sessionStorage.removeItem("reveal-scroll-top");
  sessionStorage.removeItem("reveal-scroll-origin");
  const response = await fetch(resolvePublicAssetUrl(selected.runtime));
  if (!response.ok) throw new Error(`Could not load selected level (${response.status})`);
  const artifact = await response.json();
  if (artifact.sceneDocuments.length !== 1 || artifact.sceneDocuments[0].id !== selected.id) throw new Error("Selected runtime identity mismatch");
  const { startPresentation } = await import("./presentation-main.ts");
  await startPresentation(artifact, model);
  performance.measure("pcd-level-initialization", "pcd-level-load-start");
} else {
  const presentation = document.querySelector<HTMLElement>(".reveal")!;
  presentation.hidden = true;
  const shell = document.createElement("section"); shell.className = "pitch-course-world-shell";
  shell.innerHTML = renderPitchCourseWorldHtml(model);
  presentation.before(shell); document.body.classList.add("pcd-course-world-active");
  const skipLink=document.querySelector<HTMLAnchorElement>(".skip-link");
  if(skipLink){skipLink.href="#pitch-course-world-title";skipLink.textContent="Skip to course map";}
  const unmountMap=mountCourseWorldMap(shell);window.addEventListener("pagehide",unmountMap,{once:true});
  performance.measure("pcd-world-bootstrap", "pcd-world-bootstrap-start");
  shell.addEventListener("click", event => {
    const button = (event.target as Element).closest<HTMLButtonElement>("button[data-scene-document-id]");
    if (!button) return;
    const next = new URL(window.location.href); next.searchParams.set("level", button.dataset.sceneDocumentId!); next.hash = "";
    window.location.assign(next);
  });
}
}
