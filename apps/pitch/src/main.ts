import "./styles.css";
import "./course-world.css";
import "./course-bootstrap.css";
import { createPitchCourseWorldModel, renderPitchCourseWorldHtml } from "./course-world.ts";
import { mountCourseWorldMap } from "./course-world-map.ts";
import { loadCourseLevel, loadCourseManifest } from "./course-runtime-loader.ts";
import { mountCourseBootstrapStatus, runCourseBootstrap } from "./course-bootstrap.ts";
import { mountPageLifecycle } from "./page-lifecycle.ts";

declare const __PCD_COURSE_BUILD__: boolean;
const compiledCourse = typeof __PCD_COURSE_BUILD__ !== "undefined" && __PCD_COURSE_BUILD__;
const courseMode = compiledCourse || !!document.querySelector('meta[name="pitch-course-world"]');
const status = mountCourseBootstrapStatus(document, {
  staticHref: courseMode ? "./course-runtime/static-course.html" : "#pitch-static-fallback",
  retry: () => window.location.reload(),
  ...(!courseMode ? { showStandaloneFallback: () => {
    const fallback = document.querySelector("noscript");
    if (fallback) {
      const template = document.createElement("template");
      template.innerHTML = fallback.textContent ?? "";
      fallback.replaceWith(template.content);
    }
  } } : {}),
});

async function bootstrapApplication(): Promise<void> {
  if (!compiledCourse && !document.querySelector('meta[name="pitch-course-world"]')) {
    // Preserve standalone generation while course builds remove this branch.
    const { canonicalRuntimeArtifact } = await import("./graph-scene-data.ts");
    const { startPresentation } = await import("./presentation-main.ts");
    await startPresentation(canonicalRuntimeArtifact);
    return;
  }
  performance.mark("pcd-world-bootstrap-start");
  const manifest = await loadCourseManifest();

  // Only metadata is imported here. Reveal, charts, KaTeX and semantic snapshots
  // are loaded after selecting a level, not while browsing the course world.
  const model = createPitchCourseWorldModel(manifest.offering,
    manifest.documents, manifest.bindings);
  const url = new URL(window.location.href);
  const requested = url.searchParams.get("level");
  let directScene: string;
  try { directScene = decodeURIComponent(url.hash.replace(/^#\/?/, "")); }
  catch { throw new Error("This course link contains an invalid scene identifier."); }
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
    try {
      sessionStorage.removeItem("reveal-scroll-top");
      sessionStorage.removeItem("reveal-scroll-origin");
    } catch { /* Storage can be unavailable in privacy-restricted browsers. */ }
    const [artifact, { startPresentation }] = await Promise.all([
      loadCourseLevel(manifest, selected), import("./presentation-main.ts"),
    ]);
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
    const unmountMap = mountCourseWorldMap(shell);
    mountPageLifecycle(window, { destroy: unmountMap });
    performance.measure("pcd-world-bootstrap", "pcd-world-bootstrap-start");
    shell.addEventListener("click", event => {
      const button = event.target instanceof Element
        ? event.target.closest<HTMLButtonElement>("button[data-scene-document-id]") : null;
      if (!button) return;
      const next = new URL(window.location.href); next.searchParams.set("level", button.dataset.sceneDocumentId!); next.hash = "";
      window.location.assign(next);
    });
  }
}

await runCourseBootstrap(bootstrapApplication, status);
