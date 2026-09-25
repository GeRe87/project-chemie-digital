type ProjectionMode = "cards" | "publication";

function createToggle(documentRef: Document): HTMLDivElement {
  const shell = documentRef.createElement("div");
  shell.className = "presentation-projection-toggle";
  shell.setAttribute("role", "group");
  shell.setAttribute("aria-label", "Presentation projection");

  const label = documentRef.createElement("span");
  label.className = "presentation-projection-toggle-label";
  label.textContent = "PROJECTION";

  const button = documentRef.createElement("button");
  button.type = "button";
  button.className = "presentation-projection-toggle-button";
  button.setAttribute("aria-pressed", "false");
  button.setAttribute("aria-label", "Switch between card and publication projection");

  const cards = documentRef.createElement("span");
  cards.className = "presentation-projection-option presentation-projection-option-cards";
  cards.textContent = "CARDS";

  const track = documentRef.createElement("span");
  track.className = "presentation-projection-track";
  track.setAttribute("aria-hidden", "true");
  const thumb = documentRef.createElement("span");
  thumb.className = "presentation-projection-thumb";
  track.append(thumb);

  const publication = documentRef.createElement("span");
  publication.className = "presentation-projection-option presentation-projection-option-publication";
  publication.textContent = "PUBLICATION";

  button.append(cards, track, publication);
  shell.append(label, button);
  return shell;
}

function authoredText(node: Element | null): string | undefined {
  const value = node?.textContent?.trim();
  return value && value.length > 0 ? value : undefined;
}

function createPublicationProjection(
  documentRef: Document,
  scene: HTMLElement,
): HTMLElement | undefined {
  const cards = scene.querySelector<HTMLElement>('[data-layout-slot="cards"]');
  const takeaway = scene.querySelector<HTMLElement>('[data-layout-slot="takeaway"]');
  if (!cards || !takeaway) return undefined;

  const authoredParagraphs = Array.from(cards.querySelectorAll(":scope > li"))
    .map((item) => authoredText(item))
    .filter((value): value is string => value !== undefined);
  if (authoredParagraphs.length === 0) return undefined;

  const article = documentRef.createElement("article");
  article.className = "presentation-publication-projection";
  article.setAttribute("aria-hidden", "true");

  const meta = documentRef.createElement("div");
  meta.className = "presentation-publication-meta";
  meta.textContent = "ALTERNATIVE PROJECTION · PUBLICATION";

  const body = documentRef.createElement("div");
  body.className = "presentation-publication-body";
  for (const text of authoredParagraphs) {
    const paragraph = documentRef.createElement("p");
    paragraph.textContent = text;
    body.append(paragraph);
  }

  const footer = documentRef.createElement("div");
  footer.className = "presentation-publication-footer";
  footer.textContent = authoredText(takeaway) ?? "";

  article.append(meta, body, footer);
  return article;
}

function mountProjectionForScene(scene: HTMLElement): () => void {
  const documentRef = scene.ownerDocument;
  const article = createPublicationProjection(documentRef, scene);
  if (!article) return () => {};

  const toggle = createToggle(documentRef);
  const button = toggle.querySelector<HTMLButtonElement>("button");
  if (!button) return () => {};

  scene.append(toggle, article);
  let mode: ProjectionMode = "cards";

  const applyMode = (next: ProjectionMode): void => {
    mode = next;
    const publication = mode === "publication";
    scene.dataset.projectionMode = mode;
    button.setAttribute("aria-pressed", String(publication));
    article.setAttribute("aria-hidden", String(!publication));
  };

  const stopNavigation = (event: Event): void => event.stopPropagation();
  const onClick = (event: MouseEvent): void => {
    event.preventDefault();
    event.stopPropagation();
    applyMode(mode === "cards" ? "publication" : "cards");
  };

  button.addEventListener("pointerdown", stopNavigation);
  button.addEventListener("click", onClick);
  applyMode("cards");

  return () => {
    button.removeEventListener("pointerdown", stopNavigation);
    button.removeEventListener("click", onClick);
    toggle.remove();
    article.remove();
    delete scene.dataset.projectionMode;
  };
}

/**
 * Adds an alternate publication realization to every scene whose generic layout
 * identifies it as concept-specification. The projection reuses the already
 * compiled heading/card/takeaway content; no audience-authored content is
 * synthesized or selected by scene/resource identity.
 */
export function mountPresentationProjections(root: HTMLElement): () => void {
  const destroyers = Array.from(
    root.querySelectorAll<HTMLElement>('section[data-layout="concept-specification"]'),
  ).map(mountProjectionForScene);

  return () => {
    for (const destroy of destroyers.reverse()) destroy();
  };
}
