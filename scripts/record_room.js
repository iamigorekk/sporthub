// Records the README footer: the particle giraffe of the signal room (a local design file under references/,
// kept out of git, 8.7 MB) in real time via a CDP screencast. Dev-only: node, Playwright (PW=...), Chrome.
// Usage: node scripts/record_room.js OUT_DIR "$PWD/references/<giraffe design>.html"  → frames + times.json; one loop is
// t = 3.0 … 15.8 s (cycleStart 2.6 + cycleLen 12.8). Encode: ffmpeg concat of that span with
//   fps=10,crop=760:960:880:100,scale=480:-1, palettegen max_colors=32 → docs/assets/signal-room.gif (~7 MB)
const { chromium } = require(process.env.PW);
const OUT = process.argv[2];
(async () => {
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
  await page.goto('file://' + process.argv[3]);
  await page.waitForTimeout(18000);
  await cdp.send('Page.stopScreencast'); await b.close();
  const t0 = frames[0][1];
  fs.writeFileSync(path.join(OUT, 'times.json'), JSON.stringify(frames.map(f => [path.basename(f[0]), +(f[1] - t0).toFixed(3)])));
  console.log(frames.length, (frames.at(-1)[1] - t0).toFixed(2));
})();
