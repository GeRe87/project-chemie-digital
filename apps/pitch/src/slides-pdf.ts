/** PDF is a renderer view of the same slides, not a second content source. */
export function isSlidesPdf(search: string): boolean {
  return new URLSearchParams(search).has("print-pdf");
}

export function slidesPdfUrl(href: string): string {
  const url = new URL(href);
  url.searchParams.delete("mode");
  url.searchParams.delete("interactive");
  url.searchParams.set("print-pdf", "");
  url.searchParams.set("view", "deck");
  url.hash = "";
  return url.href;
}

export function presentationUrl(href: string): string {
  const url = new URL(href);
  url.searchParams.delete("print-pdf");
  return url.href;
}

export function mountSlidesPdfLink(tools: HTMLElement): () => void {
  const link = document.createElement("a");
  link.className = "pcd-slides-pdf-link";
  link.textContent = "Slides PDF";
  link.setAttribute("aria-label", "Open slides for printing: one slide per landscape page");
  link.title = "Print / Save slides as PDF";
  link.href = slidesPdfUrl(location.href);
  link.target = "_blank";
  link.rel = "noopener";
  tools.append(link);
  return () => link.remove();
}

/** Wait for printable media without silently omitting a failed image. */
export async function readySlidesPdf(root: HTMLElement): Promise<void> {
  await document.fonts.ready;
  await Promise.all([...root.querySelectorAll("img")].map(async image => {
    if (image.dataset.src && !image.getAttribute("src")) image.src = image.dataset.src;
    image.loading = "eager";
    await image.decode();
  }));
  await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  fitSlidesPdf(root);
}

/** Fit the complete rendered content, including tall formula legends, into one
 * landscape page. This is print-only adapter geometry, never authored RDF. */
export const PRINT_CONTENT_SELECTOR = "h1,h2,h3,h4,p,li,dt,dd,pre,table,figure,img,canvas,svg,.math-display,.katex-html,.katex-html .base,.definition-list-entry,.pcd-composition-region";

/** KaTeX uses oversized SVG paths clipped to a short radical/rule and a separate
 * visually clipped MathML accessibility tree. Neither is slide layout geometry.
 * Measure the visible formula container and outer graphic viewport instead. */
export function isPrintContentBox(element: Element): boolean {
  // Reveal retains [hidden] on offscreen sections but explicitly displays them
  // in print view. Actual computed visibility, not that marker, is authoritative.
  if (element.closest(".katex-mathml,math,dialog:not([open])")) return false;
  if (element.tagName.toLowerCase() === "svg" && element.closest(".katex")) return false;
  return true;
}

/** Reveal's print stylesheet otherwise replaces the renderer's grids with block
 * flow. Preserve the desktop composition before print view applies its rules. */
export function prepareSlidesPdf(root: HTMLElement): void {
  for (const legend of root.querySelectorAll<HTMLDetailsElement>("details.symbol-legend-disclosure")) legend.open = true;
  // The print override itself defaults to block until this property is known.
  // Read the underlying composition without that override, not its own fallback.
  const html = root.ownerDocument.documentElement;
  const printing = html.classList.contains("print-pdf");
  if (printing) html.classList.remove("print-pdf");
  for (const slide of root.querySelectorAll<HTMLElement>("section")) {
    slide.style.removeProperty("display");
    const display = getComputedStyle(slide).display;
    slide.style.setProperty("--pcd-pdf-display", display === "grid" || display === "flex" ? display : "block");
  }
  if (printing) html.classList.add("print-pdf");
}

export function fitSlidesPdf(root: HTMLElement): void {
  for (const page of root.querySelectorAll<HTMLElement>(".pdf-page")) {
    const slide = page.querySelector<HTMLElement>("section");
    if (!slide) continue;
    slide.style.setProperty("transform", "none", "important");
    slide.style.setProperty("zoom", "1");
    slide.style.setProperty("height", "900px", "important");
    slide.style.transformOrigin = "top left";
    slide.style.left = "20px";
    slide.style.top = "20px";
    const origin = slide.getBoundingClientRect();
    let width = origin.width, height = origin.height;
    for (const element of slide.querySelectorAll<HTMLElement>(PRINT_CONTENT_SELECTOR)) {
      if (!isPrintContentBox(element)) continue;
      const style = getComputedStyle(element);
      if (style.display === "none" || style.visibility === "hidden" || !element.getClientRects().length) continue;
      const rect = element.getBoundingClientRect();
      width = Math.max(width, rect.right - origin.left);
      height = Math.max(height, rect.bottom - origin.top);
    }
    // Grow the slide surface as well as its visible contents. Reserve a footer
    // line so the topic label cannot cover the final legend paragraph.
    height += 28;
    slide.style.setProperty("height", `${height}px`, "important");
    const scale = Math.min(1, (page.clientWidth - 40) / width, (page.clientHeight - 40) / height);
    slide.dataset.pdfScale = String(scale);
    // Layout zoom, unlike a visual transform, also scales print fragmentation.
    // A transform can paint a card inside the page while the native PDF engine
    // still breaks its final paragraph at an unscaled boundary.
    slide.style.setProperty("zoom", String(scale));
    slide.style.left = `${(page.clientWidth - width * scale) / (2 * scale)}px`;
    slide.style.top = `${20 / scale}px`;
  }
}

export function mountSlidesPdfToolbar(root: HTMLElement): () => void {
  const toolbar = document.createElement("header");
  toolbar.className = "pcd-slides-pdf-toolbar";
  const hint = document.createElement("p");
  hint.textContent = "Slides PDF: one complete slide per landscape page. Choose Save as PDF, 100% scale, no margins or browser headers/footers. Enable background graphics. Interactive exercises remain static; code is not executed.";
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Print / Save slides as PDF";
  button.disabled = true;
  const back = document.createElement("a");
  back.href = presentationUrl(location.href);
  back.textContent = "Back to presentation";
  const status = document.createElement("p");
  status.setAttribute("role", "status");
  status.textContent = "Preparing fonts and images…";
  toolbar.append(hint, button, back, status);
  document.body.prepend(toolbar);
  let disposed = false;
  void readySlidesPdf(root).then(() => {
    if (disposed) return;
    button.disabled = false;
    status.textContent = "Ready to print.";
    document.body.dataset.slidesPdfReady = "true";
  }).catch(() => {
    if (!disposed) status.textContent = "A slide image could not be loaded. Reload before printing.";
  });
  const print = () => window.print();
  // Native print media can have a different viewport from its screen preview.
  // Refit synchronously after the screen-only responsive rules are removed.
  const beforePrint = () => fitSlidesPdf(root);
  window.addEventListener("beforeprint", beforePrint);
  button.addEventListener("click", print);
  return () => { disposed = true; window.removeEventListener("beforeprint", beforePrint); button.removeEventListener("click", print); toolbar.remove(); delete document.body.dataset.slidesPdfReady; };
}
