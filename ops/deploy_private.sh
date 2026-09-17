#!/usr/bin/env sh
set -eu

ENV_FILE="${SELLER_HUB_ENV_FILE:-.env.production}"
COMPOSE="docker compose --env-file ${ENV_FILE}"

if [ ! -f "$ENV_FILE" ]; then
  echo "Deployment blocked: missing $ENV_FILE" >&2
  exit 1
fi

python3 ops/launch_gate.py

$COMPOSE config >/dev/null
$COMPOSE up -d --build

printf '%s\n' 'Waiting for services to become ready...'
i=0
while [ "$i" -lt 30 ]; do
  if $COMPOSE exec -T backend python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/ready')" >/dev/null 2>&1; then
    echo 'Private deployment readiness: PASS'
    exit 0
  fi
  i=$((i + 1))
  sleep 2
done

echo 'Private deployment readiness: BLOCKED' >&2
$COMPOSE ps >&2
exit 1
