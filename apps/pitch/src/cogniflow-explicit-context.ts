const SCENE_ID = "ex:scene-cogniflow-explicit-processing-context--scene";

const signalTones: Readonly<Record<string, string>> = Object.freeze({
  purpose: "purpose",
  input: "input",
  inputs: "input",
  interface: "input",
  output: "output",
  outputs: "output",
  parameters: "parameters",
  implementation: "implementation",
  version: "version",
  execution: "execution",
  provenance: "execution",
});

const signalPattern = /\b(purpose|inputs?|interface|outputs?|parameters|implementation|version|execution|provenance)\b/gi;

function decorate(item: HTMLLIElement): () => void {
  const original = item.textContent ?? "";
  const matches = Array.from(original.matchAll(signalPattern));
  if (!matches.length) return () => undefined;

  const fragment = document.createDocumentFragment();
  let cursor = 0;

  for (const match of matches) {
    const index = match.index ?? 0;
    const word = match[0];
    if (index > cursor) fragment.append(document.createTextNode(original.slice(cursor, index)));

    const span = document.createElement("span");
    span.className = "cogniflow-context-signal";
    span.dataset.signalTone = signalTones[word.toLowerCase()] ?? "purpose";
    span.textContent = word;
    fragment.append(span);
    cursor = index + word.length;
  }

  if (cursor < original.length) fragment.append(document.createTextNode(original.slice(cursor)));
  item.replaceChildren(fragment);

  return () => { item.textContent = original; };
}

export function mountCogniflowExplicitContextSignals(root: HTMLElement): () => void {
  const scene = root.querySelector<HTMLElement>(`section[id="${SCENE_ID}"]`);
  if (!scene) return () => undefined;

  const cleanups = Array.from(scene.querySelectorAll<HTMLLIElement>(".keypoint-list > li")).map(decorate);
  return () => { for (const cleanup of cleanups) cleanup(); };
}
