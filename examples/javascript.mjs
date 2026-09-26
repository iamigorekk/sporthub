const baseUrl = (process.env.SPORTHUB_API_BASE || 'https://sporthub.sh/api').replace(/\/$/, '');

async function get(path) {
  const response = await fetch(baseUrl + path, {
    headers: { Accept: 'application/json', 'User-Agent': 'sporthub-api-example/1.0' },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`SportHub ${response.status}: ${await response.text()}`);
  return response.json();
}

const health = await get('/health');
console.log(`SportHub: ${health.status} · ${health.posts} posts · collected ${health.collectedAt}`);

const { events } = await get('/events');
for (const event of events.slice(0, 5)) {
  console.log(`${Math.round(event.probability * 100)}%\t${event.player}\t${event.category}\t${event.url}`);
}
