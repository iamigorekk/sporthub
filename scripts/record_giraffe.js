// Records one 10 s cycle of the SportHub giraffe (docs/assets/brand/giraffe.html) as PNG frames by seeking every CSS
// animation to an exact time, so the loop is seamless and the frame rate is not tied to the machine. Dev-only: needs
// node, a Playwright install (PW=/path/to/node_modules/playwright if not resolvable) and Chrome.
// Usage: node scripts/record_giraffe.js OUT_DIR [fps]   then   python3 scripts/readme_media.py OUT_DIR
const path = require('path'), fs = require('fs');
const { chromium } = require(process.env.PW || 'playwright');
const OUT = process.argv[2], FPS = +(process.argv[3] || 12), CYCLE = 10000;
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  let browser;
  try { browser = await chromium.launch({ channel: 'chrome' }); } catch { browser = await chromium.launch(); }
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  await page.goto('file://' + path.resolve(__dirname, '../docs/assets/brand/giraffe.html'));
  const mascot = page.locator('.mascot');
  const n = Math.round(CYCLE / 1000 * FPS);
  for (let i = 0; i < n; i++) {
    await page.evaluate(t => document.getAnimations().forEach(a => { a.pause(); a.currentTime = t; }), i * CYCLE / n);
    await mascot.screenshot({ path: path.join(OUT, `g-${String(i).padStart(3, '0')}.png`) });
  }
  await browser.close();
  console.log(JSON.stringify({ frames: n, fps: FPS }));
})();
