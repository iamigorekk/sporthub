# SportHub API

The preview API exposes the same cached intelligence used by [sporthub.sh](https://sporthub.sh). It is read-only and requires no API key today.

```text
https://sporthub.sh/api
```

## Endpoints

### `GET /health`

Returns service status, the latest collection timestamp, snapshot volume and whether the private upstream integrations are configured.

```json
{
  "status": "ok",
  "service": "sporthub-api",
  "version": 2,
  "collectedAt": "2026-09-26T05:49:12+00:00",
  "posts": 1198,
  "judged": 1198,
  "matches": 28,
  "integrations": {
    "twitter": true,
    "jev": true
  }
}
```

### `GET /matches`

Every upcoming match in the snapshot, nearest first, across soccer, basketball, tennis, MMA and esports. Matches drop off three hours after kick-off.

```json
{
  "collectedAt": "2026-09-26T05:44:09Z",
  "freeMatches": 2,
  "matches": [
    {
      "id": "borussia-dortmund-werder-bremen-2026-10-09",
      "sport": "soccer",
      "competition": "Bundesliga",
      "home": "Borussia Dortmund",
      "away": "Werder Bremen",
      "startsAt": "2026-10-09T18:30:00+00:00",
      "access": "free",
      "signals": 27,
      "url": "https://www.bundesliga.com/en/bundesliga/matchday",
      "teams": [
        { "name": "Borussia Dortmund", "hp": 99, "players": 34 },
        { "name": "Werder Bremen", "hp": 100, "players": 35 }
      ]
    }
  ]
}
```

`access` is `free` for the two nearest soccer matches and `vip` for the rest (SportHub Pass, 1,000,000 `$SportHub`).

### `GET /events?match=<id>`

Returns structured, source-backed event cards for one match. Without `match`, returns the events of all free matches, strongest first. Reports of the same event about the same player are collapsed into one card; `reports` counts them.

Each event includes:

| Field | Meaning |
| --- | --- |
| `player` | Matched player name |
| `category` | Event category: `injury`, `return`, `training`, `travel`, `discipline`, … |
| `summary` | One-line description of the event, the text the website card shows |
| `probability` | Jev's answer to the category question, from `0` to `1` |
| `identityConfidence` | Confidence in the player match, from `0` to `1` |
| `source` | Original public account |
| `text` | Preserved source text |
| `url` | Original source URL |
| `publishedAt` | Source publication timestamp when available |
| `eventDate` | Underlying event timestamp, or `null` when unverified |
| `freshnessClass` | Model position on the configured event-time scale |
| `sourceWeight` | Internal source-quality multiplier |
| `verified` | `true` when the signal was hand-checked against its source |
| `sport`, `match` | Which match the event belongs to |
| `reports` | How many collected posts reported this event |

Top-level `posts` and `judged` describe the snapshot volume.

### `GET /state?match=<id>`

Without `match`, the first free match. Returns the full breakdown rendered by the experimental match terminal: team HP, player cards, evidence, uncertain signals and the priority feed. This is an experimental internal view: its field names are not stable, do not depend on them.

## HTTP behaviour

- Successful responses use `200` and `application/json; charset=utf-8`.
- Unknown `/api/*` paths and unknown match ids return `404` with `{ "error": "not found" }`.
- VIP matches on `/events` and `/state` return `403` with `{ "error": "vip", "access": "vip", "requires": "1000000 SportHub", "match": {…}, "signals": N }`.
- Snapshot read failures return `500` with a short error type.
- Responses currently send `Cache-Control: no-store`.
- Only `GET` is served; no write routes are exposed (other methods return `501`).

## Client guidance

Use `/health` before relying on a snapshot and compare `collectedAt` with your acceptable freshness window. Cache responses in your own service, use timeouts and exponential backoff, and keep the original `url` visible anywhere you display an event.

The current preview has no published rate-limit or uptime SLA. Browser clients on another origin should use their own server-side proxy until SportHub publishes a CORS contract.

## Contract

The machine-readable contract is [`openapi.yaml`](openapi.yaml). Minimal clients are available in [`examples/`](examples/).
