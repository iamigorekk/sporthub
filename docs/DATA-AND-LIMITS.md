# Data and limits

SportHub is an early sports-intelligence product. The interface is polished; the data boundary must stay explicit.

## Available today

- A read-only API at `https://sporthub.sh/api`: four `GET` routes, no key, no write routes.
- Two free match breakdowns (the two nearest soccer matches); for every other match `/events` and `/state` answer `403` (`"error": "vip"`).
- Source-backed event cards with player, category, confidence and publication time.
- Featured-match coverage and an experimental two-team terminal state.
- A server-side X and Jev integration whose latest status is reported by `/health`.
- A multisport visual product shell for football, basketball, MMA, esports and women's tennis.

## Preview constraints

- `/health` is the source of truth for collection freshness. A successful request does not guarantee that every watched account posted or was available.
- `/events` may contain saved classifications from the latest completed snapshot rather than a real-time stream.
- Event time is unknown when the source does not establish it. `eventDate: null` is expected.
- Classification probability is not proof of the underlying event.
- HP is an experimental context score and should not be treated as medical or betting advice.
- `/state` is an experimental internal view; its field names are not stable, do not depend on them.
- Cross-origin browser access, authentication, quotas and an uptime SLA have not been published.

## Demonstrated product surfaces

The signal room scan, the social feed and the multisport rooms demonstrate the intended interaction model. They do not imply continuous collection for every sport. SHUB Pass currently demonstrates a holder-access flow; production wallet verification is not active.

## Planned extensions

- verified fixture and roster feeds;
- continuous multi-match monitoring;
- event clustering across repeated reports;
- wallet-backed SHUB Pass access;
- alerts and historical signal timelines;
- prediction-market context beside the event feed.

Integrators should cache responses, display the source, preserve unknown values and treat a stale `collectedAt` timestamp as stale coverage.
