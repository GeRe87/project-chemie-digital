import { validatePresentationTitle, type PresentationTitleMetadata } from "../../core/src/presentation-metadata.ts";

function escape(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

/** Standard layout for any semantically authored scientific work, not a talk-specific slide. */
export function renderScientificTitle(metadata: PresentationTitleMetadata, assetUrl: (uri: string) => string = uri => uri): string {
  validatePresentationTitle(metadata);
  const event = metadata.event;
  return `<div class="scientific-title" data-presentation-id="${escape(metadata.id)}">
    ${event ? `<p class="scientific-title-event">${escape(event.name)}</p>` : ""}
    <h1>${escape(metadata.title)}</h1>
    ${metadata.subtitle ? `<p class="scientific-title-subtitle">${escape(metadata.subtitle)}</p>` : ""}
    ${event?.date || event?.location ? `<p>${escape([event.date, event.location].filter(Boolean).join(" · "))}</p>` : ""}
    <ol class="scientific-title-authors" aria-label="Authors">${metadata.authors.map(author => `<li data-author-id="${escape(author.id)}"><strong>${escape(author.name)}</strong>${author.affiliations.map(a => `<span class="scientific-title-affiliation" data-affiliation-id="${escape(a.id)}">${a.lines.map(escape).join("<br>")}</span>`).join("")}</li>`).join("")}</ol>
    ${metadata.logos.length ? `<div class="scientific-title-logos" aria-label="Institutional and project logos">${metadata.logos.map(logo => logo.uri
      ? `<img src="${escape(assetUrl(logo.uri))}" alt="${escape(logo.label)}">`
      : `<span class="scientific-title-logo-placeholder">${escape(logo.label)}</span>`).join("")}</div>` : ""}
  </div>`;
}
