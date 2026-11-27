import { resolvePublicAssetUrl } from "./public-asset-url.ts";
import type { SceneBlock } from "../../../packages/core/src/scene-document.ts";

/** Only explicit authored media, including media inside semantic groups. */
export function authoredSvgUris(blocks: readonly SceneBlock[]): readonly string[] {
  return blocks.flatMap(block => block.kind === "group" ? authoredSvgUris(block.children)
    : block.kind === "media-reference" && block.mediaType === "image/svg+xml" ? [block.uri] : []);
}

const SVG_NS = "http://www.w3.org/2000/svg";
const tags = new Set(["svg", "g", "path", "rect", "circle", "ellipse", "line", "polyline", "polygon", "text", "tspan", "title", "desc"]);
const attributes = new Set(["viewBox", "x", "y", "x1", "x2", "y1", "y2", "cx", "cy", "r", "rx", "ry", "width", "height", "d", "points", "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "opacity", "fill-opacity", "stroke-opacity", "transform", "font-family", "font-size", "font-weight", "text-anchor", "dominant-baseline"]);

export function safeSvgAttribute(name: string, value: string): boolean {
  if (!attributes.has(name) || /url\s*\(|[<>\\]|javascript:|https?:|data:/iu.test(value)) return false;
  if (name === "fill" || name === "stroke") return /^(none|currentColor|#[a-f\d]{3,8}|var\(--pcd-[a-z\d-]+\))$/iu.test(value);
  return true;
}

/** Copy only inert SVG drawing primitives. Never insert fetched markup as HTML. */
export function sanitizeTeachingSvg(text: string, document: Document): SVGSVGElement {
  if (/<!DOCTYPE|<!ENTITY/iu.test(text)) throw new Error("SVG declarations are not allowed");
  const parsed = new DOMParser().parseFromString(text, "image/svg+xml");
  const root = parsed.documentElement;
  if (root.localName !== "svg" || parsed.querySelector("parsererror")) throw new Error("Invalid SVG");
  const copy = (input: Element): Element => {
    if (input.namespaceURI !== SVG_NS || !tags.has(input.localName)) throw new Error("Unsupported SVG element");
    const output = document.createElementNS(SVG_NS, input.localName);
    for (const attribute of input.attributes) {
      if (safeSvgAttribute(attribute.name, attribute.value)) output.setAttribute(attribute.name, attribute.value);
    }
    for (const child of input.childNodes) {
      if (child.nodeType === 1) output.appendChild(copy(child as Element));
      else if (child.nodeType === 3) output.appendChild(document.createTextNode(child.textContent ?? ""));
    }
    return output;
  };
  return copy(root) as SVGSVGElement;
}

// Timed talk illustrations opt into a build or focus sequence with a titled top-level group.
// The original SVG remains a complete illustration for static exports.
function mountSvgSteps(figure: HTMLElement, svg: SVGSVGElement): () => void {
  const layer = Array.from(svg.children).find(child =>
    child.localName === "g" && child.firstElementChild?.localName === "title"
    && (child.firstElementChild.textContent === "Presentation build steps"
      || (child.firstElementChild.textContent === "Presentation focus regions" && child.getAttribute("opacity") === "0")));
  if (!layer) return () => {};

  const regions = Array.from(layer.children).filter(child => child.localName === "g");
  if (!regions.length || regions.length > 12 || regions.length !== layer.children.length - 1) {
    return () => {};
  }
  const build = layer.firstElementChild?.textContent === "Presentation build steps";
  layer.classList.add(build ? "teaching-svg-build" : "teaching-svg-focus");
  layer.setAttribute("aria-hidden", "true");
  figure.dataset.presentationStepCount = String(regions.length);
  figure.dataset.presentationStepHost = build ? "svg-build" : "svg-focus";

  if (build) {
    const motionClasses = new Map([
      ["Scan sweep", "teaching-svg-sweep"],
      ["Turn clockwise", "teaching-svg-turn"],
      ["Turn counterclockwise", "teaching-svg-turn-reverse"],
      ["Dispatch pulse", "teaching-svg-pulse"],
      ["Delayed arrival", "teaching-svg-delayed"],
    ]);
    for (const group of layer.querySelectorAll("g")) {
      if (group.firstElementChild?.localName !== "title") continue;
      const motionClass = motionClasses.get(group.firstElementChild.textContent ?? "");
      if (motionClass) group.classList.add(motionClass);
    }
    regions[0].classList.add("is-visible");
  }

  const update = (event: Event) => {
    const step = (event as CustomEvent<{step: number}>).detail.step;
    regions.forEach((region, index) => {
      region.classList.toggle("is-focused", index + 1 === step);
      if (build) region.classList.toggle("is-visible", index < Math.max(1, step));
    });
  };
  figure.addEventListener("pcd-presentation-step", update);
  return () => {
    figure.removeEventListener("pcd-presentation-step", update);
    delete figure.dataset.presentationStepCount;
    delete figure.dataset.presentationStepHost;
  };
}

export async function mountTeachingSvgMedia(
  root: ParentNode,
  { stagedTalkSections }: { stagedTalkSections?: ReadonlySet<Element> } = {},
): Promise<() => void> {
  const cleanup: Array<() => void> = [];
  for (const figure of root.querySelectorAll<HTMLElement>('figure[data-media-type="image/svg+xml"]')) {
    const image = figure.querySelector<HTMLImageElement>("img");
    const uri = figure.dataset.mediaUri;
    if (!uri || !image) continue;
    const url = new URL(resolvePublicAssetUrl(uri), window.location.href);
    if (url.origin !== window.location.origin) continue;
    try {
      const response = await fetch(url.href, { credentials: "omit", redirect: "error" });
      if (!response.ok) throw new Error("Local SVG unavailable");
      const text = await response.text();
      if (text.length > 200_000) throw new Error("SVG exceeds drawing budget");
      const svg = sanitizeTeachingSvg(text, figure.ownerDocument);
      svg.classList.add("teaching-svg");
      svg.setAttribute("role", "img");
      svg.setAttribute("aria-label", image.alt);
      image.replaceWith(svg);
      const slide = figure.closest("section");
      const unmountSteps = slide && stagedTalkSections?.has(slide) ? mountSvgSteps(figure, svg) : undefined;
      cleanup.push(() => {
        unmountSteps?.();
        svg.replaceWith(image);
      });
    } catch {
      // Accessible image remains; an unsupported SVG never becomes inline markup.
      figure.dataset.mediaEnhancement = "static-fallback";
    }
  }
  return () => { for (const remove of cleanup.reverse()) remove(); };
}
