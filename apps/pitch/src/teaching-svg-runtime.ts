import { walkSceneBlocks } from "../../../packages/core/src/scene-blocks.ts";
import { resolvePublicAssetUrl } from "./public-asset-url.ts";
import { isPanoramicMedia } from "./media-geometry.ts";
import type { SceneBlock } from "../../../packages/core/src/scene-document.ts";

/** Only explicit authored media, including media inside semantic groups. */
export function authoredSvgUris(blocks: readonly SceneBlock[]): readonly string[] {
  return [...walkSceneBlocks(blocks)].flatMap(block =>
    block.kind === "media-reference" && block.mediaType === "image/svg+xml" ? [block.uri] : []);
}

const SVG_NS = "http://www.w3.org/2000/svg";
const tags = new Set(["svg", "g", "path", "rect", "circle", "ellipse", "line", "polyline", "polygon", "text", "tspan", "title", "desc"]);
const attributes = new Set(["viewBox", "x", "y", "x1", "x2", "y1", "y2", "cx", "cy", "r", "rx", "ry", "width", "height", "d", "points", "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "opacity", "fill-opacity", "stroke-opacity", "transform", "font-family", "font-size", "font-weight", "text-anchor", "dominant-baseline"]);

export function safeSvgAttribute(name: string, value: string): boolean {
  if (name === "data-fluid-y") return /^\d{1,4} \d{1,4}$/u.test(value);
  if (name === "data-fluid-row") return /^\d{1,4}$/u.test(value);
  if (name === "data-teaching-stage-count") return /^[1-4]$/u.test(value);
  if (name === "data-teaching-stage-mode") return value === "exclusive" || value === "cumulative";
  if (name === "data-svg-stage") return /^[0-4]$/u.test(value);
  if (name === "data-pair-reveal") return value === "true";
  if (name === "data-pair-points") return value === "selected" || value === "context";
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

/** Adjust the row spacing to the available viewport while keeping marks and type uniform. */
function mountFluidSvgRows(svg: SVGSVGElement, dimensions: readonly number[]): () => void {
  const axis = svg.getAttribute("data-fluid-y")?.split(" ").map(Number);
  const [left, top, width, height] = dimensions;
  if (!axis || left === undefined || top === undefined || !width || !height) return () => {};
  const [first, last] = axis;
  if (first === undefined || last === undefined || last <= first || first < top || last > top + height) return () => {};
  const rows = Array.from(svg.querySelectorAll("[data-fluid-row]"), element => ({
    element,
    anchor: Number(element.getAttribute("data-fluid-row")),
    transform: element.getAttribute("transform") ?? "",
  }));

  const observer = new ResizeObserver(([entry]) => {
    const box = entry?.contentRect;
    if (!box?.width || !box.height) return;
    // Keep a readable minimum for dense plots in very short viewports.
    const fittedHeight = Math.max(height * .8, width * box.height / box.width);
    const extra = fittedHeight - height;
    svg.setAttribute("viewBox", [left, top, width, fittedHeight].join(" "));
    for (const row of rows) {
      const progress = Math.max(0, Math.min(1, (row.anchor - first) / (last - first)));
      row.element.setAttribute("transform", `translate(0 ${extra * progress}) ${row.transform}`.trim());
    }
  });
  observer.observe(svg);
  return () => observer.disconnect();
}

export async function mountTeachingSvgMedia(root: ParentNode): Promise<() => void> {
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
      const dimensions = svg.getAttribute("viewBox")?.trim().split(/[\s,]+/u).map(Number);
      if (dimensions?.length === 4 && dimensions[2]! > 0 && dimensions[3]! > 0) {
        figure.setAttribute("data-media-aspect", isPanoramicMedia(dimensions[2]!, dimensions[3]!) ? "panoramic" : "standard");
      }
      image.replaceWith(svg);
      const unmountFluidRows = dimensions?.length === 4 && !document.documentElement.classList.contains("print-pdf")
        ? mountFluidSvgRows(svg, dimensions)
        : () => {};
      cleanup.push(() => { unmountFluidRows(); svg.replaceWith(image); });
    } catch {
      // Accessible image remains; an unsupported SVG never becomes inline markup.
      figure.dataset.mediaEnhancement = "static-fallback";
    }
  }
  return () => { for (const remove of cleanup.reverse()) remove(); };
}
