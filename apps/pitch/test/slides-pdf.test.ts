import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isSlidesPdf, slidesPdfUrl, presentationUrl, PRINT_CONTENT_SELECTOR, isPrintContentBox } from "../src/slides-pdf.ts";

test("slides PDF is explicit and distinct from the script view", () => {
  assert.equal(isSlidesPdf("?mode=script"), false);
  assert.equal(isSlidesPdf("?print-pdf"), true);
  assert.equal(isSlidesPdf("?preview=print-pdf-example"), false);
});
test("export preserves selected lecture and theme, not script or live execution state", () => {
  const url = new URL(slidesPdfUrl("https://example.test/authoring.html?preview=authoring-test&mode=script&interactive=1&theme=light#/slide-8"));
  assert.equal(url.searchParams.get("preview"), "authoring-test");
  assert.equal(url.searchParams.get("theme"), "light");
  assert.equal(url.searchParams.get("view"), "deck");
  assert.ok(url.searchParams.has("print-pdf"));
  assert.equal(url.searchParams.has("mode"), false);
  assert.equal(url.searchParams.has("interactive"), false);
  assert.equal(url.hash, "");
  assert.equal(new URL(presentationUrl(url.href)).searchParams.has("print-pdf"), false);
});
test("renderer uses one page per slide, all fragments together, no notes or mobile canvas", () => {
  const main = readFileSync(new URL("../src/presentation-main.ts", import.meta.url), "utf8");
  assert.match(main, /pdfSeparateFragments: false, pdfMaxPagesPerSlide: 1/);
  assert.match(main, /pdfPageHeightOffset: 0, showNotes: false/);
  assert.match(main, /const nativePortraitViewport = !slidesPdf/);
  assert.match(main, /await document.fonts.ready; prepareSlidesPdf\(root\)/);
});
test("print-only fit includes descendants rather than clipping tall symbol legends", () => {
  const source = readFileSync(new URL("../src/slides-pdf.ts", import.meta.url), "utf8");
  assert.match(source, /fitSlidesPdf\(root\)/);
  assert.match(source, /rect.bottom - origin.top/);
  assert.match(source, /page.clientHeight - 40/);
  const css = readFileSync(new URL("../src/slides-pdf.css", import.meta.url), "utf8");
  assert.match(css, /\.formula-with-legend.*overflow:visible!important/);
});
test("fit measures visible containers, not KaTeX's oversized radical SVG paths", () => {
  assert.ok(PRINT_CONTENT_SELECTOR.includes(".katex-html"));
  assert.ok(PRINT_CONTENT_SELECTOR.includes(".katex-html .base"));
  assert.ok(PRINT_CONTENT_SELECTOR.includes(".definition-list-entry"));
  assert.ok(!PRINT_CONTENT_SELECTOR.split(",").includes("*"));
  assert.ok(!PRINT_CONTENT_SELECTOR.split(",").includes("path"));
  const element = (tag: string, hidden: boolean, katex: boolean) => ({
    tagName: tag,
    closest(selector: string) { return selector === ".katex" ? (katex ? {} : null) : (hidden ? {} : null); },
  }) as unknown as Element;
  assert.equal(isPrintContentBox(element("svg", false, true)), false);
  assert.equal(isPrintContentBox(element("SPAN", true, true)), false);
  assert.equal(isPrintContentBox(element("svg", false, false)), true);
  assert.equal(isPrintContentBox(element("DIV", false, true)), true);
});
test("print retains the renderer's composition and excludes screen-only responsive reflow", () => {
  const source = readFileSync(new URL("../src/slides-pdf.ts", import.meta.url), "utf8");
  assert.match(source, /--pcd-pdf-display/);
  const css = readFileSync(new URL("../src/slides-pdf.css", import.meta.url), "utf8");
  assert.match(css, /display:var\(--pcd-pdf-display,block\)!important/);
  assert.match(css, /section\[data-composition-profile="visual-formula"\]\s*\{ display:grid!important/);
  assert.match(source, /html\.classList\.remove\("print-pdf"\)/);
  for (const file of ["learning-stage-primitives", "component-composition", "card-primitives", "evidence-primitives", "media-stage-primitives", "visual-stage-primitives", "progression-primitives", "teaching-primitives", "chart-theme"]) {
    const styles = readFileSync(new URL(`../src/${file}.css`, import.meta.url), "utf8");
    assert.doesNotMatch(styles, /@media\s*\(max-width:/, file);
  }
});
test('paper charts have an intrinsic SVG viewport rather than a zero-height flex remainder',()=>{
 const css=readFileSync(new URL('../src/slides-pdf.css',import.meta.url),'utf8');
 assert.match(css,/html\.print-pdf[^{}]*\[data-chart-block-id\] \.d3-chart-svg\s*\{[^}]*flex:none!important[^}]*height:auto!important/s);
 assert.match(css,/\.media-reference img[^}]*height:auto!important/s);
 const audit=readFileSync(new URL('../../../scripts/check_slides_pdf_browser.cjs',import.meta.url),'utf8');
 assert.match(audit,/missing or collapsed core graphic/);assert.match(audit,/colliding formula comparison/);
});
test('multiple complete formula units form stacked comparison cards',()=>{
 const css=readFileSync(new URL('../src/teaching-primitives.css',import.meta.url),'utf8');
 assert.match(css,/:has\(> \.formula-with-legend ~ \.formula-with-legend\)\s*\{\s*display:grid;grid-template-columns:minmax\(0,1fr\)/);
});
