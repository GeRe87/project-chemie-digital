// Run against the generated local ANOVA authoring preview.
const assert = require("node:assert/strict");
const { chromium } = require("playwright");

const base = process.argv[2] ?? "http://127.0.0.1:5201";
const cases = [
  ["l7-scene-spread-lab", [["l7-spread-observation", 1], ["l7-spread-takeaway", 2]]],
  ["l7-scene-pair-perspectives", [["l7-perspectives-takeaway", 1]]],
  ["l7-scene04", [["l7-intro-hypothesis-perspectives", 1], ["l7-intro-takeaway-04", 2]]],
  ["l7-scene05", [["l7-setup-takeaway", 5]]],
  ["l7-scene08", [["l7-intro-takeaway-08", 1]]],
  ["l7-scene18", [["l7-next-18-takeaway", 4]]],
  ["l7-scene21", [["l7-next-21-takeaway", 4]]],
  ["l7-scene36-additive", [["l7-additive-table-takeaway", 4]]],
  ["l7-scene-interaction-test", [["l7-interaction-test-takeaway", 5]]],
  ["l7-scene-post-hoc-rule", [["l7-post-hoc-rule-takeaway", 2]]],
  ["l7-scene-post-hoc-spe", [["l7-post-hoc-spe-takeaway", 1]]],
];

const remainingCases = [
  ["l7-scene22-question", "l7-teaching-22-question-conclusion", 2],
  ["l7-scene22", "l7-next-22-takeaway", 2],
  ["l7-scene23", "l7-next-23-takeaway", 3],
  ["l7-scene-operator-assignment", "l7-operator-assignment-takeaway", 1],
  ["l7-scene-operator-compare", "l7-operator-compare-takeaway", 1],
  ["l7-scene30", "l7-next-30-takeaway", 3],
  ["l7-scene32", "l7-next-32-takeaway", 2],
  ["l7-scene34", "l7-next-34-takeaway", 4],
  ["l7-scene-additive-averages", "l7-additive-averages-takeaway", 3],
  ["l7-scene-treatment-one-way", "l7-treatment-one-way-takeaway", 4],
  ["l7-scene-treatment-design", "l7-treatment-design-takeaway", 1],
  ["l7-scene-treatment-two-way", "l7-treatment-two-way-takeaway", 4],
  ["l7-scene-compare-patterns", "l7-compare-patterns-takeaway", 2],
  ["l7-scene-interaction-meaning", "l7-interaction-meaning-takeaway", 1],
  ["l7-scene-interaction-model", "l7-interaction-model-takeaway", 3],
  ["l7-scene-interaction-worked", "l7-interaction-worked-takeaway", 4],
  ["l7-scene-post-hoc-cutoff", "l7-post-hoc-cutoff-takeaway", 2],
].map(([scene, resource, stage]) => [scene, [[resource, stage]]]);

async function checkStages(page, view, theme, sceneId, expected) {
  const url = new URL("/authoring.html", base);
  url.search = new URLSearchParams({ preview: "authoring-anova-intro", interactive: "1", view, theme });
  url.hash = `/ex:${sceneId}--scene`;
  await page.goto(url.href);
  const slide = page.locator(`section.present[id="ex:${sceneId}--scene"]`);
  await slide.locator('[data-presentation-step="0"]').first().waitFor();
  const finalStage = Math.max(...expected.map(([, stage]) => stage));
  for (let stage = 0; stage <= finalStage; stage++) {
    if (stage) await page.keyboard.press("ArrowRight");
    for (const [resource, revealAt] of expected) {
      const visible = stage >= revealAt;
      const block = slide.locator(`[data-resource-id~="ex:${resource}"][data-presentation-disclosure-visible="${visible}"]`);
      await block.waitFor({ state: "attached" });
      assert.equal(await block.isVisible(), visible, `${sceneId}, stage ${stage}, ${resource}`);
    }
    if (sceneId === "l7-scene05" && stage === 4) {
      await slide.locator('figure[data-svg-stage-active="3"][data-presentation-step="4"]').waitFor();
    }
    if (sceneId === "l7-scene18") {
      const result = slide.locator('svg text').filter({ hasText: /^0\.00004484$/ });
      await result.waitFor({ state: stage < 3 ? "hidden" : "visible" });
      const resultGraphic = slide.locator('figure[data-media-uri="/chemometrics/level7-anova-read-table.svg"] svg');
      assert.equal((await resultGraphic.getAttribute("aria-label")).includes("0.00004484"), stage >= 3);
    }
    if (sceneId === "l7-scene-post-hoc-rule") {
      await slide.locator("svg text").filter({ hasText: /A vs C.*Significant/ })
        .waitFor({ state: stage === 0 ? "hidden" : "visible" });
    }
  }
  const footer = slide.locator(".pcd-slide-footer");
  if (await footer.count()) {
    const rail = await footer.locator(".scene-references").boundingBox();
    const conclusion = await footer.locator("[data-lecture-takeaway]").boundingBox();
    const bounds = await slide.boundingBox();
    assert.ok(rail && conclusion && bounds, `${sceneId}: missing footer content`);
    assert.ok(conclusion.y + conclusion.height <= rail.y + 1, `${sceneId}: conclusion overlaps references`);
    assert.ok(rail.y + rail.height <= bounds.y + bounds.height + 1, `${sceneId}: references overflow slide`);
    const observation = await footer.locator(".pcd-footer-observation").first().count()
      ? await footer.locator(".pcd-footer-observation").boundingBox()
      : null;
    if (observation) {
      const plot = await slide.locator(".pcd-spread-lab").boundingBox();
      assert.ok(plot && plot.y + plot.height <= observation.y + 1, "Spread lab overlaps observation");
      assert.ok(observation.y + observation.height <= conclusion.y + 1, "Observation overlaps conclusion");
    }
  }
}

async function main() {
  const browser = await chromium.launch();
  try {
    for (const view of ["deck", "scroll"]) {
      for (const theme of ["dark", "light"]) {
        for (const [sceneId, expected] of cases) {
          const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
          page.setDefaultTimeout(5000);
          await checkStages(page, view, theme, sceneId, expected);
          await page.close();
        }
      }
    }
    for (const [sceneId, expected] of remainingCases) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      page.setDefaultTimeout(5000);
      await checkStages(page, "deck", "dark", sceneId, expected);
      await page.close();
    }
    const page = await browser.newPage();
    page.setDefaultTimeout(5000);
    const ratioUrl = new URL("/authoring.html?preview=authoring-anova-intro&interactive=1&view=deck#/ex:l7-intro-scene13--scene", base);
    await page.goto(ratioUrl.href);
    await page.locator(".pcd-visual-layout-support .experiment-caption-text")
      .filter({ hasText: "Keep within-method MS fixed" }).waitFor();
    for (const theme of ["light", "dark"]) {
      const themed = new URL(ratioUrl);
      themed.searchParams.set("theme", theme);
      await page.goto(themed.href);
      const experiment = page.locator("section.present .distribution-experiment");
      const controls = experiment.locator('input[type="range"]');
      await controls.first().waitFor();
      for (const control of await controls.all()) {
        const original = await control.inputValue();
        for (const bound of ["min", "max"]) {
          await control.fill(await control.getAttribute(bound));
          await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
          const heights = await experiment.locator(".experiment-panels > figure > svg")
            .evaluateAll(nodes => nodes.map(svg => [svg.viewBox.baseVal.height, svg.clientHeight]));
          for (const [viewHeight, allocatedHeight] of heights) {
            assert.ok(viewHeight >= allocatedHeight * .85, "F plot lost its allocated height after changing " + bound);
          }
          if (bound === "max") assert.equal(heights.length, 1, "Nonzero MS must show the reference plot");
        }
        await control.fill(original);
      }
    }
    assert.equal(await page.locator("[data-teaching-category]").count(), 48);
    for (const [resource, predicate] of [
      ["l7-intro-takeaway-02", "guidingQuestion"],
      ["l7-spread-observation", "teachingObservation"],
      ["l7-spread-takeaway", "teachingTakeaway"],
      ["l7-intro-takeaway-12", "teachingPartialAnswer"],
      ["l7-next-18-takeaway", "answerResource"],
      ["l7-treatment-observations-takeaway", "teachingHint"],
    ]) {
      const roleIcon = page.locator(`[data-resource-id~="ex:${resource}"][data-teaching-content-role="cd:${predicate}"] .pcd-teaching-role-icon`);
      assert.equal(await roleIcon.count(), 1, resource);
    }
    const tukeyUrl = new URL(ratioUrl);
    tukeyUrl.hash = "/ex:l7-scene-post-hoc-spe--scene";
    await page.goto(tukeyUrl.href);
    const result = page.locator('section.present [data-resource-id~="ex:l7-post-hoc-spe-takeaway"]');
    await result.waitFor({ state: "attached" });
    assert.equal(await result.isVisible(), false);
    await page.keyboard.press("ArrowRight");
    await result.waitFor();
    assert.match(await result.innerText(), /A–C remains inconclusive/);
    assert.match(await result.innerText(), /equivalence requires a separate test/);
    await page.goto(new URL("/authoring-anova-intro-static.html", base).href);
    for (const [sceneId, expected] of [...cases, ...remainingCases]) {
      const article = page.locator(`article[data-pitch-step="ex:${sceneId}--scene"]`);
      for (const [resource] of expected) {
        await article.locator(`[data-resource-id~="ex:${resource}"]`).first().waitFor();
      }
    }
    console.log("ANOVA teaching stages, footer and static fallback passed.");
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
