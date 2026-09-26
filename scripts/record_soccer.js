// Records the README footer: the soccer post-analysis demo (a local 11 MB single-file design, kept out of git) in
// real time via a CDP screencast. Dev-only: node, Playwright (PW=...), Chrome.
// Usage: node scripts/record_soccer.js OUT_DIR "/path/to/sporthub-soccer.html"  → frames + times.json, where times are
// seconds from the page's own motion=0; a loop is 9.9 s (99 images × FRAME_MS 100), use the second one, t = 9.9 … 19.8 s
// (the first still shows the page loading). Encode (~2.3 MB, 99 frames):
//   ffmpeg -f concat -i list.txt (frames of 9.9 … 19.8 s) -vf "fps=10,scale=960:-1:flags=lanczos,split[a][b];
//     [a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4" -frames:v 99 docs/assets/soccer-room.gif
const fs = require('fs'), path = require('path'), { pathToFileURL } = require('url');
const { chromium } = require(process.env.PW);
const OUT = process.argv[2];
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ channel: 'chrome' });
  const page = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  const cdp = await page.context().newCDPSession(page);
  const frames = [];
  cdp.on('Page.screencastFrame', async ({ data, sessionId, metadata }) => {
    const f = path.join(OUT, `f-${String(frames.length).padStart(4, '0')}.png`);
    fs.writeFileSync(f, Buffer.from(data, 'base64')); frames.push([f, metadata.timestamp]);
    await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
  });
  await cdp.send('Page.startScreencast', { format: 'png', everyNthFrame: 1, maxWidth: 1920, maxHeight: 1080 });
  await page.goto(pathToFileURL(path.resolve(process.argv[3])).href);
  await page.waitForTimeout(3000);
  const t0 = await page.evaluate(() => (Date.now() - motion) / 1000); // epoch of motion=0 (page's top-level `let`)
  await page.waitForTimeout(19000);
  await cdp.send('Page.stopScreencast'); await b.close();
  fs.writeFileSync(path.join(OUT, 'times.json'), JSON.stringify(frames.map(f => [path.basename(f[0]), +(f[1] - t0).toFixed(3)])));
  console.log(frames.length, (frames.at(-1)[1] - t0).toFixed(2));
})();
