#!/usr/bin/env python3
"""Print the highest-confidence events from the public SportHub API."""

import json
import os
import urllib.request


BASE_URL = os.environ.get("SPORTHUB_API_BASE", "https://sporthub.sh/api").rstrip("/")


def get(path):
    request = urllib.request.Request(
        BASE_URL + path,
        headers={"Accept": "application/json", "User-Agent": "sporthub-api-example/1.0"},
    )
    with urllib.request.urlopen(request, timeout=10) as response:
        return json.load(response)


health = get("/health")
print(f"SportHub: {health['status']} · {health['posts']} posts · collected {health.get('collectedAt')}")

for event in get("/events")["events"][:5]:
    confidence = round(event["probability"] * 100)
    print(f"{confidence:>3}%  {event['player']:<20} {event['category']:<12} {event['url']}")
