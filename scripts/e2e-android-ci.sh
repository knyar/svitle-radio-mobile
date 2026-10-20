#!/usr/bin/env bash
# CI wrapper around scripts/e2e-android.sh: exactly one retry, never silent.
# The first attempt's output is kept next to the second one and a GitHub
# warning annotation is emitted, so a run that only passed on retry is visible
# and does not count as a clean pass (see CI_PLAN.md, milestone 3).
set -euo pipefail

APK=${1:?usage: scripts/e2e-android-ci.sh <apk> [output-dir]}
OUT=${2:-e2e-output}

if scripts/e2e-android.sh "$APK" "$OUT"; then
  exit 0
fi

failed_flows=
if [[ -f "$OUT/maestro-report.xml" ]]; then
  failed_flows=$(awk '
    /<testcase/ && /status="[^"]+"/ && $0 !~ /status="SUCCESS"/ {
      name = $0
      sub(/^.*[[:space:]]name="/, "", name)
      sub(/".*/, "", name)
      names = names (names ? ", " : "") name
    }
    END { print names }
  ' "$OUT/maestro-report.xml" 2>/dev/null) || true
fi
failed_flows=${failed_flows:-unknown flow}
echo "::warning title=e2e-android retried::First Maestro attempt failed (${failed_flows}); retrying once. Evidence: ${OUT}-attempt-1/maestro-report.xml and ${OUT}-attempt-1/maestro/."
# The first attempt may fail before it creates its output directory.
if [[ -d "$OUT" ]]; then
  mv "$OUT" "${OUT}-attempt-1"
fi
scripts/e2e-android.sh "$APK" "$OUT"
