export type PitchLayout = "opening" | "statement" | "process" | "split-proof";

export interface PitchSlide {
  readonly id: string;
  readonly resourceId: string;
  readonly title: string;
  readonly body: string;
  readonly consequence?: string;
  readonly layout: PitchLayout;
  readonly eyebrow?: string;
  readonly visual?: readonly string[];
}

export const pitchSlides: readonly PitchSlide[] = Object.freeze([
  {
    id: "pitch-step-context",
    resourceId: "ex:pitch-vertical-slice-purpose",
    eyebrow: "Studiendekanat-Pitch",
    title: "Chemie digital denken – Wissen zuerst",
    body: "Der Studiendekanat-Pitch ist als erste durchgängige Anwendung vorgesehen und soll die geplante Plattformarchitektur anhand semantischer Inhalte, einer pfadgesteuerten Struktur und mehrerer erzeugter Ansichten demonstrieren.",
    consequence: "Früher Chemieanker: Wiederholte Messungen liefern nicht exakt denselben Wert – ihre Streuung wird zum sichtbaren Beispiel für wiederverwendbares Fachwissen.",
    layout: "opening",
    visual: ["Messwert 1", "Messwert 2", "Messwert 3", "Standardabweichung"]
  },
  {
    id: "pitch-step-knowledge-first",
    resourceId: "ex:pitch-knowledge-first-proposition",
    title: "Die Wissensbasis ist primär",
    body: "Die Plattform behandelt wissenschaftliche Konzepte, wiederverwendbare Lernressourcen und ihre Beziehungen als primäre Wissensbasis. Präsentationsansichten werden daraus erzeugt und sind nicht die alleinige Quelle des Inhalts.",
    consequence: "Lehrinhalte können aktualisiert werden, ohne jede Präsentation separat zu überarbeiten.",
    layout: "statement"
  },
  {
    id: "pitch-step-semantic-resources",
    resourceId: "ex:pitch-semantic-resource-layer",
    title: "Semantische Ressourcen",
    body: "Definitionen, mathematische Ausdrücke, Symbole, Beispiele, Übungen und Quellen sind adressierbare semantische Ressourcen, die in unterschiedlichen Lehr- und Ausgabeformaten wiederverwendet werden können.",
    consequence: "Eine fachlich geprüfte Definition bleibt über Vorlesung, Selbstlernen und Wissensnetzwerk hinweg identisch referenzierbar.",
    layout: "process",
    visual: ["Definition", "Formel", "Symbol", "Beispiel", "Übung", "Quelle"]
  },
  {
    id: "pitch-step-paths",
    resourceId: "ex:pitch-path-layer",
    title: "Pfade ordnen Wissen für einen Zweck",
    body: "Didaktische und narrative Pfade wählen semantische Ressourcen aus und ordnen sie für einen konkreten Lehr-, Selbstlern- oder Präsentationszweck, ohne Renderer-Komponenten festzulegen.",
    consequence: "Dasselbe Wissen kann für Erstsemester anders sequenziert werden als für eine Vertiefungsveranstaltung.",
    layout: "process",
    visual: ["Wissensbasis", "Lernpfad", "Zielgruppe"]
  },
  {
    id: "pitch-step-scenes",
    resourceId: "ex:pitch-scene-composition-layer",
    title: "Komposition ohne Renderer-Abhängigkeit",
    body: "Eine deterministische Kompositionsschicht überführt aufgelöste Pfade in rendererneutrale Szenendokumente und bewahrt dabei semantische Identitäten, Provenienz und Barrierefreiheitsinformationen.",
    consequence: "Lesereihenfolge, Herkunft und Textalternativen bleiben auch beim Wechsel des Ausgabekanals erhalten.",
    layout: "process",
    visual: ["Pfad", "Szenendokument", "Identität + Provenienz + A11y"]
  },
  {
    id: "pitch-step-renderer-boundary",
    resourceId: "ex:pitch-renderer-separation",
    title: "Reveal.js bleibt ein austauschbarer Renderer",
    body: "Konkrete Präsentationstechnologien bleiben hinter nachgelagerten Renderer-Adaptern gekapselt. Das Domänenmodell, die Pfadauflösung und die Szenenkomposition bleiben von einem einzelnen Ausgabekanal unabhängig.",
    consequence: "Die Fachinhalte müssen nicht an Folien-HTML oder eine einzelne Präsentationssoftware gekoppelt werden.",
    layout: "process",
    visual: ["Domänenmodell", "Renderer-Adapter", "Reveal.js"]
  },
  {
    id: "pitch-step-output-channels",
    resourceId: "ex:pitch-multiple-output-channels",
    title: "Eine Wissensbasis – mehrere Ausgaben",
    body: "Dieselbe semantische Wissensbasis kann für Live-Präsentationen, Selbstlernansichten, Wissensnetzwerke sowie Druck- und spätere offene Bildungsformate genutzt werden.",
    consequence: "Fachliche Pflege wird gebündelt, während die Darstellung an Nutzungssituationen angepasst bleibt.",
    layout: "process",
    visual: ["Live-Präsentation", "Selbstlernen", "Wissensnetzwerk", "Druck"]
  },
  {
    id: "pitch-step-proof",
    resourceId: "ex:pitch-standard-deviation-proof",
    title: "Proof of Concept: Standardabweichung",
    body: "Der technische Machbarkeitsnachweis nutzt die Standardabweichung als semantisch modelliertes Beispiel mit Definition, Formel, Symbolen, Beispielen, Übung, Lernpfad, Szenenkomposition und Wissensnetzwerkprojektion.",
    consequence: "Präzision beschreibt die Streuung wiederholter Messungen; sie ist nicht gleichbedeutend mit Richtigkeit oder Freiheit von systematischen Fehlern.",
    layout: "split-proof",
    visual: ["x̄", "s", "n", "Messreihe"]
  },
  {
    id: "pitch-step-next-step",
    resourceId: "ex:pitch-vertical-slice-purpose",
    title: "Nächster Schritt: gemeinsam am realen Lehrformat prüfen",
    body: "Der Studiendekanat-Pitch ist als erste durchgängige Anwendung vorgesehen und soll die geplante Plattformarchitektur anhand semantischer Inhalte, einer pfadgesteuerten Struktur und mehrerer erzeugter Ansichten demonstrieren.",
    consequence: "Die sichtbare Vertikalscheibe schafft eine konkrete Grundlage für technische, Datenschutz- und Barrierefreiheitsreviews sowie die spätere Verbindung mit der vollständigen semantischen Pipeline.",
    layout: "statement"
  }
]);

export function validatePitchSlides(slides: readonly PitchSlide[]): void {
  if (slides.length !== 9) throw new Error("Pitch preview requires exactly nine canonical slides");
  const ids = slides.map((slide) => slide.id);
  if (new Set(ids).size !== ids.length) throw new Error("Pitch slide ids must be unique");
  if (slides.some((slide) => !slide.title.trim() || !slide.body.trim() || !slide.resourceId.trim())) {
    throw new Error("Pitch slides require title, body and source resource id");
  }
  const required = ["opening", "statement", "process", "split-proof"];
  if (required.some((layout) => !slides.some((slide) => slide.layout === layout))) {
    throw new Error("Pitch preview must demonstrate all four renderer-owned layouts");
  }
}

export interface MinimalElement {
  innerHTML: string;
  appendChild(node: MinimalElement): void;
  setAttribute(name: string, value: string): void;
  className: string;
  textContent: string | null;
}

export interface PitchDomPort {
  createElement(tag: string): MinimalElement;
  root: MinimalElement;
}

function appendText(parent: MinimalElement, dom: PitchDomPort, tag: string, text: string, className?: string): void {
  const node = dom.createElement(tag);
  node.textContent = text;
  if (className) node.className = className;
  parent.appendChild(node);
}

export function mountPitchSlides(dom: PitchDomPort, slides: readonly PitchSlide[] = pitchSlides): () => void {
  validatePitchSlides(slides);
  dom.root.innerHTML = "";
  for (const slide of slides) {
    const section = dom.createElement("section");
    section.setAttribute("id", slide.id);
    section.setAttribute("data-resource-id", slide.resourceId);
    section.setAttribute("data-layout", slide.layout);
    section.setAttribute("aria-labelledby", `${slide.id}-title`);
    if (slide.eyebrow) appendText(section, dom, "p", slide.eyebrow, "eyebrow");
    const heading = dom.createElement("h2");
    heading.setAttribute("id", `${slide.id}-title`);
    heading.textContent = slide.title;
    section.appendChild(heading);
    appendText(section, dom, "p", slide.body, "lead");
    if (slide.visual?.length) {
      const visual = dom.createElement("div");
      visual.className = "visual-sequence";
      visual.setAttribute("role", "img");
      visual.setAttribute("aria-label", slide.visual.join(" → "));
      for (const item of slide.visual) appendText(visual, dom, "span", item, "visual-node");
      section.appendChild(visual);
    }
    if (slide.consequence) appendText(section, dom, "p", slide.consequence, "consequence");
    dom.root.appendChild(section);
  }
  let destroyed = false;
  return () => {
    if (destroyed) return;
    destroyed = true;
    dom.root.innerHTML = "";
  };
}

export function installNoNetworkGuard(target: { fetch?: typeof fetch; XMLHttpRequest?: unknown; WebSocket?: unknown }): () => void {
  const originalFetch = target.fetch;
  const originalXhr = target.XMLHttpRequest;
  const originalSocket = target.WebSocket;
  const deny = () => { throw new Error("Runtime network requests are prohibited in the pitch preview"); };
  target.fetch = deny as typeof fetch;
  target.XMLHttpRequest = deny;
  target.WebSocket = deny;
  return () => {
    target.fetch = originalFetch;
    target.XMLHttpRequest = originalXhr;
    target.WebSocket = originalSocket;
  };
}
