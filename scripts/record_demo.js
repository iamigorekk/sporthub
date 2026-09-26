// Records the README demo: a scripted tour of sporthub.sh (landing → real signals → context → signal room → social feed) as PNG
// frames + a concat list with real frame durations, via a CDP screencast. Dev-only: needs node, a Playwright install
// (PW=/path/to/node_modules/playwright if not resolvable) and Chrome.
// Usage: node scripts/record_demo.js OUT_DIR   then   python3 scripts/readme_media.py --demo OUT_DIR
const path = require('path'), fs = require('fs');
const { chromium } = require(process.env.PW || 'playwright');
const OUT = process.argv[2], SITE = process.env.SITE || 'https://sporthub.sh';
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  let browser;
  try { browser = await chromium.launch({ channel: 'chrome' }); } catch { browser = await chromium.launch(); }
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const frames = [];
  let on = false, t0 = 0;
  const cdp = await page.context().newCDPSession(page);
  cdp.on('Page.screencastFrame', async ({ data, sessionId, metadata }) => {
    if (on) {
      const f = path.join(OUT, `f-${String(frames.length).padStart(4, '0')}.png`);
      fs.writeFileSync(f, Buffer.from(data, 'base64'));
      frames.push([f, metadata.timestamp]);
    }
    await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
  });
  const glide = (y, ms) => page.evaluate(([y, ms]) => new Promise(done => {  // eased scroll, not the instant jump
    const y0 = scrollY, t0 = performance.now();
    const step = now => { const k = Math.min(1, (now - t0) / ms), e = k < .5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
      scrollTo(0, y0 + (y - y0) * e); k < 1 ? requestAnimationFrame(step) : done(); };
    requestAnimationFrame(step);
  }), [y, ms]);
  const top = sel => page.$eval(sel, e => e.getBoundingClientRect().top + scrollY);

  // warm the page so fonts and photos are cached before the take
  await page.goto(SITE, { waitUntil: 'load' });
  await page.evaluate(() => scrollTo(0, document.body.scrollHeight));  // wakes the lazy frames
  await page.waitForTimeout(2500);
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(1500);

  await cdp.send('Page.startScreencast', { format: 'png', everyNthFrame: 1, maxWidth: 1440, maxHeight: 900 });
  on = true;
  await page.waitForTimeout(3500);                                   // 1. landing: particle giraffe + source cards
  await glide(await top('#signals') + 160, 1400);                    // 2. the real signals of the snapshot
  await page.waitForTimeout(3000);
  await glide(await top('#intelligence') + 150, 1400);               // 3. what changes before kick-off
  await page.waitForTimeout(1200);
  await page.click('#context-tab-1');                                //    Training → Travel
  await page.waitForTimeout(1800);
  await glide(await top('#terminal') + 150, 1400);                   // 4. match rooms
  await page.waitForTimeout(1800);
  await page.click('#restart-soccer');                               //    the signal room scan
  await glide(await top('#workspace') - 90, 1200);
  await page.waitForTimeout(6500);                                   //    capture → classify → player impact
  await glide(await top('#social-wire') - 40, 1400);                 // 5. the social feed
  await page.waitForTimeout(3500);
  on = false;
  await cdp.send('Page.stopScreencast');
  await browser.close();

  const lines = [];
  for (let i = 0; i < frames.length; i++) {
    const dur = i + 1 < frames.length ? frames[i + 1][1] - frames[i][1] : 0.05;
    lines.push(`file '${frames[i][0]}'`, `duration ${Math.max(dur, 0.005).toFixed(4)}`);
  }
  lines.push(`file '${frames[frames.length - 1][0]}'`);
  fs.writeFileSync(path.join(OUT, 'list.txt'), lines.join('\n') + '\n');
  const span = frames[frames.length - 1][1] - frames[0][1];
  console.log(JSON.stringify({ frames: frames.length, seconds: +span.toFixed(2), fps: +(frames.length / span).toFixed(1) }));
})();
