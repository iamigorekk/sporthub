#!/usr/bin/env sh
set -eu

BASE_URL="${SPORTHUB_API_BASE:-https://sporthub.sh/api}"

curl --fail --silent --show-error "${BASE_URL%/}/health"
printf '\n'
