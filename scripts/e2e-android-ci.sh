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

echo "::warning title=e2e-android retried::First Maestro attempt failed; retrying once (first attempt kept in ${OUT}-attempt-1)."
# The first attempt may fail before it creates its output directory.
if [[ -d "$OUT" ]]; then
  mv "$OUT" "${OUT}-attempt-1"
fi
scripts/e2e-android.sh "$APK" "$OUT"
