// Capture blind-review images and visible text from the real local presentation.
const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require("playwright");

async function capture(packetDir, base) {
  const packet = JSON.parse(await fs.readFile(path.join(packetDir, "packet.json"), "utf8"));
  const response = await fetch(new URL("/" + packet.preview + "-runtime.json", base));
  if (!response.ok) throw Error("Preview runtime is unavailable");
  const runtime = await response.json();
  if (runtime.datasetFingerprint !== packet.datasetFingerprint) {
    throw Error("Preview differs from review packet. Regenerate preview and prepare a new packet.");
  }
  const browser = await chromium.launch();
  const screens = [];
  try {
    for (const theme of ["light", "dark"]) {
      for (const [index, scene] of packet.scenes.entries()) {
        const page = await browser.newPage({
          viewport: { width: 1440, height: 900 }, reducedMotion: "reduce",
        });
        page.setDefaultTimeout(15000);
        try {
          const url = new URL("/authoring.html", base);
          url.search = new URLSearchParams({
            preview: packet.preview, view: "deck", theme, interactive: "1",
          });
          url.hash = "/" + scene;
          await page.goto(url.href);
          const slide = page.locator('section.present[id="' + scene + '"]');
          await slide.waitFor();
          await page.evaluate(() => document.fonts.ready);
          await slide.locator(".pcd-teaching-category").waitFor();
          const stageCount = await slide.locator(".pcd-presentation-step-fragment").count();
          async function saveScreen(stage, probe) {
            await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
            const suffix = probe ? "-probe-" + probe.index + "-" + probe.bound : "";
            const image = String(index + 1).padStart(2, "0") + "-stage-" + stage + suffix + "-" + theme + ".png";
            await slide.screenshot({ path: path.join(packetDir, "blind", image), animations: "disabled" });
            screens.push({ scene, stage, theme, image, visibleText: await slide.innerText(), ...(probe ? { probe } : {}) });
          }
          for (let stage = 0; stage <= stageCount; stage++) {
            if (stage) {
              await page.keyboard.press("ArrowRight");
              await slide.locator(".pcd-presentation-step-fragment.visible").nth(stage - 1).waitFor({ state: "attached" });
            }
            await page.waitForFunction(() => !document.querySelector("section.present img:not([src])"));
            await saveScreen(stage);
          }
          const controls = slide.locator('input[type="range"]');
          for (let controlIndex = 0; controlIndex < await controls.count(); controlIndex++) {
            const control = controls.nth(controlIndex);
            if (!await control.isVisible()) continue;
            const original = await control.inputValue();
            const label = await control.evaluate(input => input.closest("label")?.textContent ?? input.getAttribute("aria-label"));
            for (const bound of ["min", "max"]) {
              const value = await control.getAttribute(bound);
              if (value === null) continue;
              await control.fill(value);
              await saveScreen(stageCount, { index: controlIndex, label, bound, value });
            }
            await control.fill(original);
          }
        } finally {
          await page.close();
        }
      }
    }
    await fs.writeFile(path.join(packetDir, "blind", "capture.json"), JSON.stringify({ screens }, null, 2));
    console.log("Captured " + screens.length + " stage images in " + packetDir);
  } finally {
    await browser.close();
  }
}

const packetDir = process.argv[2];
if (!packetDir) throw Error("Usage: node scripts/capture_didactic_review.cjs <packet-directory> [base-url]");
capture(path.resolve(packetDir), process.argv[3] ?? "http://127.0.0.1:5201").catch(error => {
  console.error(error);
  process.exitCode = 1;
});
