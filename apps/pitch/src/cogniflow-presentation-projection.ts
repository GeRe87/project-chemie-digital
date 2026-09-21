const SCENE_ID = "ex:scene-cogniflow-presentation-specifications--scene";

type ProjectionMode = "infobox" | "publication";

function paragraph(text: string): HTMLParagraphElement {
  const node = document.createElement("p");
  node.textContent = text;
  return node;
}

function createToggle(): HTMLDivElement {
  const shell = document.createElement("div");
  shell.className = "cogniflow-projection-toggle";
  shell.setAttribute("role", "group");
  shell.setAttribute("aria-label", "Presentation projection");

  const label = document.createElement("span");
  label.className = "cogniflow-projection-toggle-label";
  label.textContent = "PROJECTION";

  const button = document.createElement("button");
  button.type = "button";
  button.className = "cogniflow-projection-toggle-button";
  button.setAttribute("aria-pressed", "false");
  button.setAttribute("aria-label", "Switch between InfoBox and publication projection");

  const city = document.createElement("span");
  city.className = "cogniflow-projection-option cogniflow-projection-option-city";
  city.textContent = "INFOBOX";

  const track = document.createElement("span");
  track.className = "cogniflow-projection-track";
  track.setAttribute("aria-hidden", "true");
  const thumb = document.createElement("span");
  thumb.className = "cogniflow-projection-thumb";
  track.append(thumb);

  const publication = document.createElement("span");
  publication.className = "cogniflow-projection-option cogniflow-projection-option-publication";
  publication.textContent = "PUBLICATION";

  button.append(city, track, publication);
  shell.append(label, button);
  return shell;
}

function createPublicationProjection(): HTMLElement {
  const article = document.createElement("article");
  article.className = "cogniflow-publication-projection";
  article.setAttribute("aria-hidden", "true");

  const meta = document.createElement("div");
  meta.className = "cogniflow-publication-meta";
  meta.textContent = "SEMANTICS-FIRST PRESENTATION MODEL · ALTERNATIVE PROJECTION";

  const title = document.createElement("h3");
  title.textContent = "Separating Meaning from Presentation";

  const body = document.createElement("div");
  body.className = "cogniflow-publication-body";

  body.append(
    paragraph("Presentation elements can be described independently of their concrete visual appearance. In this model, PresentationElement provides the general domain, while InfoBox and Text make the content-bearing structure explicit. Theme and ThemeToken describe the visual vocabulary without changing what the element means."),
    paragraph("An InfoBox is a PresentationElement with explicit text and a reusable theme. The hasText relation connects the box to its content, while usesTheme connects it to the visual system. Surface, border, typography and accent are therefore presentation choices rather than hidden assumptions in the content."),
    paragraph('The concrete Processing Unit Info Box specifies the text “PROCESSING UNIT” and applies the Eco City theme. Its default projection is the colored InfoBox used throughout this presentation, with strong framing and bold monospaced typography.'),
    paragraph("The same semantic description can also be projected as publication prose. The entities, relationships and intended meaning remain unchanged; only the rendering strategy changes. This is the central separation: semantics define what is expressed, while a projection determines how that meaning is presented to a particular audience or medium."),
  );

  const footer = document.createElement("div");
  footer.className = "cogniflow-publication-footer";
  footer.textContent = "Same semantic model · different projection";

  article.append(meta, title, body, footer);
  return article;
}

export function mountCogniflowPresentationProjection(root: HTMLElement): () => void {
  const scene = root.querySelector<HTMLElement>(`#${CSS.escape(SCENE_ID)}`);
  if (!scene) return () => {};

  const toggle = createToggle();
  const button = toggle.querySelector<HTMLButtonElement>("button");
  if (!button) return () => {};

  const article = createPublicationProjection();
  scene.append(toggle, article);

  let mode: ProjectionMode = "infobox";

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
    applyMode(mode === "infobox" ? "publication" : "infobox");
  };

  button.addEventListener("pointerdown", stopNavigation);
  button.addEventListener("click", onClick);
  applyMode("infobox");

  return () => {
    button.removeEventListener("pointerdown", stopNavigation);
    button.removeEventListener("click", onClick);
    toggle.remove();
    article.remove();
    delete scene.dataset.projectionMode;
  };
}
