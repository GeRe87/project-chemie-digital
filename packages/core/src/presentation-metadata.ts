/** Generated scientific-work metadata. No renderer, CSS or browser dependencies. */
export interface PresentationTitleMetadata {
  readonly version: "1.0";
  readonly id: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly event?: { readonly id: string; readonly name: string; readonly date?: string; readonly location?: string };
  readonly authors: readonly {
    readonly id: string;
    readonly name: string;
    readonly affiliations: readonly { readonly id: string; readonly lines: readonly string[] }[];
  }[];
  readonly logos: readonly { readonly id: string; readonly label: string; readonly uri?: string }[];
  readonly source: readonly { readonly resourceId: string; readonly provenanceIds?: readonly string[] }[];
}

export function validatePresentationTitle(value: PresentationTitleMetadata): void {
  const text = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
  const iri = (v: unknown) => text(v) && /^https?:\/\/[^\s]+$/.test(v);
  if (!value || value.version !== "1.0" || !iri(value.id) || !text(value.title)
    || !Array.isArray(value.authors) || !value.authors.length || !Array.isArray(value.logos)
    || !Array.isArray(value.source) || !value.source.length) throw new Error("Invalid scientific title metadata");
  if (value.subtitle !== undefined && !text(value.subtitle)) throw new Error("Invalid subtitle");
  if (value.event && (!iri(value.event.id) || !text(value.event.name)
    || (value.event.date !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(value.event.date))
    || (value.event.location !== undefined && !text(value.event.location)))) throw new Error("Invalid presentation event");
  for (const author of value.authors) {
    if (!iri(author.id) || !text(author.name) || !Array.isArray(author.affiliations)) throw new Error("Invalid presentation author");
    for (const affiliation of author.affiliations) {
      if (!iri(affiliation.id) || !Array.isArray(affiliation.lines) || !affiliation.lines.length
        || !affiliation.lines.every(text)) throw new Error("Invalid presentation affiliation");
    }
  }
  const logos = new Set<string>();
  for (const logo of value.logos) {
    if (!iri(logo.id) || logos.has(logo.id) || !text(logo.label)
      || (logo.uri !== undefined && (!/^\/?[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_.-]+)+$/.test(logo.uri) || logo.uri.includes("..")))) {
      throw new Error("Invalid presentation logo");
    }
    logos.add(logo.id);
  }
}
