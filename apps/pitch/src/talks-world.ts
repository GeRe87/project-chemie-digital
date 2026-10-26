import { resolvePresentationCollection, type PresentationCollection } from "../../../packages/core/src/presentation-collection.ts";
import type { CanonicalRuntimeSceneDocumentBinding } from "../../../packages/core/src/canonical-runtime.ts";
export type { PresentationCollection } from "../../../packages/core/src/presentation-collection.ts";
import { resolvePublicAssetUrl } from "./public-asset-url.ts";

export interface WorldDocument { readonly id: string; readonly pathId: string; readonly sceneIds: readonly string[]; readonly runtime: string }

export function resolveTalks(collection: PresentationCollection, documents: readonly WorldDocument[], bindings: readonly CanonicalRuntimeSceneDocumentBinding[]) {
  return resolvePresentationCollection(collection, documents, bindings);
}

const escape = (v: string) => v.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
export function renderTalksWorld(collection: PresentationCollection, talks: ReturnType<typeof resolveTalks>): string {
  return `<section class="talks-world" aria-labelledby="pitch-course-world-title">
    <p class="pitch-world-kicker">SCIENTIFIC PRESENTATIONS</p>
    <h1 id="pitch-course-world-title" tabindex="-1">${escape(collection.title)}</h1>
    <p>Select a talk to enter its presentation.</p>
    <ol class="talks-world-grid">${talks.map(talk => `<li><article class="pitch-world-card">
      <p>Scientific talk</p><h2>${escape(talk.title)}</h2>${talk.event ? `<p>${escape(talk.event.name)}</p>` : ""}
      <button type="button" class="pitch-world-start" data-scene-document-id="${escape(talk.document.id)}">Open presentation <span aria-hidden="true">→</span></button>
    </article></li>`).join("")}
    <li class="talks-future"><h2>Future Talks</h2><p>This collection can grow with new semantically authored presentations.</p></li></ol>
    <p class="talks-reference">Reference: <a href="https://chemometrics.odea-project.org/">Chemometrics course ↗</a></p>
    <p><a href="${escape(resolvePublicAssetUrl("course-runtime/static-course.html"))}">Read static presentation</a></p>
  </section>`;
}
