#!/usr/bin/env bash
set -euo pipefail

OUT=${1:-e2e-output}
readonly E2E_API_PORT=8484
api_pid=

mkdir -p "$OUT"
OUT=$(cd "$OUT" && pwd)

cleanup() {
  status=$?
  if [[ -n "$api_pid" ]]; then
    kill "$api_pid" 2>/dev/null || true
    wait "$api_pid" 2>/dev/null || true
  fi
  exit "$status"
}
trap cleanup EXIT

node scripts/e2e-api/server.js --port "$E2E_API_PORT" > "$OUT/api-server.log" 2>&1 &
api_pid=$!
api_ready=0
for _attempt in {1..20}; do
  if curl -sf "http://127.0.0.1:$E2E_API_PORT/v2/preferences.svitle" >/dev/null; then
    api_ready=1
    break
  fi
  sleep 0.5
done
if (( api_ready == 0 )); then
  echo "local e2e API did not become ready on port $E2E_API_PORT; see $OUT/api-server.log" >&2
  exit 1
fi

maestro_args=()
if [[ -n "${UDID:-}" ]]; then
  maestro_args+=(--udid "$UDID")
fi

set +e
maestro "${maestro_args[@]}" test --format JUNIT --output "$OUT/maestro-report.xml" \
  --debug-output "$OUT/maestro" --test-output-dir "$OUT/maestro" --flatten-debug-output \
  -e APP_ID=org.svitle.app1 .maestro/
maestro_status=$?
set -e
exit "$maestro_status"
