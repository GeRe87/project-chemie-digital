/* Local preview regression: visual-first placement, card identity and bounds. */
const assert = require('node:assert/strict');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

(async () => {
  const browser = await chromium.launch({channel: 'msedge'});
  try {
    for (const theme of ['light', 'dark']) for (const width of [1642, 1280, 390]) {
      const page = await browser.newPage({viewport: {width, height: 966}});
      await page.goto(`http://127.0.0.1:5173/authoring.html?preview=authoring-level5-review-complete&view=scroll&appearance-controls=hidden&theme=${theme}`);
      await page.locator('.pcd-script-toggle').waitFor();
      const scenes = page.locator('section[data-composition-profile="visual-cards"]');
      assert(await scenes.count() >= 1);
      for (const scene of await scenes.all()) {
        await scene.scrollIntoViewIfNeeded();
        const result = await scene.evaluate(s => {
          const bounds = s.getBoundingClientRect();
          const image = s.querySelector('img');
          const cards = [...s.querySelectorAll('.definition-list-entry')];
          return {
            id: s.id, imageBottom: image.getBoundingClientRect().bottom,
            imageFirst: Boolean(image.compareDocumentPosition(cards[0]) & Node.DOCUMENT_POSITION_FOLLOWING),
            left: bounds.left, right: bounds.right, bottom: bounds.bottom,
            cards: cards.map(c => c.getBoundingClientRect().toJSON()),
            colors: [...s.querySelectorAll('.definition-list-term')].map(c => getComputedStyle(c).backgroundColor),
          };
        });
        assert(result.imageFirst, result.id);
        assert(result.cards.every(c => c.top >= result.imageBottom - 2), result.id);
        assert(result.cards.every(c => c.left >= result.left - 2 && c.right <= result.right + 2), result.id);
        if (width > 700) assert(result.cards.every(c => c.bottom <= result.bottom - 8), result.id);
        assert(result.colors.every(c => c !== 'rgba(0, 0, 0, 0)'), result.id);
      }
      console.log(`${theme} ${width}: ${await scenes.count()} visual/card layouts passed`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
